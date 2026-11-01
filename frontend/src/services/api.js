import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ids_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized and not on login page, redirect to login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('ids_token');
        localStorage.removeItem('ids_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const datasetsAPI = {
  list: () => api.get('/datasets/'),
  get: (id) => api.get(`/datasets/${id}`),
  upload: (formData) => api.post('/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/datasets/${id}`),
};

export const preprocessingAPI = {
  list: () => api.get('/preprocessing/'),
  get: (id) => api.get(`/preprocessing/${id}`),
  run: (config) => api.post('/preprocessing/run', config),
};

export const trainingAPI = {
  train: (payload) => api.post('/training/train', payload),
  getStatus: (modelId) => api.get(`/training/status/${modelId}`),
};

export const modelsAPI = {
  list: () => api.get('/models/'),
  get: (id) => api.get(`/models/${id}`),
  getEvaluation: (id) => api.get(`/models/${id}/evaluation`),
  getComparison: () => api.get('/models/comparison'),
  delete: (id) => api.delete(`/models/${id}`),
};

export const detectionAPI = {
  listJobs: () => api.get('/detection/jobs'),
  getJob: (id, params) => api.get(`/detection/jobs/${id}`, { params }),
  run: (formData) => api.post('/detection/run', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const monitoringAPI = {
  getInterfaces: () => api.get('/monitoring/interfaces'),
  start: (payload) => api.post('/monitoring/start', payload),
  stop: () => api.post('/monitoring/stop'),
  getLive: () => api.get('/monitoring/live'),
  getSessions: () => api.get('/monitoring/sessions'),
};

export const alertsAPI = {
  list: (params) => api.get('/alerts/', { params }),
  updateStatus: (id, status) => api.put(`/alerts/${id}/status`, { status }),
  delete: (id) => api.delete(`/alerts/${id}`),
};

export const reportsAPI = {
  list: () => api.get('/reports/'),
  generate: (payload) => api.post('/reports/generate', payload),
};

export const settingsAPI = {
  get: () => api.get('/settings/'),
  update: (payload) => api.post('/settings/', payload),
};

export default api;

