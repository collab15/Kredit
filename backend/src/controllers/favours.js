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

// ── POST create a new favour ───────────────────────────────────────────────
// TRIGGER CHANGE: trg_auto_pending_favour fires AFTER INSERT ON favours and
// automatically inserts a row into pending_favours (activation_status=FALSE).
// The backend no longer needs a transaction wrapping two inserts — a single
// INSERT into favours is sufficient; the pending row is guaranteed by the DB.
//
// trg_prevent_self_favour (BEFORE INSERT) enforces the self-favour rule at
// the DB layer. The app-level check below is kept for a friendlier error msg.
const createFavour = async (req, res) => {
  const { description, requestor_id, requestee_id } = req.body;
  if (!requestor_id || !requestee_id) {
    const e = new Error('requestor_id and requestee_id are required'); e.status = 400; throw e;
  }
  if (requestor_id === requestee_id) {
    const e = new Error('Cannot request a favour from yourself'); e.status = 400; throw e;
  }

  // Single INSERT — trigger handles pending_favours automatically
  const { rows: [f] } = await db.query(
    'INSERT INTO favours (description, requestor_id, requestee_id) VALUES ($1,$2,$3) RETURNING favour_id',
    [description || null, requestor_id, requestee_id]
  );

  res.status(201).json({ favour_id: f.favour_id, message: 'Favour created and pending' });
};

// ── PUT mark favour as completed ───────────────────────────────────────────
// TRIGGER CHANGE: trg_complete_favour fires AFTER UPDATE OF activation_status
// ON pending_favours.  When the status flips to TRUE the trigger atomically:
//   1. Inserts into completed_favours with done_at = now()
//   2. Deletes the row from pending_favours
// The backend reduces to a single UPDATE — no manual DELETE + INSERT needed.
const completeFavour = async (req, res) => {
  const { id } = req.params;
  const { review } = req.body;

  // Verify favour is currently pending
  const { rows } = await db.query(
    'SELECT favour_id FROM pending_favours WHERE favour_id=$1', [id]
  );
  if (!rows.length) {
    const e = new Error('Favour is not in pending state'); e.status = 400; throw e;
  }

  // A single UPDATE flips the flag; the trigger handles the rest
  await db.query(
    'UPDATE pending_favours SET activation_status = TRUE WHERE favour_id=$1',
    [id]
  );

  // Persist optional review text if provided
  if (review) {
    await db.query(
      'UPDATE completed_favours SET review=$1 WHERE favour_id=$2',
      [review, id]
    );
  }

  res.json({ message: 'Favour marked as completed' });
};

// ── DELETE favour ──────────────────────────────────────────────────────────
const deleteFavour = async (req, res) => {
  const { id } = req.params;
  const { rows } = await db.query('DELETE FROM favours WHERE favour_id=$1 RETURNING favour_id', [id]);
  if (!rows.length) { const e = new Error('Favour not found'); e.status = 404; throw e; }
  res.json({ message: 'Favour deleted' });
};

module.exports = { getFavours, createFavour, completeFavour, deleteFavour };
