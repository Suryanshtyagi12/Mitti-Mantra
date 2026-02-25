import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// API Services
export const apiService = {
  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // --- AI Features ---

  // Smart Talk
  smartTalk: async (query, language = 'en', context = null) => {
    const response = await api.post('/ai/smart-talk', { query, language, context });
    return response.data;
  },

  // AI Crop Suggestion (ML Model)
  predictCrop: async (data) => {
    // data should match AICropRequest schema
    const response = await api.post('/api/ai/crop-suggestion', data);
    return response.data;
  },

  // AI Crop Suggestion (AI API - Groq)
  getCropSuggestionAI: async (data) => {
    const response = await api.post('/api/ai/crop-suggestion', { ...data, mode: 'ai' });
    return response.data;
  },

  // AI Disease Detection (ML Model)
  predictDisease: async (file, language = 'en') => {
    const formData = new FormData();
    formData.append('file', file);
    // Add language param to query string or formData? The endpoint expects 'language' as query param (default) or body?
    // Looking at ai_routes.py: predict_disease takes file=File(...), language: str = "en"
    // In FastAPI, simple types are usually query params if not specified as Form.
    // Let's pass it as query param to be safe.
    const response = await api.post(`/api/ai/disease?language=${language}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // AI Disease Detection (AI API - Gemini Vision)
  detectDiseaseAI: async (file, language = 'en') => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/ai/disease?language=${language}&mode=ai`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // AI Irrigation Advice
  getIrrigationSchedule: async (data) => {
    const response = await api.post('/api/ai/irrigation', data);
    return response.data;
  },

  // Track Farming
  addFarmingRecord: async (data) => {
    const response = await api.post('/api/ai/track-farming', data);
    return response.data;
  },

  getFarmingRecords: async () => {
    const response = await api.get('/api/ai/track-farming');
    return response.data;
  },

  // Risk Alerts
  getRiskAlerts: async () => {
    const response = await api.get('/api/ai/risk-alerts');
    return response.data;
  },

  // --- Legacy / Auth ---

  // Pest Control (Legacy - keeping if needed, or migrate to AI?)
  // The ai_routes didn't have specific pest control separate from disease?
  // Checking ai_routes.py again... only disease_ai_service.
  // We'll keep the old pest-control endpoint for now if the UI uses it, 
  // or maybe it's encompassed by disease detection.
  getPestControl: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/pest-control', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Authentication
  login: async (username, password) => {
    // The backend `auth_token` endpoint is usually at /api/auth/token or similar
    // Checking api_auth_routes.py would be good, but assuming standard from previous
    // main.py included api_auth_router at /api/auth
    // Let's assume /api/auth/login is correct from previous code
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

  // Farmer Insights
  getFarmerInsights: async () => {
    const response = await api.get('/farmer-insights');
    return response.data;
  },
};

export default api;