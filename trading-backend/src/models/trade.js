/**
 * @module models/trade
 * @description Trade model — records and retrieves simulated trade history.
 * Persists to PostgreSQL via Prisma.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logger } = require('../middleware/logger');

/**
 * Initializes/Loads trade history (no-op for DB, kept for API compatibility).
 */
const loadTrades = () => {
  return [];
};

/**
 * Records a new trade in PostgreSQL.
 */
const recordTrade = async (trade) => {
  try {
    const tradeRecord = await prisma.trade.create({
      data: {
        symbol: trade.symbol,
        type: trade.type,
        quantity: trade.quantity,
        price: parseFloat(trade.price.toFixed(2)),
        totalCost: parseFloat(trade.totalCost.toFixed(2)),
        brokerage: parseFloat(trade.brokerage.toFixed(2)),
        stt: parseFloat((trade.stt || 0).toFixed(2)),
        signal: trade.signal,
        status: 'EXECUTED',
      }
    });
    
    logger.info(`Trade recorded in DB: ${tradeRecord.type} ${tradeRecord.quantity} x ${tradeRecord.symbol} @ ₹${tradeRecord.price}`);
    return tradeRecord;
  } catch (err) {
    logger.error('Failed to record trade in DB', { error: err.message });
    throw err;
  }
};

/**
 * Returns all trade history from DB.
 */
const getAllTrades = async () => {
  return await prisma.trade.findMany({
    orderBy: { timestamp: 'desc' }
  });
};

/**
 * Returns trades for a specific symbol from DB.
 */
const getTradesBySymbol = async (symbol) => {
  return await prisma.trade.findMany({
    where: { symbol },
    orderBy: { timestamp: 'desc' }
  });
};

module.exports = {
  loadTrades,
  recordTrade,
  getAllTrades,
  getTradesBySymbol,
};
