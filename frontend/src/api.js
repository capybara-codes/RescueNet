import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 90000, // 90 seconds to accommodate 15km Overpass scans
});

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  // Check for Demo Mode first
  const demoRole = localStorage.getItem('rescuenet_demo_role');
  if (demoRole) {
    config.headers.Authorization = `Bearer demo-${demoRole}`;
    return config;
  }

  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Unknown error';
    return Promise.reject(new Error(msg));
  }
);

export default api;
