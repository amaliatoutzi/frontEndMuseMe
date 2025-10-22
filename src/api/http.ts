import axios from 'axios';

const http = axios.create({
  baseURL: '/api', // Changed from http://localhost:8000/api to use Vite proxy
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

function maskSensitive(v: any) {
  try {
    const obj = typeof v === 'string' ? JSON.parse(v) : v;
    if (!obj || typeof obj !== 'object') return v;
    const clone: any = Array.isArray(obj) ? [...obj] : { ...obj };
    const maskKeys = ['password', 'pass', 'token'];
    for (const k of Object.keys(clone)) {
      if (maskKeys.includes(k.toLowerCase())) clone[k] = '***';
    }
    return clone;
  } catch {
    return v;
  }
}

http.interceptors.response.use(
  (r) => r,
  (error) => {
    // Centralized error logging; surface to UI at call-site
    const msg = error?.response?.data?.error || error?.message || 'API error';
    const method = (error?.config?.method || 'GET').toUpperCase();
    const url = error?.config?.url || '(unknown URL)';
    const status = error?.response?.status;
    const payload = maskSensitive(error?.config?.data);
    console.error('[API]', msg, { method, url, status, payload, response: error?.response });
    return Promise.reject(error);
  }
);

export default http;
