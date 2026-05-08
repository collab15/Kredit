const bcrypt = require('bcryptjs');
const db     = require('../db');
const { v4: uuidv4 } = require('uuid');

const ORG_SELECT = `
  SELECT o.org_id, o.api_key, o.balance,
         COALESCE(oi.name, oi.delegate) AS display_name,
         oi.name, oi.delegate, oi.website,
         i.email, i.phone, i.address,
         CASE WHEN p.org_id IS NOT NULL THEN 'partnered'
              WHEN a.org_id IS NOT NULL THEN 'agency'
              ELSE 'unknown' END AS org_type,
         p.services, a.scope
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

// ── GET own org profile (org role) ────────────────────────────────────────
const getMyOrg = async (req, res) => {
  const { id } = req.user;
  const { rows } = await db.query(ORG_SELECT + ' WHERE o.org_id=$1', [id]);
  if (!rows.length) { const e = new Error('Org not found'); e.status = 404; throw e; }
  res.json(rows[0]);
};

// ── GET agencies only ──────────────────────────────────────────────────────
const getAgencies = async (req, res) => {
  const { rows } = await db.query(`
    SELECT o.org_id, o.api_key, o.balance, a.scope,
           COALESCE(oi.name, oi.delegate) AS display_name,
           oi.delegate, oi.website, i.email, i.phone
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
    SELECT o.org_id, o.api_key, o.balance, p.services,
           COALESCE(oi.name, oi.delegate) AS display_name,
           oi.delegate, oi.website, i.email, i.phone
    FROM orgs o
    JOIN partnered p      ON o.org_id  = p.org_id
    LEFT JOIN org_info oi ON o.org_id  = oi.org_id
    LEFT JOIN info i      ON oi.info_id = i.info_id
    ORDER BY o.org_id
  `);
  res.json(rows);
};

// ── POST create org (admin only) ───────────────────────────────────────────
const createOrg = async (req, res) => {
  const { org_type, name, delegate, website, email, phone, address, services, scope, password } = req.body;
  if (!org_type || !['agency', 'partnered'].includes(org_type)) {
    const e = new Error('org_type must be "agency" or "partnered"'); e.status = 400; throw e;
  }
  if (!password) { const e = new Error('password is required for org login'); e.status = 400; throw e; }

  const hash   = await bcrypt.hash(password, 10);
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const api_key = `krd_${uuidv4().replace(/-/g, '')}`;
    const { rows: [org] } = await client.query(
      'INSERT INTO orgs (api_key, password) VALUES ($1,$2) RETURNING org_id',
      [api_key, hash]
    );
    const org_id = org.org_id;
    const { rows: [info] } = await client.query(
      'INSERT INTO info (phone, email, address) VALUES ($1,$2,$3) RETURNING info_id',
      [phone || null, email || null, address || null]
    );
    await client.query(
      'INSERT INTO org_info (info_id, org_id, name, delegate, website) VALUES ($1,$2,$3,$4,$5)',
      [info.info_id, org_id, name || null, delegate || null, website || null]
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

// ── PUT update org ─────────────────────────────────────────────────────────
const updateOrg = async (req, res) => {
  const { id } = req.params;
  const { role, id: callerId } = req.user;
  const orgId = (role === 'org') ? callerId : id;
  const { name, delegate, website, email, phone, address, services, scope, password } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      UPDATE info i SET phone=$1, email=$2, address=$3
      FROM org_info oi WHERE oi.info_id = i.info_id AND oi.org_id = $4
    `, [phone, email, address, orgId]);
    await client.query(`
      UPDATE org_info SET name=$1, delegate=$2, website=$3 WHERE org_id=$4
    `, [name, delegate, website, orgId]);
    if (services !== undefined) {
      await client.query('UPDATE partnered SET services=$1 WHERE org_id=$2', [services, orgId]);
    }
    if (scope !== undefined) {
      await client.query('UPDATE agencies SET scope=$1 WHERE org_id=$2', [scope, orgId]);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await client.query('UPDATE orgs SET password=$1 WHERE org_id=$2', [hash, orgId]);
    }
    await client.query('COMMIT');
    res.json({ message: 'Organization updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ── DELETE org (admin only) ────────────────────────────────────────────────
const deleteOrg = async (req, res) => {
  const { id } = req.params;
  const { rows } = await db.query('DELETE FROM orgs WHERE org_id=$1 RETURNING org_id', [id]);
  if (!rows.length) { const e = new Error('Org not found'); e.status = 404; throw e; }
  res.json({ message: 'Organization deleted' });
};

// ── POST agency rewards a user (admin or agency org) ──────────────────────
const rewardUser = async (req, res) => {
  const { user_id, amount, description } = req.body;
  const { role, id: callerId, org_type } = req.user;

  let org_id;
  if (role === 'admin') {
    org_id = req.body.org_id;
    if (!org_id) { const e = new Error('org_id required'); e.status = 400; throw e; }
  } else if (role === 'org' && org_type === 'agency') {
    org_id = callerId;
  } else {
    const e = new Error('Only agencies can reward users'); e.status = 403; throw e;
  }

  const amt = parseFloat(amount);
  if (!user_id || !amt) { const e = new Error('user_id and amount are required'); e.status = 400; throw e; }
  if (amt <= 0) { const e = new Error('Amount must be positive'); e.status = 400; throw e; }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: agCheck } = await client.query('SELECT org_id FROM agencies WHERE org_id=$1', [org_id]);
    if (!agCheck.length) { const e = new Error('Only registered agencies can reward users'); e.status = 403; throw e; }
    const { rows: userCheck } = await client.query('SELECT user_id FROM users WHERE user_id=$1', [user_id]);
    if (!userCheck.length) { const e = new Error('User not found'); e.status = 404; throw e; }
    const { rows: [tx] } = await client.query(
      'INSERT INTO transactions (amount, description) VALUES ($1,$2) RETURNING transaction_id',
      [amt, description || 'Agency kred reward']
    );
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

// ── GET org balance audit ─────────────────────────────────────────────────
const getOrgBalanceAudit = async (req, res) => {
  const { id } = req.params;
  const { role, id: callerId } = req.user;
  const orgId = (role === 'org') ? callerId : id;
  const { rows } = await db.query(`
    SELECT audit_id, old_balance, new_balance, delta, changed_at
    FROM org_balance_audit WHERE org_id=$1 ORDER BY changed_at DESC LIMIT 100
  `, [orgId]);
  res.json(rows);
};

module.exports = { getOrgs, getOrg, getMyOrg, getAgencies, getPartnered, createOrg, updateOrg, deleteOrg, rewardUser, getOrgBalanceAudit };
