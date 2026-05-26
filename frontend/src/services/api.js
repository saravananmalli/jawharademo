import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jawhara-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('jawhara-token');
      localStorage.removeItem('jawhara-user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Simple in-memory GET cache ────────────────────────────────────────────────
// Prevents duplicate or repeated calls to the same public endpoints.
// Do NOT use for auth-sensitive routes (cart, orders, account).
const _cache = new Map();

export async function cachedGet(url, { params, ttl = 60_000 } = {}) {
  const key = url + '|' + JSON.stringify(params || {});
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.ts < ttl) return hit.res;
  const res = await api.get(url, params ? { params } : undefined);
  _cache.set(key, { res, ts: Date.now() });
  return res;
}

export function clearApiCache() {
  _cache.clear();
}

export default api;
