const db = require('../db');

// ── GET all users (joined with info) ──────────────────────────────────────
const getUsers = async (req, res) => {
  const { rows } = await db.query(`
    SELECT
      u.user_id,
      u.username,
      u.balance,
      u.joining_date,
      ui.first_name,
      ui.last_name,
      ui.gender,
      ui.age,
      i.email,
      i.phone,
      i.address
    FROM users u
    LEFT JOIN user_info ui ON u.user_id = ui.user_id
    LEFT JOIN info i ON ui.info_id = i.info_id
    ORDER BY u.joining_date DESC
  `);
  res.json(rows);
};

// ── GET single user ────────────────────────────────────────────────────────
const getUser = async (req, res) => {
  const { id } = req.params;
  const { rows } = await db.query(`
    SELECT
      u.user_id,
      u.username,
      u.balance,
      u.joining_date,
      ui.first_name,
      ui.last_name,
      ui.gender,
      ui.age,
      i.email,
      i.phone,
      i.address
    FROM users u
    LEFT JOIN user_info ui ON u.user_id = ui.user_id
    LEFT JOIN info i ON ui.info_id = i.info_id
    WHERE u.user_id = $1
  `, [id]);

  if (!rows.length) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }
  res.json(rows[0]);
};

// ── POST create user ───────────────────────────────────────────────────────
const createUser = async (req, res) => {
  const { username, password, first_name, last_name, gender, age, email, phone, address } = req.body;
  if (!username || !password) {
    const err = new Error('username and password are required'); err.status = 400; throw err;
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const infoRes = await client.query(
      'INSERT INTO info (phone, email, address) VALUES ($1, $2, $3) RETURNING info_id',
      [phone || null, email || null, address || null]
    );
    const info_id = infoRes.rows[0].info_id;

    const userRes = await client.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING user_id, username, balance, joining_date',
      [username, password]
    );
    const user = userRes.rows[0];

    await client.query(
      'INSERT INTO user_info (info_id, user_id, first_name, last_name, gender, age) VALUES ($1,$2,$3,$4,$5,$6)',
      [info_id, user.user_id, first_name || null, last_name || null, gender || null, age || null]
    );

    await client.query('COMMIT');
    res.status(201).json({ ...user, message: 'User created successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ── PUT update user info ───────────────────────────────────────────────────
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, gender, age, email, phone, address } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      UPDATE info i SET phone=$1, email=$2, address=$3
      FROM user_info ui WHERE ui.info_id = i.info_id AND ui.user_id = $4
    `, [phone, email, address, id]);

    await client.query(`
      UPDATE user_info SET first_name=$1, last_name=$2, gender=$3, age=$4
      WHERE user_id=$5
    `, [first_name, last_name, gender, age, id]);

    await client.query('COMMIT');
    res.json({ message: 'User updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ── DELETE user ────────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  const { id } = req.params;
  const { rows } = await db.query('DELETE FROM users WHERE user_id=$1 RETURNING user_id', [id]);
  if (!rows.length) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }
  res.json({ message: 'User deleted' });
};

// ── POST transfer kreds between users ─────────────────────────────────────
// TRIGGER CHANGE: trg_peer_transfer_balances now handles the two balance
// UPDATE statements automatically when peer_transactions is inserted.
// The backend only needs to: lock sender, verify balance, write ledger.
const transferKreds = async (req, res) => {
  const { sender_id, receiver_id, amount, description } = req.body;
  const amt = parseFloat(amount);

  if (!sender_id || !receiver_id || !amt) {
    const err = new Error('sender_id, receiver_id and amount are required'); err.status = 400; throw err;
  }
  if (amt <= 0) {
    const err = new Error('Amount must be positive'); err.status = 400; throw err;
  }
  if (sender_id === receiver_id) {
    const err = new Error('Cannot transfer to yourself'); err.status = 400; throw err;
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Lock sender row and check balance
    const { rows: [sender] } = await client.query(
      'SELECT balance FROM users WHERE user_id=$1 FOR UPDATE',
      [sender_id]
    );
    if (!sender) { const e = new Error('Sender not found'); e.status = 404; throw e; }
    if (parseFloat(sender.balance) < amt) {
      const e = new Error('Insufficient kred balance'); e.status = 400; throw e;
    }

    // Check receiver exists
    const { rows: recv } = await client.query('SELECT user_id FROM users WHERE user_id=$1', [receiver_id]);
    if (!recv.length) { const e = new Error('Receiver not found'); e.status = 404; throw e; }

    // Write ledger entry
    const { rows: [tx] } = await client.query(
      'INSERT INTO transactions (amount, description) VALUES ($1,$2) RETURNING transaction_id',
      [amt, description || 'Kred transfer']
    );

    // Insert into peer_transactions — trg_peer_transfer_balances fires here
    // and atomically debits sender + credits receiver.
    // No manual balance UPDATE needed.
    await client.query(
      'INSERT INTO peer_transactions (transaction_id, sender_id, receiver_id) VALUES ($1,$2,$3)',
      [tx.transaction_id, sender_id, receiver_id]
    );

    await client.query('COMMIT');
    res.json({ transaction_id: tx.transaction_id, message: 'Transfer successful' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ── GET user transaction history ───────────────────────────────────────────
const getUserTransactions = async (req, res) => {
  const { id } = req.params;
  const { rows } = await db.query(`
    SELECT
      t.transaction_id,
      t.amount,
      t.description,
      t.time_stamp,
      'peer'  AS type,
      CASE WHEN pt.sender_id=$1 THEN 'sent' ELSE 'received' END AS direction,
      CASE WHEN pt.sender_id=$1 THEN rv.username ELSE sn.username END AS counterpart
    FROM transactions t
    JOIN peer_transactions pt ON t.transaction_id = pt.transaction_id
    JOIN users sn ON pt.sender_id   = sn.user_id
    JOIN users rv ON pt.receiver_id = rv.user_id
    WHERE pt.sender_id=$1 OR pt.receiver_id=$1

    UNION ALL

    SELECT
      t.transaction_id,
      t.amount,
      t.description,
      t.time_stamp,
      'reward'   AS type,
      'received' AS direction,
      'Agency'   AS counterpart
    FROM transactions t
    JOIN rewards rw ON t.transaction_id = rw.transaction_id
    WHERE rw.rewarder_id=$1

    ORDER BY time_stamp DESC
  `, [id]);
  res.json(rows);
};

// ── GET user balance audit history ────────────────────────────────────────
// Available after trg_balance_audit is deployed in Supabase.
const getUserBalanceAudit = async (req, res) => {
  const { id } = req.params;
  const { rows } = await db.query(`
    SELECT audit_id, old_balance, new_balance, delta, changed_at
    FROM balance_audit
    WHERE user_id = $1
    ORDER BY changed_at DESC
    LIMIT 100
  `, [id]);
  res.json(rows);
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  transferKreds,
  getUserTransactions,
  getUserBalanceAudit,
};
