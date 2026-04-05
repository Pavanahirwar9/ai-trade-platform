import api from './axios';

export const getSignal = (symbol) => api.get(`/signals/${symbol}`);
export const scanSignals = (symbols) => api.post('/signals/scan', { symbols });
