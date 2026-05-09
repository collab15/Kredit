-- ============================================================
--  KreditBase — complete DDL  (run on a clean PostgreSQL DB)
--  Extensions required: uuid-ossp, pgcrypto
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Admins (separate table, no balance, no info) ──────────

CREATE TABLE admins (
  admin_id     UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  username     TEXT        NOT NULL UNIQUE,
  password     TEXT        NOT NULL,
  joining_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Core contact info (shared by users & orgs) ────────────

CREATE TABLE info (
  info_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone    TEXT,
  email    TEXT,
  address  TEXT
);

-- ─── Users (no role column — all entries are regular users) ─

CREATE TABLE users (
  user_id      UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  username     TEXT          NOT NULL UNIQUE,
  password     TEXT          NOT NULL,
  balance      NUMERIC(14,2) NOT NULL DEFAULT 0,
  joining_date TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE user_info (
  info_id    UUID    PRIMARY KEY REFERENCES info(info_id)  ON DELETE CASCADE,
  user_id    UUID    NOT NULL    REFERENCES users(user_id) ON DELETE CASCADE,
  first_name TEXT,
  last_name  TEXT,
  gender     TEXT,
  age        INTEGER
);

-- ─── Balance audit (user balance change log) ───────────────

CREATE TABLE balance_audit (
  audit_id    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  old_balance NUMERIC(12,2) NOT NULL,
  new_balance NUMERIC(12,2) NOT NULL,
  delta       NUMERIC(12,2) NOT NULL,
  changed_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ─── Organizations ─────────────────────────────────────────

CREATE TABLE orgs (
  org_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key  TEXT NOT NULL UNIQUE,
  password TEXT
);

CREATE TABLE org_info (
  info_id  UUID PRIMARY KEY REFERENCES info(info_id) ON DELETE CASCADE,
  org_id   UUID NOT NULL    REFERENCES orgs(org_id)  ON DELETE CASCADE,
  delegate TEXT,
  website  TEXT,
  name     TEXT
);

-- Agency orgs: issue unlimited kreds to users (no balance)
CREATE TABLE agencies (
  org_id UUID PRIMARY KEY REFERENCES orgs(org_id) ON DELETE CASCADE,
  scope  TEXT
);

-- Partnered orgs: accept kreds from users (no balance)
CREATE TABLE partnered (
  org_id   UUID PRIMARY KEY REFERENCES orgs(org_id) ON DELETE CASCADE,
  services TEXT
);

-- ─── Transactions (parent record for all money moves) ──────

CREATE TABLE transactions (
  transaction_id UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount         NUMERIC(12,2) NOT NULL,
  description    TEXT,
  time_stamp     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- User ↔ User peer transfer
CREATE TABLE peer_transactions (
  transaction_id UUID PRIMARY KEY REFERENCES transactions(transaction_id) ON DELETE CASCADE,
  sender_id      UUID NOT NULL    REFERENCES users(user_id) ON DELETE CASCADE,
  receiver_id    UUID NOT NULL    REFERENCES users(user_id) ON DELETE CASCADE
);

-- Agency → User reward
-- NOTE: rewarder_id = the USER being rewarded; org_id = the issuing agency
-- Agencies have unlimited kreds — no debit occurs on the agency side
CREATE TABLE rewards (
  transaction_id UUID PRIMARY KEY REFERENCES transactions(transaction_id) ON DELETE CASCADE,
  rewarder_id    UUID NOT NULL    REFERENCES users(user_id) ON DELETE CASCADE,
  org_id         UUID NOT NULL    REFERENCES orgs(org_id)  ON DELETE CASCADE
);

-- User → Partnered org payment (user is debited; org has no balance)
CREATE TABLE org_payments (
  transaction_id UUID PRIMARY KEY REFERENCES transactions(transaction_id) ON DELETE CASCADE,
  payer_id       UUID NOT NULL    REFERENCES users(user_id) ON DELETE CASCADE,
  org_id         UUID NOT NULL    REFERENCES orgs(org_id)  ON DELETE CASCADE
);

-- ─── Favours ───────────────────────────────────────────────

CREATE TABLE favours (
  favour_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description  TEXT,
  requestor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  requestee_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE pending_favours (
  favour_id         UUID    PRIMARY KEY REFERENCES favours(favour_id) ON DELETE CASCADE,
  activation_status BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE completed_favours (
  favour_id UUID        PRIMARY KEY REFERENCES favours(favour_id) ON DELETE CASCADE,
  done_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  review    TEXT
);

-- ============================================================
--  TRIGGER FUNCTIONS
-- ============================================================

-- 1. Peer transfer: debit sender, credit receiver
CREATE OR REPLACE FUNCTION fn_peer_transfer_balances()
RETURNS TRIGGER AS $$
DECLARE v_amount NUMERIC(12,2);
BEGIN
  SELECT amount INTO v_amount FROM transactions WHERE transaction_id = NEW.transaction_id;
  IF v_amount IS NULL THEN RAISE EXCEPTION 'Transaction % not found.', NEW.transaction_id; END IF;
  UPDATE users SET balance = balance - v_amount WHERE user_id = NEW.sender_id;
  UPDATE users SET balance = balance + v_amount WHERE user_id = NEW.receiver_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_peer_transfer_balances
  AFTER INSERT ON peer_transactions
  FOR EACH ROW EXECUTE FUNCTION fn_peer_transfer_balances();

-- 2. Agency reward: credit the rewarded user only
CREATE OR REPLACE FUNCTION fn_reward_credit_balance()
RETURNS TRIGGER AS $$
DECLARE v_amount NUMERIC(12,2);
BEGIN
  SELECT amount INTO v_amount FROM transactions WHERE transaction_id = NEW.transaction_id;
  IF v_amount IS NULL THEN RAISE EXCEPTION 'Transaction % not found.', NEW.transaction_id; END IF;
  UPDATE users SET balance = balance + v_amount WHERE user_id = NEW.rewarder_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reward_credit_balance
  AFTER INSERT ON rewards
  FOR EACH ROW EXECUTE FUNCTION fn_reward_credit_balance();

-- 3. Org payment: debit the paying user only
CREATE OR REPLACE FUNCTION fn_org_payment_balances()
RETURNS TRIGGER AS $$
DECLARE v_amount NUMERIC(12,2);
BEGIN
  SELECT amount INTO v_amount FROM transactions WHERE transaction_id = NEW.transaction_id;
  IF v_amount IS NULL THEN RAISE EXCEPTION 'Transaction % not found.', NEW.transaction_id; END IF;
  UPDATE users SET balance = balance - v_amount WHERE user_id = NEW.payer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_org_payment_balances
  AFTER INSERT ON org_payments
  FOR EACH ROW EXECUTE FUNCTION fn_org_payment_balances();

-- 4. User balance audit log
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

CREATE TRIGGER trg_balance_audit
  AFTER UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_balance_audit();

-- 5. Prevent self-favour
CREATE OR REPLACE FUNCTION fn_prevent_self_favour()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.requestor_id = NEW.requestee_id THEN
    RAISE EXCEPTION 'Requestor and requestee cannot be the same user.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_self_favour
  BEFORE INSERT ON favours
  FOR EACH ROW EXECUTE FUNCTION fn_prevent_self_favour();

-- 6. Auto-create pending_favour row on new favour
CREATE OR REPLACE FUNCTION fn_auto_pending_favour()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pending_favours (favour_id, activation_status) VALUES (NEW.favour_id, FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_pending_favour
  AFTER INSERT ON favours
  FOR EACH ROW EXECUTE FUNCTION fn_auto_pending_favour();

-- 7. Complete favour: move from pending to completed on activation
CREATE OR REPLACE FUNCTION fn_complete_favour()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.activation_status = TRUE AND OLD.activation_status = FALSE THEN
    INSERT INTO completed_favours (favour_id, done_at) VALUES (NEW.favour_id, now());
    DELETE FROM pending_favours WHERE favour_id = NEW.favour_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_complete_favour
  AFTER UPDATE ON pending_favours
  FOR EACH ROW EXECUTE FUNCTION fn_complete_favour();

-- ============================================================
--  SEED DATA (for initial setup — use bcrypt hashes in prod)
-- ============================================================
-- INSERT INTO admins (username, password) VALUES ('admin', '<bcrypt_hash_of_admin123>');
-- INSERT INTO info ... / INSERT INTO users ... / etc. (see backend/src/db/seed.js)
