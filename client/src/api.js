import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401/403 — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
      localStorage.removeItem('nms_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
