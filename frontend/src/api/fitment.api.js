import api from './client';

export const fitmentApi = {
  createFitment: (data) => api.post('/fitments', data),
  getMyFitments: (params) => api.get('/fitments/my', { params }),
  getFitment: (passportId) => api.get(`/fitments/${passportId}`),
  verifyCustomerOtp: (data) => api.post('/fitments/verify-customer', data),
  resendCustomerOtp: (passportId) => api.post(`/fitments/${passportId}/resend-otp`),
  uploadEvidence: (passportId, formData) =>
    api.post(`/fitments/${passportId}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

