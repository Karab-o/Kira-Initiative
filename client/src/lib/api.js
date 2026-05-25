import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  timeout: 60000,
});

// Attach doctor JWT if present in zustand store. We avoid a hard import cycle
// by reading the token from localStorage; the doctorStore mirrors it there.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kira_doctor_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    if (status === 401 || status === 403) {
      // Doctor token rejected — let the auth guard handle redirect
      // (we don't clear here to avoid double-clearing during normal 403s)
    }
    return Promise.reject(err);
  },
);

export function apiError(err) {
  return err?.response?.data?.error || err?.message || 'Something went wrong';
}
