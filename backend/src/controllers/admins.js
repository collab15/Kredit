const bcrypt = require('bcryptjs');
const db     = require('../db');

// ── GET all admins ─────────────────────────────────────────────────────────
const getAdmins = async (_req, res) => {
  const { rows } = await db.query(
    'SELECT admin_id, username, joining_date FROM admins ORDER BY joining_date DESC'
  );
  res.json(rows);
};

// ── GET single admin ───────────────────────────────────────────────────────
const getAdmin = async (req, res) => {
  const { rows } = await db.query(
    'SELECT admin_id, username, joining_date FROM admins WHERE admin_id=$1', [req.params.id]
  );
  if (!rows.length) { const e = new Error('Admin not found'); e.status = 404; throw e; }
  res.json(rows[0]);
};

// ── POST create admin ──────────────────────────────────────────────────────
const createAdmin = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    const e = new Error('username and password are required'); e.status = 400; throw e;
  }
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await db.query(
    'INSERT INTO admins (username, password) VALUES ($1,$2) RETURNING admin_id, username, joining_date',
    [username, hash]
  );
  res.status(201).json({ ...rows[0], message: 'Admin created successfully' });
};

// ── PUT update admin (password only) ──────────────────────────────────────
const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  if (!password) { const e = new Error('password is required'); e.status = 400; throw e; }
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await db.query(
    'UPDATE admins SET password=$1 WHERE admin_id=$2 RETURNING admin_id', [hash, id]
  );
  if (!rows.length) { const e = new Error('Admin not found'); e.status = 404; throw e; }
  res.json({ message: 'Password updated' });
};

// ── DELETE admin ───────────────────────────────────────────────────────────
const deleteAdmin = async (req, res) => {
  const { id } = req.params;
  const { id: callerId } = req.user;
  if (id === callerId) { const e = new Error('Cannot delete your own admin account'); e.status = 400; throw e; }
  const { rows } = await db.query(
    'DELETE FROM admins WHERE admin_id=$1 RETURNING admin_id', [id]
  );
  if (!rows.length) { const e = new Error('Admin not found'); e.status = 404; throw e; }
  res.json({ message: 'Admin deleted' });
};

module.exports = { getAdmins, getAdmin, createAdmin, updateAdmin, deleteAdmin };
