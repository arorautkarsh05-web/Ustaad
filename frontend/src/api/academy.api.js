import api from './client';

export const academyApi = {
  getCourses: (params) => api.get('/academy', { params }),
  getCourse: (id) => api.get(`/academy/${id}`),
  getProgress: () => api.get('/academy/mechanic/progress'),
  enrolCourse: (id) => api.post(`/academy/${id}/enrol`),
  submitAssessment: (id, answers) => api.post(`/academy/${id}/assessment`, { answers }),
};

