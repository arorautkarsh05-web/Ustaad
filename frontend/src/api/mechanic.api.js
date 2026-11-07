import api from './client';

export const mechanicApi = {
  getProfile: () => api.get('/mechanics/profile'),
  createProfile: (data) => api.post('/mechanics/profile', data),
  updateProfile: (data) => api.put('/mechanics/profile', data),
  getDashboard: () => api.get('/mechanics/dashboard'),
  getActivities: (params) => api.get('/mechanics/activities', { params }),
  getCredits: () => api.get('/mechanics/credits'),
};

