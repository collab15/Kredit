import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kredit_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Something went wrong';
    if (err.response?.status === 401) {
      localStorage.removeItem('kredit_token');
      localStorage.removeItem('kredit_user');
      window.location.href = '/login';
    }
    return Promise.reject(new Error(message));
  }
);

// ── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (data)   => api.post('/auth/login', data),
  register: (data)   => api.post('/auth/register', data),
  me:       ()       => api.get('/auth/me'),
};

// ── Admins ─────────────────────────────────────────────────────────────────
export const adminsApi = {
  getAll:  ()         => api.get('/admins'),
  getOne:  (id)       => api.get(`/admins/${id}`),
  create:  (data)     => api.post('/admins', data),
  update:  (id, data) => api.put(`/admins/${id}`, data),
  remove:  (id)       => api.delete(`/admins/${id}`),
};

// ── Users ──────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll:           ()          => api.get('/users'),
  getOne:           (id)        => api.get(`/users/${id}`),
  create:           (data)      => api.post('/users', data),
  update:           (id, data)  => api.put(`/users/${id}`, data),
  remove:           (id)        => api.delete(`/users/${id}`),
  transfer:         (data)      => api.post('/users/transfer', data),
  transferToOrg:    (data)      => api.post('/users/transfer-to-org', data),
  getTransactions:  (id)        => api.get(`/users/${id}/transactions`),
  getBalanceAudit:  (id)        => api.get(`/users/${id}/balance-audit`),
};

// ── Orgs ───────────────────────────────────────────────────────────────────
export const orgsApi = {
  getAll:           ()          => api.get('/orgs'),
  getMe:            ()          => api.get('/orgs/me'),
  getOne:           (id)        => api.get(`/orgs/${id}`),
  getAgencies:      ()          => api.get('/orgs/agencies'),
  getPartnered:     ()          => api.get('/orgs/partnered'),
  create:           (data)      => api.post('/orgs', data),
  update:           (id, data)  => api.put(`/orgs/${id}`, data),
  updateMe:         (data)      => api.put('/orgs/me', data),
  reward:           (data)      => api.post('/orgs/reward', data),
  remove:           (id)        => api.delete(`/orgs/${id}`),
  getBalanceAudit:  (id)        => api.get(`/orgs/${id}/balance-audit`),
};

// ── Favours ────────────────────────────────────────────────────────────────
export const favoursApi = {
  getAll:   ()           => api.get('/favours'),
  create:   (data)       => api.post('/favours', data),
  complete: (id, data)   => api.put(`/favours/${id}/complete`, data),
  remove:   (id)         => api.delete(`/favours/${id}`),
};

// ── Transactions ───────────────────────────────────────────────────────────
export const transactionsApi = {
  getAll:       ()  => api.get('/transactions'),
  getPeer:      ()  => api.get('/transactions/peer'),
  getRewards:   ()  => api.get('/transactions/rewards'),
  getOrgPayments: () => api.get('/transactions/org-payments'),
  getStats:     ()  => api.get('/transactions/stats'),
};

export default api;
