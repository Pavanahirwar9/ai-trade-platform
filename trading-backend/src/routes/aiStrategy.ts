const express = require('express');
const router = express.Router();
const { z } = require('zod');
const {
  analyzeSymbol,
  startAiTrade,
  stopAiTrade,
  getSessions,
} = require('../services/aiTradeOrchestrator');

const analyzeSchema = z.object({
  symbol: z.string().min(1),
  quantity: z.number().int().positive().optional(),
});

const startSchema = z.object({
  symbol: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  strategy: z.any().optional(),
});

const stopSchema = z.object({
  sessionId: z.string().optional(),
  reason: z.string().optional(),
  squareOff: z.boolean().optional(),
});

router.post('/analyze', async (req, res, next) => {
  try {
    const parsed = analyzeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => e.message).join(', ') },
      });
    }

    const result = await analyzeSymbol(parsed.data);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/start', async (req, res, next) => {
  try {
    const parsed = startSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => e.message).join(', ') },
      });
    }

    let strategy = parsed.data.strategy;
    if (!strategy) {
      const analysisPack = await analyzeSymbol({
        symbol: parsed.data.symbol,
        quantity: parsed.data.quantity,
      });
      strategy = analysisPack.strategy;
    }

    const session = await startAiTrade({
      symbol: parsed.data.symbol,
      quantity: parsed.data.quantity,
      strategy,
    });
    
    // Remove intervalId before sending to client
    const { intervalId, ...safeSession } = session;
    res.json({ success: true, data: safeSession });
  } catch (err) {
    next(err);
  }
});

router.post('/stop', async (req, res, next) => {
  try {
    const parsed = stopSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => e.message).join(', ') },
      });
    }

    const session = await stopAiTrade({
      sessionId: parsed.data.sessionId,
      reason: parsed.data.reason || 'Stopped by user',
      squareOff: parsed.data.squareOff !== false,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found.' },
      });
    }

    const { intervalId, ...safeSession } = session;
    res.json({ success: true, data: safeSession });
  } catch (err) {
    next(err);
  }
});

router.get('/sessions', (req, res) => {
  res.json({ success: true, data: getSessions() });
});

module.exports = router;
