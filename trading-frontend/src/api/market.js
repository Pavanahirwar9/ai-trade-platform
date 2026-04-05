import api from './axios';

export const getQuote = (symbol) => api.get(`/market/quote/${symbol}`);
export const getHistory = (symbol, period) =>
  api.get(`/market/history/${symbol}${period ? `?period=${period}` : ''}`);
export const getMultipleQuotes = (symbols) =>
  api.get(`/market/quotes?symbols=${symbols.join(',')}`);
export const getHealth = () => api.get('/health');
