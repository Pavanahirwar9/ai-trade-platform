/**
 * @module services/indicators
 * @description Technical indicator calculations: SMA, EMA, and crossover detection.
 */

const { logger } = require('../middleware/logger');

/**
 * Calculates Simple Moving Average for a given period.
 *
 * @param {number[]} prices - Array of closing prices (oldest first).
 * @param {number} period - Number of periods for the average.
 * @returns {number[]} Array of SMA values. Length = prices.length - period + 1.
 *   Each value is aligned to the end of its window.
 * @throws {Error} If not enough data points.
 */
const calculateSMA = (prices, period) => {
  if (prices.length < period) {
    throw new Error(`Not enough data points (${prices.length}) for SMA(${period})`);
  }

  const sma = [];
  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += prices[j];
    }
    sma.push(parseFloat((sum / period).toFixed(2)));
  }

  logger.debug(`Calculated SMA(${period}) — ${sma.length} values`);
  return sma;
};

/**
 * Calculates Exponential Moving Average for a given period.
 *
 * @param {number[]} prices - Array of closing prices (oldest first).
 * @param {number} period - Number of periods for the EMA.
 * @returns {number[]} Array of EMA values. Length = prices.length - period + 1.
 * @throws {Error} If not enough data points.
 */
const calculateEMA = (prices, period) => {
  if (prices.length < period) {
    throw new Error(`Not enough data points (${prices.length}) for EMA(${period})`);
  }

  const multiplier = 2 / (period + 1);
  const ema = [];

  // Seed with SMA of first `period` prices
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  ema.push(parseFloat((sum / period).toFixed(2)));

  // Calculate subsequent EMA values
  for (let i = period; i < prices.length; i++) {
    const value = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(parseFloat(value.toFixed(2)));
  }

  logger.debug(`Calculated EMA(${period}) — ${ema.length} values`);
  return ema;
};

/**
 * Detects crossover between a short-period MA and a long-period MA.
 * Looks at the most recent two aligned data points to determine if a crossover occurred.
 *
 * @param {number[]} shortMA - Short-period MA values (e.g. SMA 50).
 * @param {number[]} longMA  - Long-period MA values (e.g. SMA 200).
 * @returns {object} Crossover result.
 *   { type: 'GOLDEN_CROSS' | 'DEATH_CROSS' | 'NONE', index: number, shortValue: number, longValue: number }
 */
const detectCrossover = (shortMA, longMA) => {
  // Align arrays to the same length (from the end)
  const minLen = Math.min(shortMA.length, longMA.length);
  if (minLen < 2) {
    return { type: 'NONE', index: -1, shortValue: null, longValue: null };
  }

  const shortAligned = shortMA.slice(shortMA.length - minLen);
  const longAligned = longMA.slice(longMA.length - minLen);

  const lastIdx = minLen - 1;
  const prevIdx = minLen - 2;

  const currentShort = shortAligned[lastIdx];
  const currentLong = longAligned[lastIdx];
  const prevShort = shortAligned[prevIdx];
  const prevLong = longAligned[prevIdx];

  // Golden cross: short was below long, now above
  if (prevShort <= prevLong && currentShort > currentLong) {
    logger.info('GOLDEN CROSS detected');
    return {
      type: 'GOLDEN_CROSS',
      index: lastIdx,
      shortValue: currentShort,
      longValue: currentLong,
    };
  }

  // Death cross: short was above long, now below
  if (prevShort >= prevLong && currentShort < currentLong) {
    logger.info('DEATH CROSS detected');
    return {
      type: 'DEATH_CROSS',
      index: lastIdx,
      shortValue: currentShort,
      longValue: currentLong,
    };
  }

  return {
    type: 'NONE',
    index: lastIdx,
    shortValue: currentShort,
    longValue: currentLong,
  };
};

module.exports = { calculateSMA, calculateEMA, detectCrossover };
