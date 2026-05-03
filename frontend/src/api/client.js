import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ── Interceptor: surface error messages ───────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ── Users ──────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll:           ()       => api.get('/users'),
  getOne:           (id)     => api.get(`/users/${id}`),
  create:           (data)   => api.post('/users', data),
  update:           (id, d)  => api.put(`/users/${id}`, d),
  remove:           (id)     => api.delete(`/users/${id}`),
  transfer:         (data)   => api.post('/users/transfer', data),
  getTransactions:  (id)     => api.get(`/users/${id}/transactions`),
};

// ── Orgs ───────────────────────────────────────────────────────────────────
export const orgsApi = {
  getAll:      ()     => api.get('/orgs'),
  getAgencies: ()     => api.get('/orgs/agencies'),
  getPartnered:()     => api.get('/orgs/partnered'),
  create:      (data) => api.post('/orgs', data),
  reward:      (data) => api.post('/orgs/reward', data),
  remove:      (id)   => api.delete(`/orgs/${id}`),
};

// ── Favours ────────────────────────────────────────────────────────────────
export const favoursApi = {
  getAll:   ()         => api.get('/favours'),
  create:   (data)     => api.post('/favours', data),
  complete: (id, data) => api.put(`/favours/${id}/complete`, data),
  remove:   (id)       => api.delete(`/favours/${id}`),
};

// ── Transactions ───────────────────────────────────────────────────────────
export const transactionsApi = {
  getAll:    () => api.get('/transactions'),
  getPeer:   () => api.get('/transactions/peer'),
  getRewards:() => api.get('/transactions/rewards'),
  getStats:  () => api.get('/transactions/stats'),
};

export default api;