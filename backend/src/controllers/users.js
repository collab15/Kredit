const bcrypt = require('bcryptjs');
const db = require('../db');

const USER_SELECT = `
  SELECT u.user_id, u.username, u.balance, u.joining_date,
         ui.first_name, ui.last_name, ui.gender, ui.age,
         i.email, i.phone, i.address
  FROM users u
  LEFT JOIN user_info ui ON u.user_id = ui.user_id
  LEFT JOIN info i       ON ui.info_id = i.info_id
`;

const getUsers = async (_req, res) => {
  const { rows } = await db.query(USER_SELECT + ' ORDER BY u.joining_date DESC');
  res.json(rows);
};

const getUser = async (req, res) => {
  const { id } = req.params;
  const { role, id: callerId } = req.user;
  if (role !== 'admin' && callerId !== id) {
    const e = new Error('Forbidden'); e.status = 403; throw e;
  }
  const { rows } = await db.query(USER_SELECT + ' WHERE u.user_id = $1', [id]);
  if (!rows.length) { const e = new Error('User not found'); e.status = 404; throw e; }
  res.json(rows[0]);
};

// ── GET user by username (lookup) ──────────────────────────────────────────
const lookupUser = async (req, res) => {
  const { username } = req.query;
  if (!username) { const e = new Error('username query param required'); e.status = 400; throw e; }
  const { rows } = await db.query(
    `SELECT u.user_id, u.username, u.balance,
            ui.first_name, ui.last_name
     FROM users u
     LEFT JOIN user_info ui ON u.user_id = ui.user_id
     WHERE u.username = $1`,
    [username.toLowerCase().trim()]
  );
  if (!rows.length) { const e = new Error('User not found'); e.status = 404; throw e; }
  res.json(rows[0]);
};

const createUser = async (req, res) => {
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
    res.status(201).json({ ...user, message: 'User created successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { role: callerRole, id: callerId } = req.user;
  if (callerRole !== 'admin' && callerId !== id) {
    const e = new Error('Forbidden'); e.status = 403; throw e;
  }
  const { first_name, last_name, gender, age, email, phone, address, password } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      UPDATE info i SET phone=$1, email=$2, address=$3
      FROM user_info ui WHERE ui.info_id = i.info_id AND ui.user_id = $4
    `, [phone, email, address, id]);
    await client.query(
      'UPDATE user_info SET first_name=$1, last_name=$2, gender=$3, age=$4 WHERE user_id=$5',
      [first_name, last_name, gender, age, id]
    );
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await client.query('UPDATE users SET password=$1 WHERE user_id=$2', [hash, id]);
    }
    await client.query('COMMIT');
    res.json({ message: 'User updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  const { rows } = await db.query('DELETE FROM users WHERE user_id=$1 RETURNING user_id', [id]);
  if (!rows.length) { const e = new Error('User not found'); e.status = 404; throw e; }
  res.json({ message: 'User deleted' });
};

const transferKreds = async (req, res) => {
  const { sender_id, receiver_id, amount, description } = req.body;
  const { role, id: callerId } = req.user;
  const resolvedSender = role === 'admin' ? sender_id : callerId;
  const amt = parseFloat(amount);
  if (!resolvedSender || !receiver_id || !amt) {
    const e = new Error('sender_id, receiver_id and amount are required'); e.status = 400; throw e;
  }
  if (amt <= 0) { const e = new Error('Amount must be positive'); e.status = 400; throw e; }
  if (resolvedSender === receiver_id) { const e = new Error('Cannot transfer to yourself'); e.status = 400; throw e; }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [sender] } = await client.query(
      'SELECT balance FROM users WHERE user_id=$1 FOR UPDATE', [resolvedSender]
    );
    if (!sender) { const e = new Error('Sender not found'); e.status = 404; throw e; }
    if (parseFloat(sender.balance) < amt) { const e = new Error('Insufficient kred balance'); e.status = 400; throw e; }
    const { rows: recv } = await client.query('SELECT user_id FROM users WHERE user_id=$1', [receiver_id]);
    if (!recv.length) { const e = new Error('Receiver not found'); e.status = 404; throw e; }
    const { rows: [tx] } = await client.query(
      'INSERT INTO transactions (amount, description) VALUES ($1,$2) RETURNING transaction_id',
      [amt, description || 'Kred transfer']
    );
    await client.query(
      'INSERT INTO peer_transactions (transaction_id, sender_id, receiver_id) VALUES ($1,$2,$3)',
      [tx.transaction_id, resolvedSender, receiver_id]
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

const transferToOrg = async (req, res) => {
  const { org_id, amount, description } = req.body;
  const { role, id: callerId } = req.user;
  const payer_id = role === 'admin' ? (req.body.payer_id || callerId) : callerId;
  const amt = parseFloat(amount);
  if (!org_id || !amt) { const e = new Error('org_id and amount are required'); e.status = 400; throw e; }
  if (amt <= 0) { const e = new Error('Amount must be positive'); e.status = 400; throw e; }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [payer] } = await client.query(
      'SELECT balance FROM users WHERE user_id=$1 FOR UPDATE', [payer_id]
    );
    if (!payer) { const e = new Error('Payer not found'); e.status = 404; throw e; }
    if (parseFloat(payer.balance) < amt) { const e = new Error('Insufficient kred balance'); e.status = 400; throw e; }
    const { rows: orgCheck } = await client.query(
      'SELECT o.org_id FROM orgs o JOIN partnered p ON o.org_id = p.org_id WHERE o.org_id=$1', [org_id]
    );
    if (!orgCheck.length) { const e = new Error('Target must be a partnered organization'); e.status = 400; throw e; }
    const { rows: [tx] } = await client.query(
      'INSERT INTO transactions (amount, description) VALUES ($1,$2) RETURNING transaction_id',
      [amt, description || 'Kred payment to org']
    );
    await client.query(
      'INSERT INTO org_payments (transaction_id, payer_id, org_id) VALUES ($1,$2,$3)',
      [tx.transaction_id, payer_id, org_id]
    );
    await client.query('COMMIT');
    res.json({ transaction_id: tx.transaction_id, message: 'Payment to org successful' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getUserTransactions = async (req, res) => {
  const { id } = req.params;
  const { role, id: callerId } = req.user;
  if (role !== 'admin' && callerId !== id) {
    const e = new Error('Forbidden'); e.status = 403; throw e;
  }
  const { rows } = await db.query(`
    SELECT t.transaction_id, t.amount, t.description, t.time_stamp,
           'peer' AS type,
           CASE WHEN pt.sender_id=$1 THEN 'sent' ELSE 'received' END AS direction,
           CASE WHEN pt.sender_id=$1 THEN rv.username ELSE sn.username END AS counterpart
    FROM transactions t
    JOIN peer_transactions pt ON t.transaction_id = pt.transaction_id
    JOIN users sn ON pt.sender_id   = sn.user_id
    JOIN users rv ON pt.receiver_id = rv.user_id
    WHERE pt.sender_id=$1 OR pt.receiver_id=$1

    UNION ALL

    SELECT t.transaction_id, t.amount, t.description, t.time_stamp,
           'reward' AS type,
           'received' AS direction,
           COALESCE(oi.name, oi.delegate, 'Agency') AS counterpart
    FROM transactions t
    JOIN rewards rw ON t.transaction_id = rw.transaction_id
    LEFT JOIN org_info oi ON rw.org_id = oi.org_id
    WHERE rw.rewardee_id=$1

    UNION ALL

    SELECT gen_random_uuid() AS transaction_id, f.compensation AS amount,
           COALESCE(f.description, 'Favour compensation') AS description,
           cf.done_at AS time_stamp,
           'favour_compensation' AS type,
           'received' AS direction,
           u.username AS counterpart
    FROM completed_favours cf
    JOIN favours f ON cf.favour_id = f.favour_id
    JOIN users u   ON f.requestor_id = u.user_id
    WHERE f.requestee_id=$1 AND f.compensation > 0

    UNION ALL

    SELECT t.transaction_id, t.amount, t.description, t.time_stamp,
           'org_payment' AS type,
           'sent' AS direction,
           COALESCE(oi.name, oi.delegate, 'Organization') AS counterpart
    FROM transactions t
    JOIN org_payments op ON t.transaction_id = op.transaction_id
    LEFT JOIN org_info oi ON op.org_id = oi.org_id
    WHERE op.payer_id=$1

    ORDER BY time_stamp DESC
  `, [id]);
  res.json(rows);
};

const getUserBalanceAudit = async (req, res) => {
  const { id } = req.params;
  const { role, id: callerId } = req.user;
  if (role !== 'admin' && callerId !== id) {
    const e = new Error('Forbidden'); e.status = 403; throw e;
  }
  const { rows } = await db.query(
    'SELECT audit_id, old_balance, new_balance, delta, changed_at FROM balance_audit WHERE user_id=$1 ORDER BY changed_at DESC LIMIT 100',
    [id]
  );
  res.json(rows);
};

module.exports = { getUsers, getUser, lookupUser, createUser, updateUser, deleteUser, transferKreds, transferToOrg, getUserTransactions, getUserBalanceAudit };
