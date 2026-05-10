const db = require('../db');

// ── GET all transactions (scoped by role) ──────────────────────────────────
const getAll = async (req, res) => {
  const { role, id } = req.user;

  let whereUser = '';
  let whereOrg  = '';
  let params = [];

  if (role === 'user') {
    whereUser = `WHERE (pt.sender_id=$1 OR pt.receiver_id=$1)`;
    whereOrg  = `WHERE (rw.rewardee_id=$1 OR op.payer_id=$1)`;
    params = [id];
  } else if (role === 'org') {
    whereUser = `WHERE FALSE`;
    whereOrg  = `WHERE (rw.org_id=$1 OR op.org_id=$1)`;
    params = [id];
  }

  const { rows } = await db.query(`
    SELECT t.transaction_id, t.amount, t.description, t.time_stamp,
           'peer' AS type,
           sn.username AS from_party,
           rv.username AS to_party
    FROM transactions t
    JOIN peer_transactions pt ON t.transaction_id = pt.transaction_id
    JOIN users sn ON pt.sender_id   = sn.user_id
    JOIN users rv ON pt.receiver_id = rv.user_id
    ${whereUser}

    UNION ALL

    SELECT t.transaction_id, t.amount, t.description, t.time_stamp,
           'reward' AS type,
           COALESCE(oi.name, oi.delegate, 'Agency') AS from_party,
           u.username AS to_party
    FROM transactions t
    JOIN rewards rw   ON t.transaction_id = rw.transaction_id
    JOIN users u      ON rw.rewardee_id   = u.user_id
    LEFT JOIN org_info oi ON rw.org_id    = oi.org_id
    ${role === 'user' ? 'WHERE rw.rewardee_id=$1' : (role === 'org' ? 'WHERE rw.org_id=$1' : '')}

    UNION ALL

    SELECT t.transaction_id, t.amount, t.description, t.time_stamp,
           'org_payment' AS type,
           u.username AS from_party,
           COALESCE(oi.name, oi.delegate, 'Organization') AS to_party
    FROM transactions t
    JOIN org_payments op ON t.transaction_id = op.transaction_id
    JOIN users u         ON op.payer_id      = u.user_id
    LEFT JOIN org_info oi ON op.org_id       = oi.org_id
    ${role === 'user' ? 'WHERE op.payer_id=$1' : (role === 'org' ? 'WHERE op.org_id=$1' : '')}

    ORDER BY time_stamp DESC
  `, params);
  res.json(rows);
};

// ── GET peer-only transactions ─────────────────────────────────────────────
const getPeer = async (req, res) => {
  const { role, id } = req.user;
  let where = '';
  let params = [];
  if (role === 'user') { where = 'WHERE pt.sender_id=$1 OR pt.receiver_id=$1'; params = [id]; }

  const { rows } = await db.query(`
    SELECT t.transaction_id, t.amount, t.description, t.time_stamp,
           sn.username AS sender, rv.username AS receiver,
           pt.sender_id, pt.receiver_id
    FROM transactions t
    JOIN peer_transactions pt ON t.transaction_id = pt.transaction_id
    JOIN users sn ON pt.sender_id   = sn.user_id
    JOIN users rv ON pt.receiver_id = rv.user_id
    ${where}
    ORDER BY t.time_stamp DESC
  `, params);
  res.json(rows);
};

// ── GET reward transactions ────────────────────────────────────────────────
const getRewards = async (req, res) => {
  const { role, id } = req.user;
  let where = '';
  let params = [];
  if (role === 'user') { where = 'WHERE rw.rewardee_id=$1'; params = [id]; }
  if (role === 'org')  { where = 'WHERE rw.org_id=$1'; params = [id]; }

  const { rows } = await db.query(`
    SELECT t.transaction_id, t.amount, t.description, t.time_stamp,
           u.username AS rewarded_user,
           COALESCE(oi.name, oi.delegate, 'Agency') AS agency_name,
           rw.org_id
    FROM transactions t
    JOIN rewards rw   ON t.transaction_id = rw.transaction_id
    JOIN users u      ON rw.rewardee_id   = u.user_id
    LEFT JOIN org_info oi ON rw.org_id    = oi.org_id
    ${where}
    ORDER BY t.time_stamp DESC
  `, params);
  res.json(rows);
};

// ── GET org_payments ───────────────────────────────────────────────────────
const getOrgPayments = async (req, res) => {
  const { role, id } = req.user;
  let where = '';
  let params = [];
  if (role === 'user') { where = 'WHERE op.payer_id=$1'; params = [id]; }
  if (role === 'org')  { where = 'WHERE op.org_id=$1'; params = [id]; }

  const { rows } = await db.query(`
    SELECT t.transaction_id, t.amount, t.description, t.time_stamp,
           u.username AS payer,
           COALESCE(oi.name, oi.delegate, 'Organization') AS org_name,
           op.org_id, op.payer_id
    FROM transactions t
    JOIN org_payments op ON t.transaction_id = op.transaction_id
    JOIN users u         ON op.payer_id      = u.user_id
    LEFT JOIN org_info oi ON op.org_id       = oi.org_id
    ${where}
    ORDER BY t.time_stamp DESC
  `, params);
  res.json(rows);
};

// ── GET dashboard stats ────────────────────────────────────────────────────
const getStats = async (req, res) => {
  const { role, id } = req.user;

  if (role === 'user') {
    const balRes   = await db.query('SELECT balance FROM users WHERE user_id=$1', [id]);
    const txRes    = await db.query(`
      SELECT COUNT(*) FROM (
        SELECT transaction_id FROM peer_transactions WHERE sender_id=$1 OR receiver_id=$1
        UNION ALL
        SELECT transaction_id FROM rewards WHERE rewardee_id=$1
        UNION ALL
        SELECT transaction_id FROM org_payments WHERE payer_id=$1
      ) t
    `, [id]);
    const favRes   = await db.query(
      'SELECT COUNT(*) FROM favours WHERE requestor_id=$1 OR requestee_id=$1', [id]
    );
    return res.json({
      balance:            parseFloat(balRes.rows[0]?.balance || 0),
      total_transactions: parseInt(txRes.rows[0].count),
      total_favours:      parseInt(favRes.rows[0].count),
    });
  }

  if (role === 'org') {
    const rewRes = await db.query('SELECT COUNT(*) FROM rewards WHERE org_id=$1', [id]);
    const payRes = await db.query('SELECT COUNT(*) FROM org_payments WHERE org_id=$1', [id]);
    return res.json({
      total_rewards:  parseInt(rewRes.rows[0].count),
      total_payments: parseInt(payRes.rows[0].count),
    });
  }

  // admin
  const usersRes = await db.query('SELECT COUNT(*) FROM users');
  const orgsRes  = await db.query('SELECT COUNT(*) FROM orgs');
  const favRes   = await db.query('SELECT COUNT(*) FROM favours');
  const kredsRes = await db.query('SELECT COALESCE(SUM(balance),0) AS total FROM users');
  const txRes    = await db.query('SELECT COUNT(*) FROM transactions');
  res.json({
    total_users:        parseInt(usersRes.rows[0].count),
    total_orgs:         parseInt(orgsRes.rows[0].count),
    total_favours:      parseInt(favRes.rows[0].count),
    total_kreds:        parseFloat(kredsRes.rows[0].total),
    total_transactions: parseInt(txRes.rows[0].count),
  });
};

module.exports = { getAll, getPeer, getRewards, getOrgPayments, getStats };
