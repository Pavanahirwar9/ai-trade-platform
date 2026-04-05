/**
 * @module config
 * @description Central configuration module. Loads environment variables
 * and exports market constants, strategy parameters, and app settings.
 */

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  /** Server port */
  port: parseInt(process.env.PORT, 10) || 3000,

  /** Initial virtual capital in INR (paise precision) */
  initialCapital: parseFloat(process.env.INITIAL_VIRTUAL_CAPITAL) || 1000000,

  /** Whether the cron job should auto-execute BUY/SELL signals */
  autoExecuteSignals: process.env.AUTO_EXECUTE_SIGNALS === 'true',

  /** Default watchlist of NSE symbols */
  watchlist: process.env.WATCHLIST
    ? process.env.WATCHLIST.split(',').map((s) => s.trim())
    : ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS'],

  /** SMA strategy periods */
  smaShortPeriod: parseInt(process.env.SMA_SHORT_PERIOD, 10) || 50,
  smaLongPeriod: parseInt(process.env.SMA_LONG_PERIOD, 10) || 200,

  /** Logging level */
  logLevel: process.env.LOG_LEVEL || 'info',

  /** Data file paths */
  dataDir: path.resolve(__dirname, '../../data'),
  portfolioFile: path.resolve(__dirname, '../../data/portfolio.json'),
  tradesFile: path.resolve(__dirname, '../../data/trades.json'),

  /** NSE Market hours (IST) */
  market: {
    timezone: 'Asia/Kolkata',
    openHour: 9,
    openMinute: 15,
    closeHour: 15,
    closeMinute: 30,
    /** Working days: 1 = Monday ... 5 = Friday */
    tradingDays: [1, 2, 3, 4, 5],
  },

  /** Fee structure */
  fees: {
    /** Brokerage fee percentage (0.1%) */
    brokerage: 0.001,
    /** Securities Transaction Tax percentage on sell (0.1%) */
    stt: 0.001,
  },

  /** Yahoo Finance historical data period (months) */
  historicalPeriodMonths: 14, // 14 months to ensure enough data for SMA 200

  /** Quote cache TTL in milliseconds (60 seconds) */
  quoteCacheTTL: 60 * 1000,
};

/**
 * Checks whether the NSE market is currently open.
 * @returns {boolean} True if current IST time is within trading hours on a trading day.
 */
config.isMarketOpen = () => {
  const now = new Date();
  const istString = now.toLocaleString('en-US', { timeZone: config.market.timezone });
  const istDate = new Date(istString);

  const day = istDate.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  if (!config.market.tradingDays.includes(day)) return false;

  const currentMinutes = istDate.getHours() * 60 + istDate.getMinutes();
  const openMinutes = config.market.openHour * 60 + config.market.openMinute;
  const closeMinutes = config.market.closeHour * 60 + config.market.closeMinute;

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
};

module.exports = config;
