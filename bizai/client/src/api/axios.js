import axios from 'axios';

// In production (Static Site), VITE_API_URL points to the backend Web Service URL
// In development, Vite proxy forwards /api → localhost:5000
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('bizai_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear stale token and redirect
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bizai_token');
      localStorage.removeItem('bizai_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;
