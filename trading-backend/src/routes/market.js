/**
 * @module routes/market
 * @description Express routes for market data endpoints.
 */

const express = require('express');
const router = express.Router();
const { getLiveQuote, getHistoricalData, getMultipleQuotes } = require('../services/marketData');
const config = require('../config/config');

/**
 * GET /api/market/quote/:symbol
 * Returns live quote for a single NSE stock.
 */
router.get('/quote/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const data = await getLiveQuote(symbol);
    res.json({
      success: true,
      data,
      marketOpen: config.isMarketOpen(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/market/history/:symbol
 * Returns historical OHLCV data for a stock.
 * Optional query: ?period=6 (in months, default 14)
 */
router.get('/history/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { period } = req.query;
    const data = await getHistoricalData(symbol, period);
    res.json({
      success: true,
      symbol,
      count: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/market/quotes?symbols=RELIANCE.NS,TCS.NS
 * Returns live quotes for multiple symbols.
 */
router.get('/quotes', async (req, res, next) => {
  try {
    const { symbols } = req.query;
    if (!symbols) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_SYMBOLS', message: 'Provide symbols as comma-separated query param.' },
      });
    }
    const symbolList = symbols.split(',').map((s) => s.trim());
    const data = await getMultipleQuotes(symbolList);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
