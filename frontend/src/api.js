import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Crear cliente Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (email, password, username) =>
    api.post('/api/auth/register', { email, password, username }),
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),
  getMe: () => api.get('/api/auth/me'),
  forgotPassword: (email) =>
    api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, password) =>
    api.post('/api/auth/reset-password', { token, password }),
};

// Lists APIs
export const listsAPI = {
  getAll: () => api.get('/api/lists'),
  create: (name) => api.post('/api/lists', { name }),
  get: (id) => api.get(`/api/lists/${id}`),
  delete: (id) => api.delete(`/api/lists/${id}`),
};

// Items APIs
export const itemsAPI = {
  getAll: (listId) => api.get(`/api/lists/${listId}/items`),
  add: (listId, articulo, cantidad, categoria, agregado_por) =>
    api.post(`/api/lists/${listId}/items`, {
      articulo,
      cantidad,
      categoria,
      agregado_por,
    }),
  update: (listId, itemId, data) =>
    api.put(`/api/lists/${listId}/items/${itemId}`, data),
  delete: (listId, itemId) =>
    api.delete(`/api/lists/${listId}/items/${itemId}`),
  reset: (listId) => api.post(`/api/lists/${listId}/reset`),
  getCatalog: (listId) => api.get(`/api/lists/${listId}/catalog`),
};

// History API
export const historyAPI = {
  get: (period = 'all') => api.get(`/api/history?period=${period}`),
};

// Catalog API
export const catalogAPI = {
  getAll: () => api.get('/api/catalog'),
  update: (id, data) => api.put(`/api/catalog/${id}`, data),
  delete: (id) => api.delete(`/api/catalog/${id}`),
};

export default api;
