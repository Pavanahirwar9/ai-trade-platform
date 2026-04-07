/**
 * @module routes/market
 * @description Express routes for market data endpoints.
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getLiveQuote, getHistoricalData, getMultipleQuotes } = require('../services/marketData');
const config = require('../config/config');
const axios = require('axios');

let cachedInstruments = []; // Fallback cache

/**
 * GET /api/market/search
 * Searches the Instrument database for matching stocks.
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const queryLower = q.toLowerCase();

    try {
      // 1. Try fetching from Prisma DB
      const results = await prisma.instrument.findMany({
        where: {
          OR: [
            { symbol: { contains: q.toUpperCase(), mode: 'insensitive' } },
            { name: { contains: q.toUpperCase(), mode: 'insensitive' } }
          ],
          exch_seg: 'NSE'
        },
        take: 20
      });
      
      if (results.length > 0) {
        // Normalize symbol format for the frontend (e.g., RELIANCE-EQ -> RELIANCE.NS)
        const normalized = results.map(item => ({
          ...item,
          symbol: item.symbol.replace('-EQ', '') + '.NS'
        }));
        return res.json({ success: true, data: normalized });
      }
      
      throw new Error("DB empty, falling back");
    } catch (dbError) {
      // 2. Fallback to live JSON load if Prisma is not fully configured yet
      if (cachedInstruments.length === 0) {
        console.log("DB missing/failed, fetching fallback JSON from Angel One...");
        const { data } = await axios.get("https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json");
        cachedInstruments = data.filter(item => item.exch_seg === 'NSE' && item.symbol.includes('-EQ'));
      }
      
      const filtered = cachedInstruments.filter(i => 
        i.symbol.toLowerCase().includes(queryLower) || 
        i.name.toLowerCase().includes(queryLower)
      ).slice(0, 20);

      return res.json({ success: true, data: filtered });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/market/seed
 * Refreshes Angel One Instruments from the master JSON open API
 */
router.post('/seed', async (req, res, next) => {
  try {
    console.log("Fetching latest Master Instrument JSON from Angel One...");
    const { data } = await axios.get("https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json");
    
    // Filter only NSE equities 
    const nseEq = data.filter(item => item.exch_seg === 'NSE' && item.symbol.includes('-EQ'));
    console.log(`Found ${nseEq.length} NSE EQ instruments. Updating DB...`);

    // Bulk insert (using transaction to drop old ones or just upsert)
    // Clearing out old records in a raw manner can lock tables, let's use deleteMany instead
    await prisma.instrument.deleteMany({ where: { exch_seg: 'NSE' } });

    const batches = [];
    for (let i = 0; i < nseEq.length; i += 5000) {
      batches.push(nseEq.slice(i, i + 5000));
    }

    for (const batch of batches) {
      await prisma.instrument.createMany({
        data: batch.map(b => ({
          token: b.token,
          symbol: b.symbol,
          name: b.name,
          exchange: b.exch_seg,
          exch_seg: b.exch_seg
        })),
        skipDuplicates: true
      });
    }

    res.json({ success: true, message: `Successfully synced ${nseEq.length} NSE symbols.` });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

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

/**
 * GET /api/market/watchlist
 * Fetches the user's saved watchlist from PostgreSQL.
 */
router.get('/watchlist', async (req, res, next) => {
  try {
    const watchlist = await prisma.watchlist.findMany({
      orderBy: { addedAt: 'desc' },
    });
    res.json({ success: true, data: watchlist.map((w) => w.symbol) });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/market/watchlist
 * Adds a new symbol to the watchlist in PostgreSQL.
 */
router.post('/watchlist', async (req, res, next) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ success: false, message: 'Symbol is required' });
    }

    const item = await prisma.watchlist.upsert({
      where: { symbol },
      update: {},
      create: { symbol },
    });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/market/watchlist/:symbol
 * Removes a symbol from the watchlist in PostgreSQL.
 */
router.delete('/watchlist/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    await prisma.watchlist.delete({
      where: { symbol },
    }).catch((e) => {
      // Ignore error if record to delete does not exist
      if (e.code !== 'P2025') throw e; 
    });
    res.json({ success: true, message: 'Removed successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
