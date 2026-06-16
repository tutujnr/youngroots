/**
 * YoungRoots — API Client
 * Centralised Axios instance with auth, error handling, and anonymous token support.
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT or anonymous token ────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  const anonToken = localStorage.getItem('anon_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (anonToken) {
    config.headers['X-Anonymous-Token'] = anonToken;
  }
  return config;
});

// ── Response interceptor: handle token refresh ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── API Methods ───────────────────────────────────────────────────────────────

export const authAPI = {
  login:           (data) => api.post('/auth/login/', data),
  register:        (data) => api.post('/auth/register/', data),
  getAnonymousToken: ()   => api.post('/auth/anonymous/'),
  getProfile:      ()     => api.get('/auth/profile/'),
  updateProfile:   (data) => api.patch('/auth/profile/', data),
};

export const servicesAPI = {
  list:   (params) => api.get('/services/', { params }),
  detail: (id)     => api.get(`/services/${id}/`),
  review: (id, data) => api.post(`/services/${id}/review/`, data),
  search: (lat, lng, radius, filters) =>
    api.get('/services/', { params: { lat, lng, radius, ...filters } }),
};

export const aiAPI = {
  chat:      (data) => api.post('/ai/chat/', data),
  recommend: (data) => api.post('/ai/recommend/', data),
};

export const reportsAPI = {
  submit:    (data)    => api.post('/reports/submit/', data),
  lookup:    (caseId)  => api.get(`/reports/lookup/${caseId}/`),
  adminList: (params)  => api.get('/reports/admin/', { params }),
  update:    (id, data)=> api.patch(`/reports/admin/${id}/`, data),
  addNote:   (id, data)=> api.post(`/reports/admin/${id}/notes/`, data),
};

export const referralsAPI = {
  getCaseDetail:  (caseId)  => api.get(`/referrals/case/${caseId}/`),
  createReferral: (caseId, data) => api.post(`/referrals/case/${caseId}/referral/`, data),
  updateStep:     (stepId, data) => api.patch(`/referrals/steps/${stepId}/`, data),
};

export const dashboardAPI = {
  getMetrics: (refresh) => api.get('/dashboard/metrics/', { params: { refresh } }),
  getSummary: ()        => api.get('/dashboard/summary/'),
};

export const adminAPI = {
  users:  {
    list:   (params)   => api.get('/auth/users/', { params }),
    update: (id, data) => api.patch(`/auth/users/${id}/`, data),
    delete: (id)       => api.delete(`/auth/users/${id}/`),
  },
  services: {
    create: (data)     => api.post('/services/', data),
    update: (id, data) => api.patch(`/services/${id}/`, data),
    verify: (id)       => api.post(`/services/${id}/verify/`),
    delete: (id)       => api.delete(`/services/${id}/`),
  },
};

export default api;
