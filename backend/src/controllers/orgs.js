const db   = require('../db');
const { v4: uuidv4 } = require('uuid');

// ── Base org select helper ─────────────────────────────────────────────────
const ORG_SELECT = `
  SELECT
    o.org_id,
    o.api_key,
    oi.delegate,
    oi.website,
    i.email,
    i.phone,
    i.address,
    CASE
      WHEN p.org_id IS NOT NULL THEN 'partnered'
      WHEN a.org_id IS NOT NULL THEN 'agency'
      ELSE 'unknown'
    END AS org_type,
    p.services,
    a.scope
  FROM orgs o
  LEFT JOIN org_info oi ON o.org_id = oi.org_id
  LEFT JOIN info i      ON oi.info_id = i.info_id
  LEFT JOIN partnered p ON o.org_id  = p.org_id
  LEFT JOIN agencies  a ON o.org_id  = a.org_id
`;

// ── GET all orgs ───────────────────────────────────────────────────────────
const getOrgs = async (req, res) => {
  const { rows } = await db.query(ORG_SELECT + ' ORDER BY o.org_id');
  res.json(rows);
};

// ── GET single org ─────────────────────────────────────────────────────────
const getOrg = async (req, res) => {
  const { id } = req.params;
  const { rows } = await db.query(ORG_SELECT + ' WHERE o.org_id=$1', [id]);
  if (!rows.length) { const e = new Error('Org not found'); e.status = 404; throw e; }
  res.json(rows[0]);
};

// ── GET agencies only ──────────────────────────────────────────────────────
const getAgencies = async (req, res) => {
  const { rows } = await db.query(`
    SELECT o.org_id, o.api_key, a.scope, oi.delegate, oi.website, i.email, i.phone
    FROM orgs o
    JOIN agencies a       ON o.org_id  = a.org_id
    LEFT JOIN org_info oi ON o.org_id  = oi.org_id
    LEFT JOIN info i      ON oi.info_id = i.info_id
    ORDER BY o.org_id
  `);
  res.json(rows);
};

// ── GET partnered only ─────────────────────────────────────────────────────
const getPartnered = async (req, res) => {
  const { rows } = await db.query(`
    SELECT o.org_id, o.api_key, p.services, oi.delegate, oi.website, i.email, i.phone
    FROM orgs o
    JOIN partnered p      ON o.org_id  = p.org_id
    LEFT JOIN org_info oi ON o.org_id  = oi.org_id
    LEFT JOIN info i      ON oi.info_id = i.info_id
    ORDER BY o.org_id
  `);
  res.json(rows);
};

// ── POST create org ────────────────────────────────────────────────────────
const createOrg = async (req, res) => {
  const { org_type, delegate, website, email, phone, address, services, scope } = req.body;
  if (!org_type || !['agency', 'partnered'].includes(org_type)) {
    const e = new Error('org_type must be "agency" or "partnered"'); e.status = 400; throw e;
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const api_key = `krd_${uuidv4().replace(/-/g, '')}`;
    const { rows: [org] } = await client.query(
      'INSERT INTO orgs (api_key) VALUES ($1) RETURNING org_id',
      [api_key]
    );
    const org_id = org.org_id;

    const { rows: [info] } = await client.query(
      'INSERT INTO info (phone, email, address) VALUES ($1,$2,$3) RETURNING info_id',
      [phone || null, email || null, address || null]
    );

    await client.query(
      'INSERT INTO org_info (info_id, org_id, delegate, website) VALUES ($1,$2,$3,$4)',
      [info.info_id, org_id, delegate || null, website || null]
    );

    if (org_type === 'agency') {
      await client.query('INSERT INTO agencies (org_id, scope) VALUES ($1,$2)', [org_id, scope || null]);
    } else {
      await client.query('INSERT INTO partnered (org_id, services) VALUES ($1,$2)', [org_id, services || null]);
    }

    await client.query('COMMIT');
    res.status(201).json({ org_id, api_key, org_type, message: 'Organization created successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ── POST agency rewards a user with kreds ─────────────────────────────────
// TRIGGER CHANGE: trg_reward_credit_balance fires AFTER INSERT ON rewards
// and automatically credits the user's balance.
// The manual UPDATE users SET balance = balance + $1 has been removed.
const rewardUser = async (req, res) => {
  const { org_id, user_id, amount, description } = req.body;
  const amt = parseFloat(amount);

  if (!org_id || !user_id || !amt) {
    const e = new Error('org_id, user_id and amount are required'); e.status = 400; throw e;
  }
  if (amt <= 0) { const e = new Error('Amount must be positive'); e.status = 400; throw e; }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Only agencies may reward
    const { rows: agCheck } = await client.query(
      'SELECT org_id FROM agencies WHERE org_id=$1', [org_id]
    );
    if (!agCheck.length) {
      const e = new Error('Only registered agencies can reward users'); e.status = 403; throw e;
    }

    // User must exist
    const { rows: userCheck } = await client.query(
      'SELECT user_id FROM users WHERE user_id=$1', [user_id]
    );
    if (!userCheck.length) { const e = new Error('User not found'); e.status = 404; throw e; }

    // Write ledger entry
    const { rows: [tx] } = await client.query(
      'INSERT INTO transactions (amount, description) VALUES ($1,$2) RETURNING transaction_id',
      [amt, description || 'Agency kred reward']
    );

    // Insert into rewards — trg_reward_credit_balance fires here and
    // automatically credits user balance. No manual UPDATE needed.
    await client.query(
      'INSERT INTO rewards (transaction_id, rewarder_id, org_id) VALUES ($1,$2,$3)',
      [tx.transaction_id, user_id, org_id]
    );

    await client.query('COMMIT');
    res.json({ transaction_id: tx.transaction_id, message: 'User rewarded successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ── DELETE org ─────────────────────────────────────────────────────────────
const deleteOrg = async (req, res) => {
  const { id } = req.params;
  const { rows } = await db.query('DELETE FROM orgs WHERE org_id=$1 RETURNING org_id', [id]);
  if (!rows.length) { const e = new Error('Org not found'); e.status = 404; throw e; }
  res.json({ message: 'Organization deleted' });
};

module.exports = { getOrgs, getOrg, getAgencies, getPartnered, createOrg, rewardUser, deleteOrg };
