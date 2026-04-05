import api from './axios';

export const getPortfolio = () => api.get('/portfolio');
export const getPortfolioPnL = () => api.get('/portfolio/pnl');
