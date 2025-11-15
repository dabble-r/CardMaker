import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  register: (email: string, password: string) =>
    apiClient.post('/auth/register', { email, password }),
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
};

// Templates API
export const templatesAPI = {
  getAll: (includeDefaults: boolean = true) =>
    apiClient.get(`/templates?includeDefaults=${includeDefaults}`),
  getById: (id: string) => apiClient.get(`/templates/${id}`),
  create: (data: any) => apiClient.post('/templates', data),
  update: (id: string, data: any) => apiClient.put(`/templates/${id}`, data),
  delete: (id: string) => apiClient.delete(`/templates/${id}`),
};

// Cards API
export const cardsAPI = {
  getAll: () => apiClient.get('/cards'),
  getById: (id: string) => apiClient.get(`/cards/${id}`),
  create: (data: any) => apiClient.post('/cards', data),
  update: (id: string, data: any) => apiClient.put(`/cards/${id}`, data),
  delete: (id: string) => apiClient.delete(`/cards/${id}`),
  duplicate: (id: string) => apiClient.post(`/cards/${id}/duplicate`),
};

// Assets API
export const assetsAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/assets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Export API
export const exportAPI = {
  exportCard: (cardId: string, format: 'png' | 'jpeg' | 'pdf' = 'png') =>
    apiClient.post(`/export/card/${cardId}?format=${format}`, {}, {
      responseType: 'blob', // Expect binary response for file downloads
    }),
};

// Users API
export const usersAPI = {
  getProfile: () => apiClient.get('/users/me'),
  updateProfile: (data: any) => apiClient.put('/users/me', data),
};

