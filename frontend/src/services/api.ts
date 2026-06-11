import axios, { AxiosInstance } from 'axios';

const API_BASE = '/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Organization APIs
export const organizationAPI = {
  create: (name: string) => api.post('/organizations', { name }),
  get: (id: string) => api.get(`/organizations/${id}`),
  listAll: () => api.get('/organizations'),
  getImpact: (id: string) => api.get(`/organizations/${id}/impact`),
};

// Queue APIs
export const queueAPI = {
  create: (orgId: string, data: { name: string; description?: string }) =>
    api.post(`/organizations/${orgId}/queues`, data),
  list: (orgId: string) => api.get(`/organizations/${orgId}/queues`),
  get: (id: string) => api.get(`/queues/${id}`),
  update: (id: string, data: any) => api.patch(`/queues/${id}`, data),
  getStats: (id: string, service_day?: string) => api.get(`/queues/${id}/stats${service_day ? `?service_day=${service_day}` : ''}`),
  getOperatorView: (id: string, service_day?: string) => api.get(`/queues/${id}/operator-view${service_day ? `?service_day=${service_day}` : ''}`),
  predict: (id: string) => api.get(`/queues/${id}/predict`),
};

// Token APIs
export const tokenAPI = {
  create: (queueId: string, data: { phone?: string; email?: string; service_day?: 'today' | 'tomorrow' }) =>
    api.post(`/queues/${queueId}/tokens`, data),
  list: (queueId: string, service_day?: string) => api.get(`/queues/${queueId}/tokens${service_day ? `?service_day=${service_day}` : ''}`),
  get: (id: string) => {
    const secret = localStorage.getItem(`token_secret_${id}`);
    return api.get(`/tokens/${id}`, {
      headers: secret ? { 'X-Token-Secret': secret } : {}
    });
  },
  updateState: (id: string, state: string) =>
    api.patch(`/tokens/${id}`, { state }),
  confirm: (id: string) => api.post(`/tokens/${id}/confirm`),
};

// Counter APIs
export const counterAPI = {
  create: (queueId: string, data: any) =>
    api.post(`/queues/${queueId}/counters`, data),
  list: (queueId: string) => api.get(`/queues/${queueId}/counters`),
  update: (id: string, data: any) => api.patch(`/counters/${id}`, data),
};

// Admin APIs
export const adminAPI = {
  getCredentials: () => api.get('/admin/credentials'),
  changePassword: (current_pin: string, new_pin: string) =>
    api.post('/admin/change-password', { current_pin, new_pin }),
};

// ML APIs
export const mlAPI = {
  train: () => api.post('/ml/train'),
  getModelInfo: () => api.get('/ml/model-info'),
  seedData: () => api.post('/ml/seed-data'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
