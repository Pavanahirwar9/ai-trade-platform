/**
 * @module routes/trades
 * @description Express routes for trade execution and history.
 */

const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { executeTrade, getTradeHistory, getTradeHistoryBySymbol } = require('../services/tradeExecutor');

/** Request body schema for trade execution */
const executeTradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  signal: z.enum(['BUY', 'SELL'], { errorMap: () => ({ message: 'Signal must be BUY or SELL' }) }),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

/**
 * POST /api/trades/execute
 * Executes a simulated trade.
 * Body: { "symbol": "RELIANCE.NS", "signal": "BUY", "quantity": 10 }
 */
router.post('/execute', async (req, res, next) => {
  try {
    const parsed = executeTradeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const { symbol, signal, quantity } = parsed.data;
    const result = await executeTrade(symbol, signal, quantity);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/trades/history
 * Returns all simulated trade history.
 */
router.get('/history', async (req, res, next) => {
  try {
    const trades = await getTradeHistory();
    res.json({
      success: true,
      count: trades.length,
      data: trades,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/trades/history/:symbol
 * Returns trade history for a specific stock.
 */
router.get('/history/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const trades = await getTradeHistoryBySymbol(symbol);
    res.json({
      success: true,
      symbol,
      count: trades.length,
      data: trades,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
