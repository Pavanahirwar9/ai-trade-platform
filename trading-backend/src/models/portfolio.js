/**
 * @module models/portfolio
 * @description Portfolio state manager with in-memory cache and JSON file persistence.
 * Manages cash balance, holdings, and invested amounts.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const { logger } = require('../middleware/logger');

/** In-memory portfolio state */
let portfolioState = null;

/**
 * Ensures the data directory and portfolio file exist.
 */
const ensureDataDir = () => {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
};

/**
 * Loads the portfolio from disk into memory.
 * If file doesn't exist, initializes with default capital.
 * @returns {object} The portfolio state object.
 */
const loadPortfolio = () => {
  ensureDataDir();
  try {
    if (fs.existsSync(config.portfolioFile)) {
      const raw = fs.readFileSync(config.portfolioFile, 'utf-8');
      portfolioState = JSON.parse(raw);
      logger.info('Portfolio loaded from disk');
    } else {
      portfolioState = {
        cashBalance: config.initialCapital,
        holdings: [],
        totalInvested: 0,
        lastUpdated: new Date().toISOString(),
      };
      savePortfolio();
      logger.info('Portfolio initialized with default capital');
    }
  } catch (err) {
    logger.error('Failed to load portfolio, reinitializing', { error: err.message });
    portfolioState = {
      cashBalance: config.initialCapital,
      holdings: [],
      totalInvested: 0,
      lastUpdated: new Date().toISOString(),
    };
    savePortfolio();
  }
  return portfolioState;
};

/**
 * Saves the current in-memory portfolio state to disk.
 */
const savePortfolio = () => {
  ensureDataDir();
  try {
    portfolioState.lastUpdated = new Date().toISOString();
    fs.writeFileSync(config.portfolioFile, JSON.stringify(portfolioState, null, 2), 'utf-8');
    logger.debug('Portfolio saved to disk');
  } catch (err) {
    logger.error('Failed to save portfolio', { error: err.message });
  }
};

/**
 * Returns the current portfolio state.
 * @returns {object} Portfolio state.
 */
const getPortfolio = () => {
  if (!portfolioState) loadPortfolio();
  return { ...portfolioState };
};

/**
 * Returns the current cash balance.
 * @returns {number} Cash balance in INR.
 */
const getCashBalance = () => {
  if (!portfolioState) loadPortfolio();
  return portfolioState.cashBalance;
};

/**
 * Updates the cash balance by a delta amount.
 * @param {number} delta - Amount to add (positive) or subtract (negative).
 */
const updateCashBalance = (delta) => {
  if (!portfolioState) loadPortfolio();
  portfolioState.cashBalance = parseFloat((portfolioState.cashBalance + delta).toFixed(2));
  savePortfolio();
};

/**
 * Adds a new holding or updates quantity/avg price for an existing one.
 * @param {string} symbol - Stock symbol.
 * @param {number} qty - Quantity to add.
 * @param {number} price - Buy price per share.
 */
const addHolding = (symbol, qty, price) => {
  if (!portfolioState) loadPortfolio();
  const existing = portfolioState.holdings.find((h) => h.symbol === symbol);
  if (existing) {
    const totalCost = existing.avgBuyPrice * existing.qty + price * qty;
    existing.qty += qty;
    existing.avgBuyPrice = parseFloat((totalCost / existing.qty).toFixed(2));
  } else {
    portfolioState.holdings.push({
      symbol,
      qty,
      avgBuyPrice: parseFloat(price.toFixed(2)),
      currentPrice: parseFloat(price.toFixed(2)),
      pnl: 0,
    });
  }
  // Recalculate totalInvested
  portfolioState.totalInvested = parseFloat(
    portfolioState.holdings.reduce((sum, h) => sum + h.avgBuyPrice * h.qty, 0).toFixed(2)
  );
  savePortfolio();
};

/**
 * Removes shares from a holding. Removes the holding entirely if qty reaches 0.
 * @param {string} symbol - Stock symbol.
 * @param {number} qty - Quantity to remove.
 * @returns {object|null} The holding that was reduced, or null if not found.
 */
const removeHolding = (symbol, qty) => {
  if (!portfolioState) loadPortfolio();
  const idx = portfolioState.holdings.findIndex((h) => h.symbol === symbol);
  if (idx === -1) return null;

  const holding = portfolioState.holdings[idx];
  holding.qty -= qty;

  if (holding.qty <= 0) {
    portfolioState.holdings.splice(idx, 1);
  }

  // Recalculate totalInvested
  portfolioState.totalInvested = parseFloat(
    portfolioState.holdings.reduce((sum, h) => sum + h.avgBuyPrice * h.qty, 0).toFixed(2)
  );
  savePortfolio();
  return holding;
};

/**
 * Returns the holding for a specific symbol, or null.
 * @param {string} symbol - Stock symbol.
 * @returns {object|null}
 */
const getHolding = (symbol) => {
  if (!portfolioState) loadPortfolio();
  return portfolioState.holdings.find((h) => h.symbol === symbol) || null;
};

/**
 * Updates the current market price for all holdings.
 * @param {object} priceMap - { symbol: currentPrice }
 */
const updateCurrentPrices = (priceMap) => {
  if (!portfolioState) loadPortfolio();
  portfolioState.holdings.forEach((h) => {
    if (priceMap[h.symbol] !== undefined) {
      h.currentPrice = parseFloat(priceMap[h.symbol].toFixed(2));
      h.pnl = parseFloat(((h.currentPrice - h.avgBuyPrice) * h.qty).toFixed(2));
    }
  });
  savePortfolio();
};

/**
 * Resets the portfolio to initial state.
 */
const resetPortfolio = () => {
  portfolioState = {
    cashBalance: config.initialCapital,
    holdings: [],
    totalInvested: 0,
    lastUpdated: new Date().toISOString(),
  };
  savePortfolio();
  logger.info('Portfolio reset to initial state');
};

module.exports = {
  loadPortfolio,
  savePortfolio,
  getPortfolio,
  getCashBalance,
  updateCashBalance,
  addHolding,
  removeHolding,
  getHolding,
  updateCurrentPrices,
  resetPortfolio,
};
