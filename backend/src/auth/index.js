const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kredit_secret_fallback';

const sign   = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
const verify = (token)   => jwt.verify(token, JWT_SECRET);

module.exports = { sign, verify };
