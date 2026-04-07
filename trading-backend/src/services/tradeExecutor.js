/**
 * @module services/tradeExecutor
 * @description Simulates trade execution against the virtual portfolio.
 * Applies brokerage and STT fees, validates constraints, and persists state.
 */

const config = require('../config/config');
const portfolio = require('../models/portfolio');
const tradeModel = require('../models/trade');
const { getLiveQuote } = require('./marketData');
const { logger } = require('../middleware/logger');

/**
 * Executes a simulated trade (BUY or SELL).
 *
 * @param {string} symbol - Stock symbol.
 * @param {string} signal - 'BUY' or 'SELL'.
 * @param {number} quantity - Number of shares to trade.
 * @returns {Promise<object>} Trade result with execution details.
 * @throws {Error} If validation fails (insufficient funds, no holdings, etc.).
 */
const executeTrade = async (symbol, signal, quantity) => {
  logger.info(`Executing ${signal} trade: ${quantity} x ${symbol}`);

  if (!['BUY', 'SELL'].includes(signal)) {
    const err = new Error('Invalid signal. Must be BUY or SELL.');
    err.statusCode = 400;
    err.code = 'INVALID_SIGNAL';
    throw err;
  }

  if (quantity <= 0 || !Number.isInteger(quantity)) {
    const err = new Error('Quantity must be a positive integer.');
    err.statusCode = 400;
    err.code = 'INVALID_QUANTITY';
    throw err;
  }

  // Get current price
  const quote = await getLiveQuote(symbol);
  const price = quote.price;

  if (signal === 'BUY') {
    return executeBuy(symbol, price, quantity);
  } else {
    return executeSell(symbol, price, quantity);
  }
};

/**
 * Executes a simulated BUY order.
 *
 * @param {string} symbol - Stock symbol.
 * @param {number} price - Current market price.
 * @param {number} quantity - Shares to buy.
 * @returns {object} Trade result.
 */
const executeBuy = async (symbol, price, quantity) => {
  const grossCost = price * quantity;
  const brokerage = parseFloat((grossCost * config.fees.brokerage).toFixed(2));
  const totalCost = parseFloat((grossCost + brokerage).toFixed(2));

  // Check if we have enough cash
  const cashBalance = portfolio.getCashBalance();
  if (totalCost > cashBalance) {
    const err = new Error(
      `Insufficient funds. Required: ₹${totalCost.toFixed(2)}, Available: ₹${cashBalance.toFixed(2)}`
    );
    err.statusCode = 400;
    err.code = 'INSUFFICIENT_FUNDS';
    throw err;
  }

  // Deduct cash and add holding
  portfolio.updateCashBalance(-totalCost);
  portfolio.addHolding(symbol, quantity, price);

  // Record trade
  const trade = await tradeModel.recordTrade({
    symbol,
    type: 'BUY',
    quantity,
    price,
    totalCost,
    brokerage,
    stt: 0,
    signal: 'BUY',
  });

  logger.info(`BUY executed: ${quantity} x ${symbol} @ ₹${price} | Total: ₹${totalCost}`);
  return {
    trade,
    portfolio: portfolio.getPortfolio(),
  };
};

/**
 * Executes a simulated SELL order.
 *
 * @param {string} symbol - Stock symbol.
 * @param {number} price - Current market price.
 * @param {number} quantity - Shares to sell.
 * @returns {object} Trade result.
 */
const executeSell = async (symbol, price, quantity) => {
  const holding = portfolio.getHolding(symbol);
  if (!holding) {
    const err = new Error(`No holdings found for ${symbol}. Cannot sell.`);
    err.statusCode = 400;
    err.code = 'NO_HOLDINGS';
    throw err;
  }

  if (holding.qty < quantity) {
    const err = new Error(
      `Insufficient shares. Holding: ${holding.qty}, Requested: ${quantity}`
    );
    err.statusCode = 400;
    err.code = 'INSUFFICIENT_SHARES';
    throw err;
  }

  const grossProceeds = price * quantity;
  const brokerage = parseFloat((grossProceeds * config.fees.brokerage).toFixed(2));
  const stt = parseFloat((grossProceeds * config.fees.stt).toFixed(2));
  const netProceeds = parseFloat((grossProceeds - brokerage - stt).toFixed(2));

  // Add cash and remove holding
  portfolio.updateCashBalance(netProceeds);
  portfolio.removeHolding(symbol, quantity);

  // Record trade
  const trade = await tradeModel.recordTrade({
    symbol,
    type: 'SELL',
    quantity,
    price,
    totalCost: netProceeds,
    brokerage,
    stt,
    signal: 'SELL',
  });

  logger.info(`SELL executed: ${quantity} x ${symbol} @ ₹${price} | Net: ₹${netProceeds}`);
  return {
    trade,
    portfolio: portfolio.getPortfolio(),
  };
};

/**
 * Returns the current portfolio state.
 * @returns {object} Portfolio state.
 */
const getPortfolio = () => {
  return portfolio.getPortfolio();
};

/**
 * Calculates realized + unrealized P&L summary.
 *
 * @param {object} [livePriceMap] - Optional map of { symbol: currentPrice }.
 *   If not provided, current holdings' stored prices are used.
 * @returns {object} P&L summary.
 */
const calculatePnL = async (livePriceMap) => {
  const pf = portfolio.getPortfolio();

  // Update prices if live prices provided
  if (livePriceMap) {
    portfolio.updateCurrentPrices(livePriceMap);
  }

  const updated = portfolio.getPortfolio();

  // Unrealized P&L
  let unrealizedPnL = 0;
  let currentValue = 0;
  updated.holdings.forEach((h) => {
    unrealizedPnL += (h.currentPrice - h.avgBuyPrice) * h.qty;
    currentValue += h.currentPrice * h.qty;
  });
  unrealizedPnL = parseFloat(unrealizedPnL.toFixed(2));
  currentValue = parseFloat(currentValue.toFixed(2));

  // Realized P&L from trade history
  const allTrades = await tradeModel.getAllTrades();
  let realizedPnL = 0;
  // Simple approach: sum all SELL proceeds minus cost basis
  const sellTrades = allTrades.filter((t) => t.type === 'SELL');
  // This is a simplified P&L — for full accuracy, FIFO matching would be needed
  sellTrades.forEach((t) => {
    // Realized gain is embedded in sell proceeds vs buy cost — tracked separately would be ideal
    // For now, we approximate via total portfolio change
  });
  realizedPnL = parseFloat(
    (updated.cashBalance + currentValue - config.initialCapital).toFixed(2)
  ) - unrealizedPnL;

  const totalPnL = parseFloat((realizedPnL + unrealizedPnL).toFixed(2));
  const unrealizedPnLPercent =
    updated.totalInvested > 0
      ? parseFloat(((unrealizedPnL / updated.totalInvested) * 100).toFixed(2))
      : 0;

  return {
    cashBalance: updated.cashBalance,
    totalInvested: updated.totalInvested,
    currentValue,
    unrealizedPnL,
    unrealizedPnLPercent,
    realizedPnL: parseFloat(realizedPnL.toFixed(2)),
    totalPnL,
    holdings: updated.holdings,
  };
};

/**
 * Returns all trade history.
 * @returns {Array} Trade records.
 */
const getTradeHistory = () => {
  return tradeModel.getAllTrades();
};

/**
 * Returns trade history for a specific symbol.
 * @param {string} symbol - Stock symbol.
 * @returns {Array} Trade records for the symbol.
 */
const getTradeHistoryBySymbol = (symbol) => {
  return tradeModel.getTradesBySymbol(symbol);
};

module.exports = {
  executeTrade,
  getPortfolio,
  calculatePnL,
  getTradeHistory,
  getTradeHistoryBySymbol,
};
