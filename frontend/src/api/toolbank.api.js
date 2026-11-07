import api from './client';

export const toolbankApi = {
  getItems: (params) => api.get('/toolbank/items', { params }),
  getItem: (id) => api.get(`/toolbank/items/${id}`),
  createReservation: (data) => api.post('/toolbank/reservations', data),
  getMyReservations: () => api.get('/toolbank/reservations/my'),
  cancelReservation: (id) => api.patch(`/toolbank/reservations/${id}/cancel`),
  getDealerReservations: (params) => api.get('/toolbank/reservations/dealer', { params }),
  updateReservationStatus: (id, data) => api.patch(`/toolbank/reservations/${id}/status`, data),
};

