const db = require('../db');

// ── GET all favours with status ────────────────────────────────────────────
const getFavours = async (req, res) => {
  const { rows } = await db.query(`
    SELECT
      f.favour_id,
      f.description,
      f.requestor_id,
      f.requestee_id,
      req_r.username AS requestor,
      req_e.username AS requestee,
      CASE
        WHEN cf.favour_id IS NOT NULL THEN 'completed'
        WHEN pf.favour_id IS NOT NULL THEN 'pending'
        ELSE 'open'
      END AS status,
      cf.done_at,
      cf.review,
      pf.activation_status
    FROM favours f
    JOIN users req_r ON f.requestor_id = req_r.user_id
    JOIN users req_e ON f.requestee_id = req_e.user_id
    LEFT JOIN completed_favours cf ON f.favour_id = cf.favour_id
    LEFT JOIN pending_favours   pf ON f.favour_id = pf.favour_id
    ORDER BY f.favour_id DESC
  `);
  res.json(rows);
};

// ── POST create a new favour (goes into pending) ───────────────────────────
const createFavour = async (req, res) => {
  const { description, requestor_id, requestee_id } = req.body;
  if (!requestor_id || !requestee_id) {
    const e = new Error('requestor_id and requestee_id are required'); e.status = 400; throw e;
  }
  if (requestor_id === requestee_id) {
    const e = new Error('Cannot request a favour from yourself'); e.status = 400; throw e;
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [f] } = await client.query(
      'INSERT INTO favours (description, requestor_id, requestee_id) VALUES ($1,$2,$3) RETURNING favour_id',
      [description || null, requestor_id, requestee_id]
    );

    await client.query(
      'INSERT INTO pending_favours (favour_id, activation_status) VALUES ($1, false)',
      [f.favour_id]
    );

    await client.query('COMMIT');
    res.status(201).json({ favour_id: f.favour_id, message: 'Favour created and pending' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ── PUT mark favour as completed ───────────────────────────────────────────
const completeFavour = async (req, res) => {
  const { id } = req.params;
  const { review } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Verify favour is pending
    const { rows } = await client.query(
      'SELECT favour_id FROM pending_favours WHERE favour_id=$1', [id]
    );
    if (!rows.length) {
      const e = new Error('Favour is not in pending state'); e.status = 400; throw e;
    }

    await client.query('DELETE FROM pending_favours WHERE favour_id=$1', [id]);
    await client.query(
      'INSERT INTO completed_favours (favour_id, review) VALUES ($1,$2)',
      [id, review || null]
    );

    await client.query('COMMIT');
    res.json({ message: 'Favour marked as completed' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ── DELETE favour ──────────────────────────────────────────────────────────
const deleteFavour = async (req, res) => {
  const { id } = req.params;
  const { rows } = await db.query('DELETE FROM favours WHERE favour_id=$1 RETURNING favour_id', [id]);
  if (!rows.length) { const e = new Error('Favour not found'); e.status = 404; throw e; }
  res.json({ message: 'Favour deleted' });
};

module.exports = { getFavours, createFavour, completeFavour, deleteFavour };