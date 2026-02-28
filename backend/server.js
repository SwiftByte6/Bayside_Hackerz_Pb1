const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const scanRouter = require('./routes/scan');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure temp dir exists
fs.ensureDirSync(path.join(__dirname, 'tmp'));

// Routes
app.use('/api', scanRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'vibe-audit-backend', version: '1.0.0' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Vibe-Audit Backend running at http://localhost:${PORT}`);
});

module.exports = app;
