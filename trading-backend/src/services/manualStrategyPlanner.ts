const fs = require('fs');
const config = require('../config/config');
const { logger } = require('../middleware/logger');
const { startAiTrade, stopAiTrade } = require('./aiTradeOrchestrator');

let manualStrategies = [];
const timers = new Map();

const ensureDataDir = () => {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
};

const saveManualStrategies = () => {
  ensureDataDir();
  fs.writeFileSync(config.manualStrategiesFile, JSON.stringify(manualStrategies, null, 2), 'utf-8');
};

const loadManualStrategies = () => {
  ensureDataDir();
  if (fs.existsSync(config.manualStrategiesFile)) {
    const raw = fs.readFileSync(config.manualStrategiesFile, 'utf-8');
    manualStrategies = JSON.parse(raw || '[]');
  } else {
    manualStrategies = [];
    saveManualStrategies();
  }
  return manualStrategies;
};

const getStrategies = () => manualStrategies.slice();

const getIstNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: config.market.timezone }));

const getNextTradingStart = () => {
  const next = getIstNow();
  next.setDate(next.getDate() + 1);
  next.setHours(config.market.openHour, config.market.openMinute, 0, 0);

  while (!config.market.tradingDays.includes(next.getDay())) {
    next.setDate(next.getDate() + 1);
  }

  return next;
};

const buildStrategyPayload = (strategy) => ({
  symbol: strategy.symbol,
  strategyType: 'MANUAL_NEXT_DAY',
  source: 'manual',
  timeframe: 'Next Day',
  quantity: strategy.quantity,
  rules: {
    entry: { whenPriceAtOrBelow: strategy.entry },
    stopLoss: strategy.stopLoss,
    takeProfit: strategy.takeProfit,
    forceCloseTimeIST: '15:15',
  },
  rationale: strategy.rationale || 'Manual strategy rules scheduled for next trading day.',
  generatedAt: new Date().toISOString(),
});

const updateStrategy = (id, patch) => {
  const idx = manualStrategies.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  manualStrategies[idx] = {
    ...manualStrategies[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  saveManualStrategies();
  return manualStrategies[idx];
};

const runStrategyNow = async (id) => {
  const strategy = manualStrategies.find((s) => s.id === id);
  if (!strategy || strategy.status !== 'SCHEDULED') return;

  timers.delete(id);
  updateStrategy(id, { status: 'RUNNING', startedAt: new Date().toISOString() });

  try {
    const session = await startAiTrade({
      symbol: strategy.symbol,
      quantity: strategy.quantity,
      strategy: buildStrategyPayload(strategy),
    });

    updateStrategy(id, {
      status: 'RUNNING',
      sessionId: session.id,
      startedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error(`Manual strategy start failed: ${err.message}`);
    updateStrategy(id, { status: 'FAILED', error: err.message });
  }
};

const scheduleStrategy = (strategy) => {
  const startAt = new Date(strategy.startAt);
  const delay = startAt.getTime() - Date.now();

  if (delay <= 0) {
    runStrategyNow(strategy.id);
    return;
  }

  const timer = setTimeout(() => {
    runStrategyNow(strategy.id);
  }, delay);

  timers.set(strategy.id, timer);
};

const createManualStrategy = ({ symbol, quantity, entry, stopLoss, takeProfit, rationale }) => {
  const startAt = getNextTradingStart().toISOString();
  const strategy = {
    id: `manual-${Date.now()}`,
    symbol,
    quantity,
    entry,
    stopLoss,
    takeProfit,
    rationale,
    startAt,
    status: 'SCHEDULED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  manualStrategies.push(strategy);
  saveManualStrategies();
  scheduleStrategy(strategy);
  return strategy;
};

const cancelManualStrategy = (id) => {
  const strategy = manualStrategies.find((s) => s.id === id);
  if (!strategy) return null;
  if (strategy.status !== 'SCHEDULED') return strategy;

  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }

  return updateStrategy(id, { status: 'CANCELLED', cancelledAt: new Date().toISOString() });
};

const stopManualStrategy = async (id) => {
  const strategy = manualStrategies.find((s) => s.id === id);
  if (!strategy) return null;

  if (strategy.sessionId) {
    await stopAiTrade({
      sessionId: strategy.sessionId,
      reason: 'Manual strategy stop',
      squareOff: true,
    });
  }

  return updateStrategy(id, { status: 'STOPPED', stoppedAt: new Date().toISOString() });
};

const initManualStrategyPlanner = () => {
  loadManualStrategies();
  manualStrategies
    .filter((s) => s.status === 'SCHEDULED')
    .forEach((s) => scheduleStrategy(s));
};

module.exports = {
  initManualStrategyPlanner,
  createManualStrategy,
  cancelManualStrategy,
  stopManualStrategy,
  getStrategies,
};
