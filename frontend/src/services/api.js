import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
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

// ── GET cache with in-flight deduplication + stale-while-revalidate ──────────
//
// _cache stores { res, ts } per key.
// _inflight stores the pending Promise for keys currently being fetched.
// If a second caller hits the same key while a fetch is in-flight, it shares
// the existing Promise rather than firing a duplicate request.
// After TTL the cached entry is served immediately (stale), then a background
// refresh silently replaces it so the next call gets fresh data.
//
// Do NOT use for auth-sensitive routes (cart, orders, account).

const _cache    = new Map();   // key → { res, ts }
const _inflight = new Map();   // key → Promise<response>

export async function cachedGet(url, { params, ttl = 60_000 } = {}) {
  const key = url + '|' + JSON.stringify(params || {});

  const hit = _cache.get(key);
  const now = Date.now();

  if (hit) {
    const age = now - hit.ts;
    if (age < ttl) {
      // Fresh — return immediately
      return hit.res;
    }
    // Stale — return the old value now, refresh in background
    if (!_inflight.has(key)) {
      const refresh = api.get(url, params ? { params } : undefined)
        .then(res => { _cache.set(key, { res, ts: Date.now() }); return res; })
        .catch(() => {})
        .finally(() => _inflight.delete(key));
      _inflight.set(key, refresh);
    }
    return hit.res;
  }

  // No cache entry — deduplicate concurrent callers
  if (_inflight.has(key)) return _inflight.get(key);

  const promise = api.get(url, params ? { params } : undefined)
    .then(res => { _cache.set(key, { res, ts: Date.now() }); return res; })
    .finally(() => _inflight.delete(key));

  _inflight.set(key, promise);
  return promise;
}

export function clearApiCache() {
  _cache.clear();
  _inflight.clear();
}

export default api;
