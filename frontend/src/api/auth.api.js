import api from './client';

export const authApi = {
  sendOtp: (data) => api.post('/auth/send-otp', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

