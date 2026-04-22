import api from './axios';

export const listManualStrategies = () => api.get('/manual-strategy');
export const createManualStrategy = (payload) => api.post('/manual-strategy', payload);
export const cancelManualStrategy = (id) => api.post(`/manual-strategy/${id}/cancel`);
export const stopManualStrategy = (id) => api.post(`/manual-strategy/${id}/stop`);
