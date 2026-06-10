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
};

// Queue APIs
export const queueAPI = {
  create: (orgId: string, data: { name: string; description?: string }) =>
    api.post(`/organizations/${orgId}/queues`, data),
  list: (orgId: string) => api.get(`/organizations/${orgId}/queues`),
  get: (id: string) => api.get(`/queues/${id}`),
  update: (id: string, data: any) => api.patch(`/queues/${id}`, data),
  getStats: (id: string) => api.get(`/queues/${id}/stats`),
  getOperatorView: (id: string) => api.get(`/queues/${id}/operator-view`),
};

// Token APIs
export const tokenAPI = {
  create: (queueId: string, data: { phone?: string; email?: string; service_day?: 'today' | 'tomorrow' }) =>
    api.post(`/queues/${queueId}/tokens`, data),
  list: (queueId: string) => api.get(`/queues/${queueId}/tokens`),
  get: (id: string) => {
    const secret = localStorage.getItem(`token_secret_${id}`);
    return api.get(`/tokens/${id}`, {
      headers: secret ? { 'X-Token-Secret': secret } : {}
    });
  },
  updateState: (id: string, state: string) =>
    api.patch(`/tokens/${id}`, { state }),
};

// Counter APIs
export const counterAPI = {
  create: (queueId: string, data: any) =>
    api.post(`/queues/${queueId}/counters`, data),
  list: (queueId: string) => api.get(`/queues/${queueId}/counters`),
  update: (id: string, data: any) => api.patch(`/counters/${id}`, data),
};

// ML APIs
export const mlAPI = {
  train: () => api.post('/ml/train'),
  getModelInfo: () => api.get('/ml/model-info'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
