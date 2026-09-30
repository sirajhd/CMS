import axios from 'axios';

export const simulateNetworkDelay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const rawSession = localStorage.getItem('cms_session_user');
    if (rawSession) {
      try {
        const session = JSON.parse(rawSession);
        if (session.token) {
          config.headers.Authorization = `Bearer ${session.token}`;
        }
      } catch (e) {
        console.error('Error parsing session token in api interceptor:', e);
      }
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('cms_session_user');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } catch (e) {
        console.error('Failed to clear session on 401:', e);
      }
    }
    const message = error.response?.data?.message || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
