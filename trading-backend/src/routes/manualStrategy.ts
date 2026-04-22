const express = require('express');
const { z } = require('zod');
const {
  createManualStrategy,
  cancelManualStrategy,
  stopManualStrategy,
  getStrategies,
} = require('../services/manualStrategyPlanner');

const router = express.Router();

const createSchema = z.object({
  symbol: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  entry: z.number().positive(),
  stopLoss: z.number().positive(),
  takeProfit: z.number().positive(),
  rationale: z.string().optional(),
});

router.get('/', (req, res) => {
  res.json({ success: true, data: getStrategies() });
});

router.post('/', (req, res) => {
  const parsed = createSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => e.message).join(', ') },
    });
  }

  const strategy = createManualStrategy(parsed.data);
  return res.json({ success: true, data: strategy });
});

router.post('/:id/cancel', (req, res) => {
  const strategy = cancelManualStrategy(req.params.id);
  if (!strategy) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Strategy not found.' },
    });
  }
  return res.json({ success: true, data: strategy });
});

router.post('/:id/stop', async (req, res, next) => {
  try {
    const strategy = await stopManualStrategy(req.params.id);
    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Strategy not found.' },
      });
    }
    return res.json({ success: true, data: strategy });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
