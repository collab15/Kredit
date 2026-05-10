const bcrypt = require('bcryptjs');
const db     = require('../db');
const { sign } = require('../auth');

const login = async (req, res) => {
  let { identifier, password, role } = req.body;
  if (!identifier || !password || !role) {
    const e = new Error('identifier, password and role are required'); e.status = 400; throw e;
  }

  if (role === 'admin') {
    const { rows } = await db.query(
      'SELECT admin_id, username, password FROM admins WHERE username = $1',
      [identifier.toLowerCase().trim()]
    );
    if (!rows.length) { const e = new Error('Invalid credentials'); e.status = 401; throw e; }
    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) { const e = new Error('Invalid credentials'); e.status = 401; throw e; }
    const token = sign({ id: admin.admin_id, role: 'admin', username: admin.username });
    return res.json({ token, role: 'admin', username: admin.username, id: admin.admin_id });
  }

  if (role === 'user') {
    const { rows } = await db.query(
      'SELECT user_id, username, password FROM users WHERE username = $1',
      [identifier.toLowerCase().trim()]
    );
    if (!rows.length) { const e = new Error('Invalid credentials'); e.status = 401; throw e; }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) { const e = new Error('Invalid credentials'); e.status = 401; throw e; }
    const token = sign({ id: user.user_id, role: 'user', username: user.username });
    return res.json({ token, role: 'user', username: user.username, id: user.user_id });
  }

  if (role === 'org') {
    const { rows } = await db.query(`
      SELECT o.org_id, o.api_key, o.password,
             COALESCE(oi.name, oi.delegate, 'Organization') AS name,
             CASE WHEN a.org_id IS NOT NULL THEN 'agency'
                  WHEN p.org_id IS NOT NULL THEN 'partnered'
                  ELSE 'unknown' END AS org_type
      FROM orgs o
      LEFT JOIN org_info oi ON o.org_id = oi.org_id
      LEFT JOIN agencies  a ON o.org_id = a.org_id
      LEFT JOIN partnered p ON o.org_id = p.org_id
      WHERE o.api_key = $1
    `, [identifier.trim()]);
    if (!rows.length) { const e = new Error('Invalid credentials'); e.status = 401; throw e; }
    const org = rows[0];
    if (!org.password) { const e = new Error('No password set for this org'); e.status = 401; throw e; }
    const valid = await bcrypt.compare(password, org.password);
    if (!valid) { const e = new Error('Invalid credentials'); e.status = 401; throw e; }
    const token = sign({ id: org.org_id, role: 'org', org_type: org.org_type, name: org.name });
    return res.json({ token, role: 'org', org_type: org.org_type, name: org.name, id: org.org_id });
  }

  const e = new Error('Invalid role'); e.status = 400; throw e;
};

const register = async (req, res) => {
  let { username, password, first_name, last_name, gender, age, email, phone, address } = req.body;
  if (!username || !password) {
    const e = new Error('username and password are required'); e.status = 400; throw e;
  }
  username = username.toLowerCase().trim();
  const hash   = await bcrypt.hash(password, 10);
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const infoRes = await client.query(
      'INSERT INTO info (phone, email, address) VALUES ($1,$2,$3) RETURNING info_id',
      [phone || null, email || null, address || null]
    );
    const info_id = infoRes.rows[0].info_id;
    const userRes = await client.query(
      'INSERT INTO users (username, password) VALUES ($1,$2) RETURNING user_id, username, balance, joining_date',
      [username, hash]
    );
    const user = userRes.rows[0];
    await client.query(
      'INSERT INTO user_info (info_id, user_id, first_name, last_name, gender, age) VALUES ($1,$2,$3,$4,$5,$6)',
      [info_id, user.user_id, first_name || null, last_name || null, gender || null, age || null]
    );
    await client.query('COMMIT');
    const token = sign({ id: user.user_id, role: 'user', username: user.username });
    res.status(201).json({ token, role: 'user', username: user.username, id: user.user_id });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const me = async (req, res) => {
  const { id, role } = req.user;

  if (role === 'admin') {
    const { rows } = await db.query(
      'SELECT admin_id, username, joining_date FROM admins WHERE admin_id = $1', [id]
    );
    return res.json(rows[0] ? { ...rows[0], role: 'admin' } : {});
  }

  if (role === 'org') {
    const { rows } = await db.query(`
      SELECT o.org_id, o.api_key,
             COALESCE(oi.name, oi.delegate) AS name,
             oi.delegate, oi.website,
             i.email, i.phone, i.address,
             CASE WHEN a.org_id IS NOT NULL THEN 'agency'
                  WHEN p.org_id IS NOT NULL THEN 'partnered'
                  ELSE 'unknown' END AS org_type,
             p.services, a.scope
      FROM orgs o
      LEFT JOIN org_info oi ON o.org_id = oi.org_id
      LEFT JOIN info i      ON oi.info_id = i.info_id
      LEFT JOIN agencies  a ON o.org_id = a.org_id
      LEFT JOIN partnered p ON o.org_id = p.org_id
      WHERE o.org_id = $1
    `, [id]);
    return res.json(rows[0] || {});
  }

  const { rows } = await db.query(`
    SELECT u.user_id, u.username, u.balance, u.joining_date,
           ui.first_name, ui.last_name, ui.gender, ui.age,
           i.email, i.phone, i.address
    FROM users u
    LEFT JOIN user_info ui ON u.user_id = ui.user_id
    LEFT JOIN info i       ON ui.info_id = i.info_id
    WHERE u.user_id = $1
  `, [id]);
  res.json(rows[0] || {});
};

module.exports = { login, register, me };
