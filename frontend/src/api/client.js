import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ustaad_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors uniformly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if session expired / unauthorized
    if (error.response && error.response.status === 401) {
      const isPublicPath = window.location.pathname.startsWith('/passport') || window.location.pathname === '/' || window.location.pathname === '/login';
      const isAuthEndpoint = error.config.url.includes('/auth/') || error.config.url.includes('/verify-customer');
      if (!isAuthEndpoint && !isPublicPath) {
        localStorage.removeItem('ustaad_token');
        localStorage.removeItem('ustaad_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

