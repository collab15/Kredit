# Kredit
Tokenizing Wellfare Into Real World Value

## 📦 Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/collab15/Kredit
cd kredit/frontend
npm install
cd ../backend
npm install
cd ..
npm install        # installs concurrently at root
# New-line(Enter) for last command to execute
```

## ⚙️ Environment Setup

Make a .env file and fill in your PostgreSQL credentials:

```env
DATABASE_URL=<postgresql-connection-string>
PORT=5000
CLIENT_URL=http://localhost:5173
```

## 🚀 Running the App

From the root `kredit/` folder, run both frontend and backend together:

```bash
npm run dev        # starts both servers
```

- **Frontend** → http://localhost:5173
- **Backend API** → http://localhost:5000


## 🗄️ Database Setup

Run the following in PostgreSQL (via psql or pgAdmin):

```sql
CREATE DATABASE kredit;
\c kredit

-- ============================================================
-- KREDIT — Full PostgreSQL DDL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ADMINS
-- ============================================================
CREATE TABLE admins (
  admin_id     UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  username     TEXT        NOT NULL UNIQUE,
  password     TEXT        NOT NULL,
  joining_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INFO  (shared contact table for users and orgs)
-- ============================================================
CREATE TABLE info (
  info_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone   TEXT,
  email   TEXT,
  address TEXT
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  user_id      UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  username     TEXT          NOT NULL UNIQUE,
  password     TEXT          NOT NULL,
  balance      NUMERIC(14,2) NOT NULL DEFAULT 0,
  joining_date TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT balance_non_negative CHECK (balance >= 0)
);

-- ============================================================
-- USER_INFO  (extends info, links to users — table-per-type)
-- ============================================================
CREATE TABLE user_info (
  info_id    UUID PRIMARY KEY REFERENCES info(info_id)  ON DELETE CASCADE,
  user_id    UUID NOT NULL    REFERENCES users(user_id) ON DELETE CASCADE,
  first_name TEXT,
  last_name  TEXT,
  gender     TEXT,
  age        INTEGER,

  CONSTRAINT age_valid CHECK (age IS NULL OR age > 0)
);

-- ============================================================
-- BALANCE AUDIT
-- ============================================================
CREATE TABLE balance_audit (
  audit_id    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  old_balance NUMERIC(14,2) NOT NULL,
  new_balance NUMERIC(14,2) NOT NULL,
  delta       NUMERIC(14,2) NOT NULL,
  changed_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ============================================================
-- ORGS
-- ============================================================
CREATE TABLE orgs (
  org_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key  TEXT NOT NULL UNIQUE,
  password TEXT
);

-- ============================================================
-- ORG_INFO  (extends info, links to orgs)
-- ============================================================
CREATE TABLE org_info (
  info_id  UUID PRIMARY KEY REFERENCES info(info_id) ON DELETE CASCADE,
  org_id   UUID NOT NULL    REFERENCES orgs(org_id)  ON DELETE CASCADE,
  delegate TEXT,
  website  TEXT,
  name     TEXT
);

-- ============================================================
-- ORG SUBTYPES  (one row per org in exactly one of these)
-- ============================================================
CREATE TABLE partnered (
  org_id   UUID PRIMARY KEY REFERENCES orgs(org_id) ON DELETE CASCADE,
  services TEXT
);

CREATE TABLE agencies (
  org_id UUID PRIMARY KEY REFERENCES orgs(org_id) ON DELETE CASCADE,
  scope  TEXT
);

-- ============================================================
-- FAVOURS
-- ============================================================
CREATE TABLE favours (
  favour_id    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  description  TEXT,
  compensation NUMERIC(14,2) NOT NULL DEFAULT 0,
  requestor_id UUID          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  requestee_id UUID          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

  CONSTRAINT no_self_favour        CHECK (requestor_id <> requestee_id),
  CONSTRAINT compensation_non_neg  CHECK (compensation >= 0)
);

CREATE TABLE pending_favours (
  favour_id         UUID    PRIMARY KEY REFERENCES favours(favour_id) ON DELETE CASCADE,
  activation_status BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE completed_favours (
  favour_id UUID        PRIMARY KEY REFERENCES favours(favour_id) ON DELETE CASCADE,
  done_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  review    TEXT
);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE transactions (
  transaction_id UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount         NUMERIC(12,2) NOT NULL,
  description    TEXT,
  time_stamp     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT amount_positive CHECK (amount > 0)
);

CREATE TABLE peer_transactions (
  transaction_id UUID PRIMARY KEY REFERENCES transactions(transaction_id) ON DELETE CASCADE,
  sender_id      UUID NOT NULL    REFERENCES users(user_id)               ON DELETE CASCADE,
  receiver_id    UUID NOT NULL    REFERENCES users(user_id)               ON DELETE CASCADE,

  CONSTRAINT no_self_transfer CHECK (sender_id <> receiver_id)
);

CREATE TABLE rewards (
  transaction_id UUID PRIMARY KEY REFERENCES transactions(transaction_id) ON DELETE CASCADE,
  rewardee_id    UUID NOT NULL    REFERENCES users(user_id)               ON DELETE CASCADE,
  org_id         UUID NOT NULL    REFERENCES orgs(org_id)                 ON DELETE CASCADE
);

CREATE TABLE org_payments (
  transaction_id UUID PRIMARY KEY REFERENCES transactions(transaction_id) ON DELETE CASCADE,
  payer_id       UUID NOT NULL    REFERENCES users(user_id)               ON DELETE CASCADE,
  org_id         UUID NOT NULL    REFERENCES orgs(org_id)                 ON DELETE CASCADE
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX ON user_info(user_id);
CREATE INDEX ON org_info(org_id);
CREATE INDEX ON favours(requestor_id);
CREATE INDEX ON favours(requestee_id);
CREATE INDEX ON peer_transactions(sender_id);
CREATE INDEX ON peer_transactions(receiver_id);
CREATE INDEX ON rewards(org_id);
CREATE INDEX ON rewards(rewardee_id);
CREATE INDEX ON transactions(time_stamp DESC);
CREATE INDEX ON balance_audit(user_id);
CREATE INDEX ON balance_audit(changed_at DESC);

-- ============================================================
-- TRIGGER 1
-- Stops a user from creating a favour with themselves
-- ============================================================
CREATE OR REPLACE FUNCTION fn_prevent_self_favour()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.requestor_id = NEW.requestee_id THEN
    RAISE EXCEPTION 'Requestor and requestee cannot be the same user.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_self_favour ON favours;
CREATE TRIGGER trg_prevent_self_favour
  BEFORE INSERT ON favours
  FOR EACH ROW
  EXECUTE FUNCTION fn_prevent_self_favour();

-- ============================================================
-- TRIGGER 2
-- When a favour is created, automatically add it to pending_favours
-- ============================================================
CREATE OR REPLACE FUNCTION fn_auto_pending_favour()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pending_favours (favour_id, activation_status)
  VALUES (NEW.favour_id, FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_pending_favour ON favours;
CREATE TRIGGER trg_auto_pending_favour
  AFTER INSERT ON favours
  FOR EACH ROW
  EXECUTE FUNCTION fn_auto_pending_favour();

-- ============================================================
-- TRIGGER 3
-- When a pending favour is marked TRUE, move it to completed_favours
-- and credit the compensation to the requestee
-- ============================================================
CREATE OR REPLACE FUNCTION fn_complete_favour()
RETURNS TRIGGER AS $$
DECLARE
  v_compensation NUMERIC(14,2);
  v_requestee_id UUID;
BEGIN
  IF NEW.activation_status = TRUE AND OLD.activation_status = FALSE THEN
    -- Add to completed with a timestamp
    INSERT INTO completed_favours (favour_id, done_at)
    VALUES (NEW.favour_id, now());

    -- Remove from pending
    DELETE FROM pending_favours WHERE favour_id = NEW.favour_id;

    -- Credit compensation to requestee if set
    SELECT compensation, requestee_id INTO v_compensation, v_requestee_id
    FROM favours WHERE favour_id = NEW.favour_id;

    IF v_compensation > 0 THEN
      UPDATE users SET balance = balance + v_compensation WHERE user_id = v_requestee_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_complete_favour ON pending_favours;
CREATE TRIGGER trg_complete_favour
  AFTER UPDATE OF activation_status ON pending_favours
  FOR EACH ROW
  EXECUTE FUNCTION fn_complete_favour();

-- ============================================================
-- TRIGGER 4
-- When a peer transaction is recorded, debit the sender and credit the receiver
-- ============================================================
CREATE OR REPLACE FUNCTION fn_peer_transfer_balances()
RETURNS TRIGGER AS $$
DECLARE
  v_amount NUMERIC(12,2);
BEGIN
  -- Get the transfer amount from the transactions table
  SELECT amount INTO v_amount
  FROM   transactions
  WHERE  transaction_id = NEW.transaction_id;

  IF v_amount IS NULL THEN
    RAISE EXCEPTION 'Transaction % not found.', NEW.transaction_id;
  END IF;

  -- Debit sender (balance CHECK constraint blocks overdraft)
  UPDATE users SET balance = balance - v_amount WHERE user_id = NEW.sender_id;

  -- Credit receiver
  UPDATE users SET balance = balance + v_amount WHERE user_id = NEW.receiver_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_peer_transfer_balances ON peer_transactions;
CREATE TRIGGER trg_peer_transfer_balances
  AFTER INSERT ON peer_transactions
  FOR EACH ROW
  EXECUTE FUNCTION fn_peer_transfer_balances();

-- ============================================================
-- TRIGGER 5
-- When an agency reward is recorded, credit the user's balance
-- ============================================================
CREATE OR REPLACE FUNCTION fn_reward_credit_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_amount NUMERIC(12,2);
BEGIN
  -- Get the reward amount from the transactions table
  SELECT amount INTO v_amount
  FROM   transactions
  WHERE  transaction_id = NEW.transaction_id;

  IF v_amount IS NULL THEN
    RAISE EXCEPTION 'Transaction % not found.', NEW.transaction_id;
  END IF;

  UPDATE users SET balance = balance + v_amount WHERE user_id = NEW.rewardee_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reward_credit_balance ON rewards;
CREATE TRIGGER trg_reward_credit_balance
  AFTER INSERT ON rewards
  FOR EACH ROW
  EXECUTE FUNCTION fn_reward_credit_balance();

-- ============================================================
-- TRIGGER 6
-- When a user pays an org, debit the user's balance
-- ============================================================
CREATE OR REPLACE FUNCTION fn_org_payment_debit()
RETURNS TRIGGER AS $$
DECLARE
  v_amount NUMERIC(12,2);
BEGIN
  -- Get the payment amount from the transactions table
  SELECT amount INTO v_amount
  FROM   transactions
  WHERE  transaction_id = NEW.transaction_id;

  IF v_amount IS NULL THEN
    RAISE EXCEPTION 'Transaction % not found.', NEW.transaction_id;
  END IF;

  -- Debit payer (balance CHECK constraint blocks overdraft)
  UPDATE users SET balance = balance - v_amount WHERE user_id = NEW.payer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_org_payment_debit ON org_payments;
CREATE TRIGGER trg_org_payment_debit
  AFTER INSERT ON org_payments
  FOR EACH ROW
  EXECUTE FUNCTION fn_org_payment_debit();

-- ============================================================
-- TRIGGER 7
-- Every time a user's balance changes, log the old and new values
-- ============================================================
CREATE OR REPLACE FUNCTION fn_balance_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.balance IS DISTINCT FROM NEW.balance THEN
    INSERT INTO balance_audit (user_id, old_balance, new_balance, delta)
    VALUES (NEW.user_id, OLD.balance, NEW.balance, NEW.balance - OLD.balance);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_balance_audit ON users;
CREATE TRIGGER trg_balance_audit
  AFTER UPDATE OF balance ON users
  FOR EACH ROW
  EXECUTE FUNCTION fn_balance_audit();
```

## 🧱 Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, React Router |
| Backend   | Node.js, Express.js                     |
| Database  | PostgreSQL (via `pg` package)           |
| Dev Tools | Nodemon, Concurrently                   |

## 📁 Project Structure

```
kredit/
├── package.json           # root — runs both with npm run dev
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── controllers/
│   └── .env
└── frontend/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   └── pages/
    └── vite.config.js
```

## ✨ Features

- 👤 **User Accounts** — Register users with profiles and kred balances
- 🏢 **Organizations** — Agencies that reward users, Partnered orgs that accept kreds
- ⚡ **Kred Transfers** — Peer-to-peer kred exchange between users
- 🤝 **Favours** — Request, track, and complete favours between users
- 📊 **Transaction Ledger** — Full history of all kred movements
- 🔒 **Balance Enforcement** — No negative balances, validated transfers

## 👥 Team

| Name | ID |
|---|---|
| M. Talha Asif | 576751 |
| M. Shazel Rizwan | 550820 |
| Rao Ahmed Shehrayar Aleem | 542830 |
| M. Abdul Qayyum Khan | 558351 |

---

*CS-220 Database Systems — Project*