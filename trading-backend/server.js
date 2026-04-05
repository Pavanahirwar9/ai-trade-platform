/**
 * @module server
 * @description HTTP server entry point. Starts Express, loads data, and
 * initializes the market-scan cron job.
 */

const app = require('./src/app');
const config = require('./src/config/config');
const { logger } = require('./src/middleware/logger');
const { loadPortfolio } = require('./src/models/portfolio');
const { loadTrades } = require('./src/models/trade');
const { startMarketScanJob } = require('./src/jobs/marketScan');

// ── Load persisted data ──────────────────────────────────────────────────────
loadPortfolio();
loadTrades();

// ── Start cron job ───────────────────────────────────────────────────────────
startMarketScanJob();

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════╗
║               TRADING BOT SERVER STARTED                     ║
╠══════════════════════════════════════════════════════════════╣
║  Port:            ${String(PORT).padEnd(40)}║
║  Environment:     ${(process.env.NODE_ENV || 'development').padEnd(40)}║
║  Market Open:     ${String(config.isMarketOpen()).padEnd(40)}║
║  Auto-Execute:    ${String(config.autoExecuteSignals).padEnd(40)}║
║  Watchlist:       ${config.watchlist.join(', ').substring(0, 40).padEnd(40)}║
║  Strategy:        SMA ${config.smaShortPeriod} / ${config.smaLongPeriod} Crossover${' '.repeat(22)}║
╚══════════════════════════════════════════════════════════════╝
  `);

  logger.info(`API Endpoints:`);
  logger.info(`  Health:     GET  http://localhost:${PORT}/api/health`);
  logger.info(`  Quote:      GET  http://localhost:${PORT}/api/market/quote/:symbol`);
  logger.info(`  History:    GET  http://localhost:${PORT}/api/market/history/:symbol`);
  logger.info(`  Quotes:     GET  http://localhost:${PORT}/api/market/quotes?symbols=x,y`);
  logger.info(`  Signal:     GET  http://localhost:${PORT}/api/signals/:symbol`);
  logger.info(`  Scan:       POST http://localhost:${PORT}/api/signals/scan`);
  logger.info(`  Execute:    POST http://localhost:${PORT}/api/trades/execute`);
  logger.info(`  TradeHist:  GET  http://localhost:${PORT}/api/trades/history`);
  logger.info(`  Portfolio:  GET  http://localhost:${PORT}/api/portfolio`);
  logger.info(`  P&L:        GET  http://localhost:${PORT}/api/portfolio/pnl`);
});
