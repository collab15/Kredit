const db = require('../db');

// ── GET all transactions (peer + rewards unified) ──────────────────────────
const getAll = async (req, res) => {
  const { rows } = await db.query(`
    SELECT
      t.transaction_id,
      t.amount,
      t.description,
      t.time_stamp,
      'peer'   AS type,
      sn.username AS from_party,
      rv.username AS to_party
    FROM transactions t
    JOIN peer_transactions pt ON t.transaction_id = pt.transaction_id
    JOIN users sn ON pt.sender_id   = sn.user_id
    JOIN users rv ON pt.receiver_id = rv.user_id

    UNION ALL

    SELECT
      t.transaction_id,
      t.amount,
      t.description,
      t.time_stamp,
      'reward'              AS type,
      COALESCE(a.scope, 'Agency') AS from_party,
      u.username            AS to_party
    FROM transactions t
    JOIN rewards rw ON t.transaction_id = rw.transaction_id
    JOIN users u    ON rw.rewarder_id = u.user_id
    LEFT JOIN agencies a ON rw.org_id = a.org_id

    ORDER BY time_stamp DESC
  `);
  res.json(rows);
};

// ── GET peer-only transactions ─────────────────────────────────────────────
const getPeer = async (req, res) => {
  const { rows } = await db.query(`
    SELECT
      t.transaction_id,
      t.amount,
      t.description,
      t.time_stamp,
      sn.username  AS sender,
      rv.username  AS receiver,
      pt.sender_id,
      pt.receiver_id
    FROM transactions t
    JOIN peer_transactions pt ON t.transaction_id = pt.transaction_id
    JOIN users sn ON pt.sender_id   = sn.user_id
    JOIN users rv ON pt.receiver_id = rv.user_id
    ORDER BY t.time_stamp DESC
  `);
  res.json(rows);
};

// ── GET reward transactions ────────────────────────────────────────────────
const getRewards = async (req, res) => {
  const { rows } = await db.query(`
    SELECT
      t.transaction_id,
      t.amount,
      t.description,
      t.time_stamp,
      u.username   AS rewarded_user,
      a.scope      AS agency_scope,
      rw.org_id
    FROM transactions t
    JOIN rewards rw ON t.transaction_id = rw.transaction_id
    JOIN users u    ON rw.rewarder_id   = u.user_id
    LEFT JOIN agencies a ON rw.org_id   = a.org_id
    ORDER BY t.time_stamp DESC
  `);
  res.json(rows);
};

// ── GET dashboard stats ────────────────────────────────────────────────────
const getStats = async (req, res) => {
  const [users, orgs, favours, kreds, txCount] = await Promise.all([
    db.query('SELECT COUNT(*) FROM users'),
    db.query('SELECT COUNT(*) FROM orgs'),
    db.query('SELECT COUNT(*) FROM favours'),
    db.query('SELECT COALESCE(SUM(balance), 0) AS total FROM users'),
    db.query('SELECT COUNT(*) FROM transactions'),
  ]);

  res.json({
    total_users:        parseInt(users.rows[0].count),
    total_orgs:         parseInt(orgs.rows[0].count),
    total_favours:      parseInt(favours.rows[0].count),
    total_kreds:        parseFloat(kreds.rows[0].total),
    total_transactions: parseInt(txCount.rows[0].count),
  });
};

module.exports = { getAll, getPeer, getRewards, getStats };