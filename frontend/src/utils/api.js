import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export const companyApi = {
  get: () => api.get('/company'),
  create: (data) => api.post('/company', data),
  update: (id, data) => api.put(`/company/${id}`, data),
  delete: (id) => api.delete(`/company/${id}`),
};

export const servicesApi = {
  getByCompany: (companyId) => api.get('/services', { params: { company_id: companyId } }),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
};

export const caseStudiesApi = {
  getByCompany: (companyId) => api.get('/case-studies', { params: { company_id: companyId } }),
  create: (data) => api.post('/case-studies', data),
  update: (id, data) => api.put(`/case-studies/${id}`, data),
  delete: (id) => api.delete(`/case-studies/${id}`),
};

export const pricingApi = {
  getByCompany: (companyId) => api.get('/pricing', { params: { company_id: companyId } }),
  create: (data) => api.post('/pricing', data),
  update: (id, data) => api.put(`/pricing/${id}`, data),
  delete: (id) => api.delete(`/pricing/${id}`),
};

export const industriesApi = {
  getByCompany: (companyId) => api.get('/industries', { params: { company_id: companyId } }),
  create: (data) => api.post('/industries', data),
  update: (id, data) => api.put(`/industries/${id}`, data),
  delete: (id) => api.delete(`/industries/${id}`),
};

export const generateApi = {
  start: (data) => api.post('/generate', data),
  getStatus: (batchId) => api.get(`/generate/status/${batchId}`),
};

export const emailsApi = {
  getByBatch: (batchId, params) => api.get(`/emails/${batchId}`, { params }),
  getDetail: (id) => api.get(`/emails/detail/${id}`),
  update: (id, data) => api.put(`/emails/${id}`, data),
  delete: (id) => api.delete(`/emails/${id}`),
  getCsvUrl: (batchId) => `${API_BASE}/emails/${batchId}/csv`,
  sendEmail: (id) => api.post(`/emails/send/${id}`),
  sendBatchEmails: (ids) => api.post('/emails/send-batch', { ids }),
};

export default api;
