require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const helmet  = require('helmet');

const routes       = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(morgan('dev'));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', app: 'Kredit API' }));

// ── Error handler (must be last) ───────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Kredit API running on http://localhost:${PORT}`);
});