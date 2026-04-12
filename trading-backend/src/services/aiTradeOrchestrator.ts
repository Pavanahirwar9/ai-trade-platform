const { getLiveQuote } = require('./marketData');
const { executeTrade } = require('./tradeExecutor');
const {
  generateDeepAnalysis,
  generateIntradayStrategy,
  evaluateTickAgainstStrategy,
} = require('./aiEngine');
const { logger } = require('../middleware/logger');

const sessions = new Map();
let io = null;

const TICK_INTERVAL_MS = 15000;

const getIstNow = () => {
  const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return ist;
};

const isForceCloseTime = () => {
  const ist = getIstNow();
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return mins >= 15 * 60 + 15;
};

const emitUpdate = (type, payload) => {
  if (!io) return;
  const cleanPayload = { ...payload };
  if (cleanPayload.intervalId !== undefined) {
    delete cleanPayload.intervalId;
  }
  io.emit('ai_strategy_update', {
    type,
    payload: cleanPayload,
    timestamp: new Date().toISOString(),
  });
};

const setSocketServer = (socketServer) => {
  io = socketServer;
};

const runSessionTick = async (session) => {
  const quote = await getLiveQuote(session.symbol);
  const tickPrice = quote.price;

  session.lastPrice = tickPrice;
  session.lastTickAt = new Date().toISOString();

  emitUpdate('tick', {
    sessionId: session.id,
    symbol: session.symbol,
    tickPrice,
    hasOpenPosition: session.hasOpenPosition,
  });

  if (isForceCloseTime()) {
    if (session.hasOpenPosition) {
      const sell = await executeTrade(session.symbol, 'SELL', session.quantity);
      session.tradeLog.push({
        type: 'SELL',
        reason: 'Force close at 3:15 PM IST',
        price: tickPrice,
        tradeId: sell?.trade?.id,
        timestamp: new Date().toISOString(),
      });
      session.hasOpenPosition = false;
    }

    session.status = 'STOPPED';
    session.stopReason = 'Auto closed at 3:15 PM IST';
    clearInterval(session.intervalId);
    emitUpdate('session_stopped', session);
    return;
  }

  const evalResult = await evaluateTickAgainstStrategy({
    tickPrice,
    strategy: session.strategy,
    hasOpenPosition: session.hasOpenPosition,
  });

  if (evalResult.action === 'BUY' && !session.hasOpenPosition) {
    const buy = await executeTrade(session.symbol, 'BUY', session.quantity);
    session.hasOpenPosition = true;
    session.tradeLog.push({
      type: 'BUY',
      reason: evalResult.reason,
      price: tickPrice,
      tradeId: buy?.trade?.id,
      timestamp: new Date().toISOString(),
    });
    emitUpdate('trade_executed', {
      sessionId: session.id,
      symbol: session.symbol,
      action: 'BUY',
      price: tickPrice,
      reason: evalResult.reason,
    });
    return;
  }

  if (evalResult.action === 'SELL' && session.hasOpenPosition) {
    const sell = await executeTrade(session.symbol, 'SELL', session.quantity);
    session.hasOpenPosition = false;
    session.tradeLog.push({
      type: 'SELL',
      reason: evalResult.reason,
      price: tickPrice,
      tradeId: sell?.trade?.id,
      timestamp: new Date().toISOString(),
    });
    emitUpdate('trade_executed', {
      sessionId: session.id,
      symbol: session.symbol,
      action: 'SELL',
      price: tickPrice,
      reason: evalResult.reason,
    });
  }
};

const analyzeSymbol = async ({ symbol, quantity = 1 }) => {
  const quote = await getLiveQuote(symbol);
  const analysis = await generateDeepAnalysis({ symbol, quote });
  const strategy = await generateIntradayStrategy({ symbol, quote, analysis, quantity });

  return {
    symbol,
    quote,
    analysis,
    strategy,
  };
};

const startAiTrade = async ({ symbol, quantity = 1, strategy }) => {
  const id = `${symbol}-${Date.now()}`;

  const session = {
    id,
    symbol,
    quantity,
    strategy,
    status: 'RUNNING',
    hasOpenPosition: false,
    lastPrice: null,
    tradeLog: [],
    startedAt: new Date().toISOString(),
    intervalId: null,
    stopReason: null,
  };

  sessions.set(id, session);

  session.intervalId = setInterval(async () => {
    try {
      const s = sessions.get(id);
      if (!s || s.status !== 'RUNNING') return;
      await runSessionTick(s);
    } catch (err) {
      logger.error(`AI trade tick failed for ${symbol}: ${err.message}`);
      emitUpdate('error', {
        sessionId: id,
        symbol,
        error: err.message,
      });
    }
  }, TICK_INTERVAL_MS);

  emitUpdate('session_started', session);
  logger.info(`AI strategy session started: ${id}`);

  // Run first cycle async to avoid blocking the API
  runSessionTick(session).catch(err => {
    logger.error(`Initial tick failed: ${err.message}`);
  });

  return session;
};

const getRunningSession = () =>
  Array.from(sessions.values()).find((s) => s.status === 'RUNNING') || null;

const stopAiTrade = async ({ sessionId, reason = 'Stopped by user', squareOff = true }) => {
  const session = sessionId ? sessions.get(sessionId) : getRunningSession();
  if (!session || session.status !== 'RUNNING') return null;

  clearInterval(session.intervalId);

  if (squareOff && session.hasOpenPosition) {
    try {
      const quote = await getLiveQuote(session.symbol);
      const tickPrice = quote?.price;
      const sell = await executeTrade(session.symbol, 'SELL', session.quantity);
      session.hasOpenPosition = false;
      session.lastPrice = tickPrice ?? session.lastPrice;
      session.tradeLog.push({
        type: 'SELL',
        reason: 'Manual stop square-off',
        price: tickPrice,
        tradeId: sell?.trade?.id,
        timestamp: new Date().toISOString(),
      });

      emitUpdate('trade_executed', {
        sessionId: session.id,
        symbol: session.symbol,
        action: 'SELL',
        price: tickPrice,
        reason: 'Manual stop square-off',
      });
    } catch (e) {
      logger.error(`Square off failed on stop: ${e.message}`);
    }
  }

  session.status = 'STOPPED';
  session.stopReason = reason;
  session.stoppedAt = new Date().toISOString();

  emitUpdate('session_stopped', session);
  logger.info(`AI strategy session stopped: ${session.id}`);

  return session;
};

const getSessions = () => {
  return Array.from(sessions.values()).map((s) => ({
    id: s.id,
    symbol: s.symbol,
    quantity: s.quantity,
    status: s.status,
    hasOpenPosition: s.hasOpenPosition,
    lastPrice: s.lastPrice,
    startedAt: s.startedAt,
    stoppedAt: s.stoppedAt,
    stopReason: s.stopReason,
    strategy: s.strategy,
    tradeLog: s.tradeLog,
  }));
};

module.exports = {
  setSocketServer,
  analyzeSymbol,
  startAiTrade,
  stopAiTrade,
  getSessions,
};
