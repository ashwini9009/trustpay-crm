import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8000' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Reports
export const downloadReport = (format) =>
  API.get(`/api/reports/${format}`, { responseType: 'blob' });

// Auth
export const login = (data) => API.post('/api/auth/login', data);
export const getMe = () => API.get('/api/auth/me');
export const createAdmin = (data) => API.post('/api/auth/create-admin', data);

// Partners
export const getPartners = () => API.get('/api/partners/');
export const getPartner = (id) => API.get(`/api/partners/${id}`);
export const createPartner = (data) => API.post('/api/partners/', data);
export const updatePartner = (id, data) => API.put(`/api/partners/${id}`, data);
export const deletePartner = (id) => API.delete(`/api/partners/${id}`);
export const getMyProfile = () => API.get('/api/partners/me/profile');

// Targets
export const getTargets = () => API.get('/api/targets/');
export const getPartnerTargets = (partnerId) => API.get(`/api/targets/partner/${partnerId}`);
export const getMyTargets = () => API.get('/api/targets/me');
export const createTarget = (data) => API.post('/api/targets/', data);
export const createTargetWithImage = (formData) => API.post('/api/targets/with-image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateTarget = (id, data) => API.put(`/api/targets/${id}`, data);
export const deleteTarget = (id) => API.delete(`/api/targets/${id}`);

// Dashboard
export const getAdminStats = () => API.get('/api/dashboard/admin-stats');
export const getPartnerStats = () => API.get('/api/dashboard/partner-stats');

// Chat
export const sendChat = (message) => API.post('/api/chat/', { message });
export const getChatHistory = () => API.get('/api/chat/history');
export const clearChat = () => API.delete('/api/chat/history');



export default API;

