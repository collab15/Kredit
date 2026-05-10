const db = require('../db');

const FAVOUR_SELECT = `
  SELECT f.favour_id, f.description, f.compensation, f.requestor_id, f.requestee_id,
         req_r.username AS requestor, req_e.username AS requestee,
         CASE WHEN cf.favour_id IS NOT NULL THEN 'completed'
              WHEN pf.favour_id IS NOT NULL THEN 'pending'
              ELSE 'open' END AS status,
         cf.done_at, cf.review, pf.activation_status
  FROM favours f
  JOIN users req_r ON f.requestor_id = req_r.user_id
  JOIN users req_e ON f.requestee_id = req_e.user_id
  LEFT JOIN completed_favours cf ON f.favour_id = cf.favour_id
  LEFT JOIN pending_favours   pf ON f.favour_id = pf.favour_id
`;

// ── GET favours (admin: all; user: their own) ──────────────────────────────
const getFavours = async (req, res) => {
  const { role, id } = req.user;
  if (role === 'admin') {
    const { rows } = await db.query(FAVOUR_SELECT + ' ORDER BY f.favour_id DESC');
    return res.json(rows);
  }
  const { rows } = await db.query(
    FAVOUR_SELECT + ' WHERE f.requestor_id=$1 OR f.requestee_id=$1 ORDER BY f.favour_id DESC',
    [id]
  );
  res.json(rows);
};

// ── POST create favour ─────────────────────────────────────────────────────
const createFavour = async (req, res) => {
  const { description, requestor_id, requestee_id, compensation } = req.body;
  const { role, id: callerId } = req.user;
  const resolvedRequestor = role === 'admin' ? requestor_id : callerId;

  if (!resolvedRequestor || !requestee_id) {
    const e = new Error('requestor_id and requestee_id are required'); e.status = 400; throw e;
  }
  if (resolvedRequestor === requestee_id) {
    const e = new Error('Cannot request a favour from yourself'); e.status = 400; throw e;
  }
  const comp = parseFloat(compensation) || 0;
  if (comp < 0) { const e = new Error('Compensation cannot be negative'); e.status = 400; throw e; }
  const { rows: [f] } = await db.query(
    'INSERT INTO favours (description, requestor_id, requestee_id, compensation) VALUES ($1,$2,$3,$4) RETURNING favour_id',
    [description || null, resolvedRequestor, requestee_id, comp]
  );
  res.status(201).json({ favour_id: f.favour_id, message: 'Favour created and pending' });
};

// ── PUT complete favour ────────────────────────────────────────────────────
const completeFavour = async (req, res) => {
  const { id } = req.params;
  const { review } = req.body;
  const { role, id: callerId } = req.user;

  const { rows } = await db.query('SELECT pf.favour_id, f.requestee_id, f.compensation FROM pending_favours pf JOIN favours f ON pf.favour_id=f.favour_id WHERE pf.favour_id=$1', [id]);
  if (!rows.length) { const e = new Error('Favour is not in pending state'); e.status = 400; throw e; }

  if (role === 'user' && rows[0].requestee_id !== callerId) {
    const e = new Error('Only the requestee can complete this favour'); e.status = 403; throw e;
  }

  await db.query('UPDATE pending_favours SET activation_status=TRUE WHERE favour_id=$1', [id]);
  if (review) {
    await db.query('UPDATE completed_favours SET review=$1 WHERE favour_id=$2', [review, id]);
  }
  res.json({ message: 'Favour marked as completed' });
};

// ── DELETE favour ──────────────────────────────────────────────────────────
const deleteFavour = async (req, res) => {
  const { id } = req.params;
  const { role, id: callerId } = req.user;

  if (role !== 'admin') {
    const { rows } = await db.query('SELECT requestor_id FROM favours WHERE favour_id=$1', [id]);
    if (!rows.length) { const e = new Error('Favour not found'); e.status = 404; throw e; }
    if (rows[0].requestor_id !== callerId) { const e = new Error('Forbidden'); e.status = 403; throw e; }
  }

  const { rows } = await db.query('DELETE FROM favours WHERE favour_id=$1 RETURNING favour_id', [id]);
  if (!rows.length) { const e = new Error('Favour not found'); e.status = 404; throw e; }
  res.json({ message: 'Favour deleted' });
};

module.exports = { getFavours, createFavour, completeFavour, deleteFavour };
