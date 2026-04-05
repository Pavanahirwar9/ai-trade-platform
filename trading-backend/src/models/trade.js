/**
 * @module models/trade
 * @description Trade model — records and retrieves simulated trade history.
 * Persists to a JSON file on disk.
 */

const fs = require('fs');
const config = require('../config/config');
const { logger } = require('../middleware/logger');

/** In-memory trade history */
let tradesHistory = null;

/**
 * Ensures the data directory exists.
 */
const ensureDataDir = () => {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
};

/**
 * Loads trade history from disk.
 * @returns {Array} Array of trade records.
 */
const loadTrades = () => {
  ensureDataDir();
  try {
    if (fs.existsSync(config.tradesFile)) {
      const raw = fs.readFileSync(config.tradesFile, 'utf-8');
      tradesHistory = JSON.parse(raw);
      logger.info(`Loaded ${tradesHistory.length} trades from disk`);
    } else {
      tradesHistory = [];
      saveTrades();
    }
  } catch (err) {
    logger.error('Failed to load trades, reinitializing', { error: err.message });
    tradesHistory = [];
    saveTrades();
  }
  return tradesHistory;
};

/**
 * Saves trade history to disk.
 */
const saveTrades = () => {
  ensureDataDir();
  try {
    fs.writeFileSync(config.tradesFile, JSON.stringify(tradesHistory, null, 2), 'utf-8');
    logger.debug('Trades saved to disk');
  } catch (err) {
    logger.error('Failed to save trades', { error: err.message });
  }
};

/**
 * Records a new trade.
 * @param {object} trade - Trade details.
 * @param {string} trade.symbol - Stock symbol.
 * @param {string} trade.type - 'BUY' or 'SELL'.
 * @param {number} trade.quantity - Number of shares.
 * @param {number} trade.price - Execution price per share.
 * @param {number} trade.totalCost - Total cost/proceeds including fees.
 * @param {number} trade.brokerage - Brokerage fee applied.
 * @param {number} trade.stt - STT applied (sell only).
 * @param {string} trade.signal - Signal that triggered the trade.
 * @returns {object} The recorded trade with id and timestamp.
 */
const recordTrade = (trade) => {
  if (!tradesHistory) loadTrades();

  const tradeRecord = {
    id: `TRD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    symbol: trade.symbol,
    type: trade.type,
    quantity: trade.quantity,
    price: parseFloat(trade.price.toFixed(2)),
    totalCost: parseFloat(trade.totalCost.toFixed(2)),
    brokerage: parseFloat(trade.brokerage.toFixed(2)),
    stt: parseFloat((trade.stt || 0).toFixed(2)),
    signal: trade.signal,
    status: 'EXECUTED',
  };

  tradesHistory.push(tradeRecord);
  saveTrades();
  logger.info(`Trade recorded: ${tradeRecord.type} ${tradeRecord.quantity} x ${tradeRecord.symbol} @ ₹${tradeRecord.price}`);
  return tradeRecord;
};

/**
 * Returns all trade history.
 * @returns {Array} All trades.
 */
const getAllTrades = () => {
  if (!tradesHistory) loadTrades();
  return [...tradesHistory];
};

/**
 * Returns trades for a specific symbol.
 * @param {string} symbol - Stock symbol.
 * @returns {Array} Trades for the given symbol.
 */
const getTradesBySymbol = (symbol) => {
  if (!tradesHistory) loadTrades();
  return tradesHistory.filter((t) => t.symbol === symbol);
};

module.exports = {
  loadTrades,
  recordTrade,
  getAllTrades,
  getTradesBySymbol,
};
