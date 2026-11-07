import api from './client';

export const adminApi = {
  getDashboardOverview: () => api.get('/admin/dashboard'),
  getMechanics: (params) => api.get('/admin/mechanics', { params }),
  getMechanic: (id) => api.get(`/admin/mechanics/${id}`),
  verifyMechanic: (id, verification_status) => api.patch(`/admin/mechanics/${id}/verify`, { verification_status }),
  adjustCredits: (id, data) => api.post(`/admin/mechanics/${id}/credits`, data),
  getFitments: (params) => api.get('/admin/fitments', { params }),
  verifyFitment: (id, verification_status) => api.patch(`/admin/fitments/${id}/verify`, { verification_status }),
  createCourse: (data) => api.post('/admin/courses', data),
  updateCourse: (id, data) => api.put(`/admin/courses/${id}`, data),
  addCourseQuestion: (id, data) => api.post(`/admin/courses/${id}/questions`, data),
  getRegistrationTrends: () => api.get('/admin/analytics/registration-trends'),
  getFitmentTrends: () => api.get('/admin/analytics/fitment-trends'),
  getStateWiseStats: () => api.get('/admin/analytics/state-wise'),
  exportMechanics: () => api.get('/admin/export/mechanics', { responseType: 'blob' }),
  exportFitments: () => api.get('/admin/export/fitments', { responseType: 'blob' }),
  createToolbankItem: (data) => api.post('/admin/toolbank/items', data),
  updateToolbankItem: (id, data) => api.put(`/admin/toolbank/items/${id}`, data),
  sendNotification: (data) => api.post('/admin/notifications', data),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),
};

