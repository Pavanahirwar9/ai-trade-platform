import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    // Determine the error message
    const message = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Network error';

    // Global error handling via toast
    if (!err.response) {
      toast.error('Network error: Unable to connect to the server.');
    } else {
      const status = err.response.status;
      if (status >= 500) {
        toast.error(`Server Error: ${message}`);
      } else if (status === 404) {
        toast.error(`Not found: ${message}`);
      } else if (status === 400) {
        toast.error(`Bad Request: ${message}`);
      } else {
        toast.error(`Error: ${message}`);
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
