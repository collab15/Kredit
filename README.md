# PactBase
# Promises Etched Onto Eternity.
A Real-World Project solving a real-world problem.
Phase 2 is onto a gradual start

## 📦 Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/AhmedShehryar-work/PactBase
cd pactbase/frontend
npm install
cd ../backend
npm install
```

## 🚀 Running the App

From the root `kredit/` folder, run both frontend and backend together:

```bash
npm install        # installs concurrently at root
npm run dev        # starts both servers
```

- **Frontend** → http://localhost:5173
- **Backend API** → http://localhost:5000

## ⚙️ Environment Setup

Copy the example env file and fill in your PostgreSQL credentials:

```bash
cp backend/.env.example backend/.env
```

```env
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/kredit
PORT=5000
CLIENT_URL=http://localhost:5173
```

## 🗄️ Database Setup

Run the following in PostgreSQL (via psql or pgAdmin):

```sql
CREATE DATABASE kredit;
\c kredit

-- ============================================================
-- KREDIT — Full PostgreSQL DDL
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- INFO  (shared contact table for users and orgs)
-- ============================================================
CREATE TABLE info (
  info_id   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone     TEXT,
  email     TEXT,
  address   TEXT
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
  info_id    UUID  PRIMARY KEY REFERENCES info(info_id)  ON DELETE CASCADE,
  user_id    UUID  NOT NULL    REFERENCES users(user_id) ON DELETE CASCADE,
  first_name TEXT,
  last_name  TEXT,
  gender     TEXT,
  age        INTEGER,

  CONSTRAINT age_valid CHECK (age IS NULL OR age > 0)
);

-- ============================================================
-- ORGS
-- ============================================================
CREATE TABLE orgs (
  org_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key TEXT NOT NULL UNIQUE
);

-- ============================================================
-- ORG_INFO  (extends info, links to orgs)
-- ============================================================
CREATE TABLE org_info (
  info_id  UUID PRIMARY KEY REFERENCES info(info_id) ON DELETE CASCADE,
  org_id   UUID NOT NULL    REFERENCES orgs(org_id)  ON DELETE CASCADE,
  delegate TEXT,
  website  TEXT
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
  favour_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description  TEXT,
  requestor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  requestee_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

  CONSTRAINT no_self_favour CHECK (requestor_id <> requestee_id)
);

CREATE TABLE completed_favours (
  favour_id UUID        PRIMARY KEY REFERENCES favours(favour_id) ON DELETE CASCADE,
  done_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  review    TEXT
);

CREATE TABLE pending_favours (
  favour_id         UUID    PRIMARY KEY REFERENCES favours(favour_id) ON DELETE CASCADE,
  activation_status BOOLEAN NOT NULL DEFAULT FALSE
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
  rewarder_id    UUID NOT NULL    REFERENCES users(user_id)               ON DELETE CASCADE,
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
CREATE INDEX ON rewards(rewarder_id);
CREATE INDEX ON transactions(time_stamp DESC);

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