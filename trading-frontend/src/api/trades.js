import api from './axios';

export const executeTrade = (symbol, signal, quantity) =>
  api.post('/trades/execute', { symbol, signal, quantity });
export const getTradeHistory = () => api.get('/trades/history');
export const getTradesBySymbol = (symbol) => api.get(`/trades/history/${symbol}`);
