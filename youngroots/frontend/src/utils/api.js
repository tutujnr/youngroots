import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  const anonToken = localStorage.getItem('anon_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else if (anonToken) config.headers['X-Anonymous-Token'] = anonToken;
  return config;
});

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
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login/', data),
  register: (data) => api.post('/auth/register/', data),
  getAnonymousToken: () => api.post('/auth/anonymous/'),
  getProfile: () => api.get('/auth/profile/'),
};

export const servicesAPI = {
  list: (params) => api.get('/services/', { params }),
  detail: (id) => api.get(`/services/${id}/`),
  review: (id, data) => api.post(`/services/${id}/review/`, data),
};

export const aiAPI = {
  chat: (data) => api.post('/ai/chat/', data),
  recommend: (data) => api.post('/ai/recommend/', data),
};

export const reportsAPI = {
  submit: (data) => api.post('/reports/submit/', data),
  lookup: (caseId) => api.get(`/reports/lookup/${caseId}/`),
  adminList: (params) => api.get('/reports/admin/', { params }),
  update: (id, data) => api.patch(`/reports/admin/${id}/`, data),
};

export const referralsAPI = {
  getCaseDetail: (caseId) => api.get(`/referrals/case/${caseId}/`),
  createReferral: (caseId, data) => api.post(`/referrals/case/${caseId}/referral/`, data),
  updateStep: (stepId, data) => api.patch(`/referrals/steps/${stepId}/`, data),
};

export const dashboardAPI = {
  getMetrics: (refresh) => api.get('/dashboard/metrics/', { params: { refresh } }),
  getSummary: () => api.get('/dashboard/summary/'),
};

// ── Admin: user management (add admins/advocates) ─────────────────────────────
export const adminAPI = {
  users: {
    list: (params) => api.get('/auth/users/', { params }),
    create: (data) => api.post('/auth/users/', data),          // Add admin/advocate
    update: (id, data) => api.patch(`/auth/users/${id}/`, data),
    deactivate: (id) => api.delete(`/auth/users/${id}/`),
  },
  services: {
    create: (data) => api.post('/services/', data),
    update: (id, data) => api.patch(`/services/${id}/`, data),
    verify: (id) => api.post(`/services/${id}/verify/`),
  },
  advocateDashboard: () => api.get('/auth/advocate/dashboard/'),
};

// ── New content modules ────────────────────────────────────────────────────
export const notesAPI = {
  list: (params) => api.get('/notes/', { params }),
  detail: (id) => api.get(`/notes/${id}/`),
};

export const blogAPI = {
  list: (params) => api.get('/blog/', { params }),
  detail: (slug) => api.get(`/blog/${slug}/`),
};

export const eventsAPI = {
  list: (params) => api.get('/events/', { params }),
  detail: (id) => api.get(`/events/${id}/`),
};

export const contactAPI = {
  submit: (data) => api.post('/contact/', data),
};

export default api;
