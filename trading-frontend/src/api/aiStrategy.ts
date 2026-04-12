import api from './axios';

export const analyzeAiStrategy = (symbol, quantity = 1) =>
  api.post('/ai-strategy/analyze', { symbol, quantity });

export const startAiTradeSession = ({ symbol, quantity, strategy }) =>
  api.post('/ai-strategy/start', { symbol, quantity, strategy });

export const stopAiTradeSession = (sessionId) =>
  api.post('/ai-strategy/stop', { sessionId });

export const getAiTradeSessions = () => api.get('/ai-strategy/sessions');
