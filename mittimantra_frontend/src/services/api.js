import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach JWT from localStorage ──────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ─────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we're not already on auth pages
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('mm_token');
        localStorage.removeItem('mm_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── API Service ────────────────────────────────────────────────────────────
export const apiService = {
  // Health
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // ── Authentication ────────────────────────────────────────────────────

  login: async (username, password) => {
    const response = await api.post('/api/auth/login', { username, password });
    return response.data;
  },

  register: async (email, username, password, full_name = null) => {
    const response = await api.post('/api/auth/register', {
      email,
      username,
      password,
      full_name,
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  // ── AI Features ───────────────────────────────────────────────────────

  smartTalk: async (query, language = 'en', context = null) => {
    const response = await api.post('/ai/smart-talk', { query, language, context });
    return response.data;
  },

  predictCrop: async (data) => {
    const response = await api.post('/predict-crop', data);
    return response.data;
  },

  getCropSuggestionAI: async (data) => {
    const response = await api.post('/api/ai/crop-suggestion', { ...data, mode: 'ai' });
    return response.data;
  },

  predictDisease: async (file, language = 'en') => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/ai/disease?language=${language}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  detectDiseaseAI: async (file, language = 'en') => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/ai/disease?language=${language}&mode=ai`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getIrrigationSchedule: async (data) => {
    const response = await api.post('/api/ai/irrigation', data);
    return response.data;
  },

  addFarmingRecord: async (data) => {
    const response = await api.post('/api/ai/track-farming', data);
    return response.data;
  },

  getFarmingRecords: async () => {
    const response = await api.get('/api/ai/track-farming');
    return response.data;
  },

  getRiskAlerts: async () => {
    const response = await api.get('/api/ai/risk-alerts');
    return response.data;
  },

  getPestControl: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/pest-control', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getFarmerInsights: async () => {
    const response = await api.get('/farmer-insights');
    return response.data;
  },
};

export default api;