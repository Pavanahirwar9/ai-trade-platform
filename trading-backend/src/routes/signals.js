/**
 * @module routes/signals
 * @description Express routes for trading signal endpoints.
 */

const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { generateSignal, scanMultipleSymbols } = require('../services/signalEngine');

/** Request body schema for batch scan */
const scanSchema = z.object({
  symbols: z
    .array(z.string().min(1))
    .min(1, 'At least one symbol is required')
    .max(20, 'Maximum 20 symbols per scan'),
});

/**
 * POST /api/signals/scan
 * Batch signal generation for multiple symbols.
 * Body: { "symbols": ["RELIANCE.NS", "TCS.NS"] }
 */
router.post('/scan', async (req, res, next) => {
  try {
    const parsed = scanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const data = await scanMultipleSymbols(parsed.data.symbols);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/signals/:symbol
 * Returns the BUY/SELL/HOLD signal for a single stock.
 */
router.get('/:symbol', async (req, res, next) => {
  if (req.params.symbol === 'scan') return next(); // Prevent route conflict
  try {
    const { symbol } = req.params;
    const data = await generateSignal(symbol);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
