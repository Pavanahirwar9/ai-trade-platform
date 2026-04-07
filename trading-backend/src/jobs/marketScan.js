/**
 * @module jobs/marketScan
 * @description Cron job that periodically scans the watchlist for trading signals
 * during NSE market hours. Optionally auto-executes BUY/SELL signals.
 *
 * Schedule: Every 5 minutes, Mon–Fri, 9:15 AM – 3:30 PM IST.
 */

const cron = require('node-cron');
const config = require('../config/config');
const { scanMultipleSymbols } = require('../services/signalEngine');
const { executeTrade } = require('../services/tradeExecutor');
const { logger } = require('../middleware/logger');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/** Default quantity to auto-trade when AUTO_EXECUTE_SIGNALS is true */
const DEFAULT_AUTO_TRADE_QTY = 5;

/**
 * Runs a single market scan iteration.
 * Scans the configured watchlist for signals and optionally executes trades.
 */
const runScan = async () => {
  logger.info('=== MARKET SCAN JOB STARTED ===');

  // Check if market is open
  if (!config.isMarketOpen()) {
    logger.info('Market is closed. Skipping scan.');
    return;
  }

  try {
    // Fetch watchlist dynamically from DB, fallback to config.watchlist
    const dbWatchlist = await prisma.watchlist.findMany();
    const symbolsToScan = dbWatchlist.length > 0 
      ? dbWatchlist.map(w => w.symbol) 
      : config.watchlist;

    const results = await scanMultipleSymbols(symbolsToScan);

    for (const result of results) {
      if (!result.success) {
        logger.warn(`Scan failed for ${result.symbol}: ${result.error}`);
        continue;
      }

      const signal = result.data;
      logger.info(
        `[SCAN] ${signal.symbol}: ${signal.signal} | Price: ₹${signal.currentPrice} | SMA50: ${signal.sma50} | SMA200: ${signal.sma200} | Crossover: ${signal.crossoverType}`
      );

      // Auto-execute if enabled and signal is actionable
      if (config.autoExecuteSignals && (signal.signal === 'BUY' || signal.signal === 'SELL')) {
        try {
          logger.info(`Auto-executing ${signal.signal} for ${signal.symbol}`);
          const tradeResult = await executeTrade(signal.symbol, signal.signal, DEFAULT_AUTO_TRADE_QTY);
          logger.info(`Auto-trade executed: ${JSON.stringify(tradeResult.trade)}`);
        } catch (tradeErr) {
          logger.error(`Auto-trade failed for ${signal.symbol}: ${tradeErr.message}`);
        }
      }
    }
  } catch (err) {
    logger.error(`Market scan job failed: ${err.message}`);
  }

  logger.info('=== MARKET SCAN JOB COMPLETED ===');
};

/**
 * Starts the cron-based market scan scheduler.
 * Runs every 5 minutes during NSE trading hours (Mon–Fri, 9:15–15:30 IST).
 */
const startMarketScanJob = () => {
  // Cron: every 5 minutes, hours 9–15, Mon–Fri
  // We further filter inside the handler for the 9:15 start and 15:30 end
  const schedule = '*/5 9-15 * * 1-5';

  const job = cron.schedule(
    schedule,
    () => {
      runScan().catch((err) => {
        logger.error(`Unhandled error in market scan job: ${err.message}`);
      });
    },
    {
      timezone: config.market.timezone,
    }
  );

  logger.info(`Market scan cron job scheduled: ${schedule} (${config.market.timezone})`);
  logger.info(`Auto-execute signals: ${config.autoExecuteSignals}`);

  return job;
};

module.exports = { startMarketScanJob, runScan };
