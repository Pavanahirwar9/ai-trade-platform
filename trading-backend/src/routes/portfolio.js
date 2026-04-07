/**
 * @module routes/portfolio
 * @description Express routes for portfolio status and P&L endpoints.
 */

const express = require('express');
const router = express.Router();
const { getPortfolio, calculatePnL } = require('../services/tradeExecutor');
const { getMultipleQuotes } = require('../services/marketData');

/**
 * GET /api/portfolio
 * Returns the current portfolio: cash balance, holdings, invested amounts.
 */
router.get('/', async (req, res, next) => {
  try {
    const pf = getPortfolio();

    // Try to update current prices for holdings
    if (pf.holdings.length > 0) {
      const symbols = pf.holdings.map((h) => h.symbol);
      const quotes = await getMultipleQuotes(symbols);
      const priceMap = {};
      quotes.forEach((q) => {
        if (q.success) {
          priceMap[q.data.symbol] = q.data.price;
        }
      });

      // Recalculate with live prices
      const pnlData = await calculatePnL(priceMap);
      return res.json({ success: true, data: pnlData });
    }

    res.json({
      success: true,
      data: {
        cashBalance: pf.cashBalance,
        totalInvested: pf.totalInvested,
        currentValue: 0,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        holdings: pf.holdings,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/portfolio/pnl
 * Returns detailed realized + unrealized P&L summary.
 */
router.get('/pnl', async (req, res, next) => {
  try {
    const pf = getPortfolio();
    const priceMap = {};

    // Update live prices
    if (pf.holdings.length > 0) {
      const symbols = pf.holdings.map((h) => h.symbol);
      const quotes = await getMultipleQuotes(symbols);
      quotes.forEach((q) => {
        if (q.success) {
          priceMap[q.data.symbol] = q.data.price;
        }
      });
    }

    const pnlData = await calculatePnL(priceMap);
    res.json({ success: true, data: pnlData });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
