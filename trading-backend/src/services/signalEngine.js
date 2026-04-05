/**
 * @module services/signalEngine
 * @description Generates BUY / SELL / HOLD trading signals based on
 * the SMA 50/200 crossover strategy.
 */

const config = require('../config/config');
const { getHistoricalData, getLiveQuote } = require('./marketData');
const { calculateSMA, detectCrossover } = require('./indicators');
const { logger } = require('../middleware/logger');

/**
 * Generates a trading signal for a single symbol using SMA crossover strategy.
 *
 * @param {string} symbol - Yahoo Finance symbol (e.g. "RELIANCE.NS").
 * @returns {Promise<object>} Signal object containing:
 *   { symbol, timestamp, signal, currentPrice, sma50, sma200, crossoverType, confidence }
 */
const generateSignal = async (symbol) => {
  logger.info(`Generating signal for ${symbol}`);

  // Fetch historical daily data
  const historicalData = await getHistoricalData(symbol);
  const closingPrices = historicalData.map((bar) => bar.close);

  // Ensure enough data for SMA 200
  if (closingPrices.length < config.smaLongPeriod) {
    logger.warn(`Insufficient data for ${symbol}: ${closingPrices.length} bars, need ${config.smaLongPeriod}`);
    return {
      symbol,
      timestamp: new Date().toISOString(),
      signal: 'HOLD',
      currentPrice: closingPrices[closingPrices.length - 1] || 0,
      sma50: null,
      sma200: null,
      crossoverType: 'INSUFFICIENT_DATA',
      confidence: 'NONE',
    };
  }

  // Calculate SMAs
  const smaShort = calculateSMA(closingPrices, config.smaShortPeriod);
  const smaLong = calculateSMA(closingPrices, config.smaLongPeriod);

  // Detect crossover
  const crossover = detectCrossover(smaShort, smaLong);

  // Get latest SMA values
  const latestSMA50 = smaShort[smaShort.length - 1];
  const latestSMA200 = smaLong[smaLong.length - 1];

  // Try to get current live price; fall back to last close
  let currentPrice;
  try {
    const quote = await getLiveQuote(symbol);
    currentPrice = quote.price;
  } catch {
    currentPrice = closingPrices[closingPrices.length - 1];
  }

  // Determine signal and confidence
  let signal = 'HOLD';
  let confidence = 'LOW';

  if (crossover.type === 'GOLDEN_CROSS') {
    signal = 'BUY';
    // Higher confidence if price is also above both SMAs
    confidence = currentPrice > latestSMA50 && currentPrice > latestSMA200 ? 'HIGH' : 'MEDIUM';
  } else if (crossover.type === 'DEATH_CROSS') {
    signal = 'SELL';
    confidence = currentPrice < latestSMA50 && currentPrice < latestSMA200 ? 'HIGH' : 'MEDIUM';
  } else {
    // No crossover — determine overall trend
    if (latestSMA50 > latestSMA200) {
      confidence = 'LOW'; // bullish but not a fresh crossover
    } else {
      confidence = 'LOW';
    }
  }

  const result = {
    symbol,
    timestamp: new Date().toISOString(),
    signal,
    currentPrice: parseFloat(currentPrice.toFixed(2)),
    sma50: latestSMA50,
    sma200: latestSMA200,
    crossoverType: crossover.type,
    confidence,
  };

  logger.info(`Signal for ${symbol}: ${signal} (${crossover.type}, confidence: ${confidence})`);
  return result;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Scans multiple symbols and generates signals for each.
 *
 * @param {string[]} symbols - Array of stock symbols.
 * @returns {Promise<object[]>} Array of signal results.
 */
const scanMultipleSymbols = async (symbols) => {
  logger.info(`Scanning ${symbols.length} symbols for signals`);
  const results = [];

  for (const symbol of symbols) {
    try {
      const signal = await generateSignal(symbol);
      results.push({ success: true, data: signal });
    } catch (err) {
      logger.error(`Signal generation failed for ${symbol}: ${err.message}`);
      results.push({ success: false, symbol, error: err.message });
    }
    // Respect Angel One API rate limits (max 3 per sec)
    await sleep(1000);
  }

  return results;
};

module.exports = { generateSignal, scanMultipleSymbols };
