/**
 * @module app
 * @description Express application setup with middleware, routes, and error handling.
 */

const express = require('express');
const cors = require('cors');
const { requestLogger } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const marketRoutes = require('./routes/market');
const signalRoutes = require('./routes/signals');
const tradeRoutes = require('./routes/trades');
const portfolioRoutes = require('./routes/portfolio');

const app = express();

// ── Core middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const config = require('./config/config');
  res.json({
    success: true,
    data: {
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      marketOpen: config.isMarketOpen(),
      version: '1.0.0',
    },
  });
});

// ── API routes ───────────────────────────────────────────────────────────────
app.use('/api/market', marketRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/portfolio', portfolioRoutes);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found.`,
    },
  });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
