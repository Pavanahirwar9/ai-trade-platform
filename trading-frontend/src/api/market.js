import api from './axios';

export const searchInstruments = (query) => api.get(`/market/search?q=${query}`);
export const getQuote = (symbol) => api.get(`/market/quote/${symbol}`);
export const getHistory = (symbol, period) =>
  api.get(`/market/history/${symbol}${period ? `?period=${period}` : ''}`);
export const getMultipleQuotes = (symbols) =>
  api.get(`/market/quotes?symbols=${symbols.join(',')}`);
export const getHealth = () => api.get('/health');

// Watchlist API
export const getWatchlist = () => api.get('/market/watchlist');
export const addWatchlistSymbol = (symbol) => api.post('/market/watchlist', { symbol });
export const removeWatchlistSymbol = (symbol) => api.delete(`/market/watchlist/${symbol}`);
