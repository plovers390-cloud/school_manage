import axios from 'axios';
import { toast } from 'react-hot-toast';
import { store } from '../store/store';
import { startLoading, stopLoading } from '../store/slices/uiSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Request interceptor to attach Bearer token and start loading
api.interceptors.request.use((config) => {
  store.dispatch(startLoading());
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  store.dispatch(stopLoading());
  return Promise.reject(error);
});

// Response interceptor for auto token refresh and stop loading
api.interceptors.response.use(
  (response) => {
    store.dispatch(stopLoading());
    return response;
  },
  async (error) => {
    store.dispatch(stopLoading());
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && 
        error.response?.data?.code === 'TOKEN_EXPIRED' && 
        !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken }, { withCredentials: true });
        
        if (response.data.accessToken) {
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Global error handler
    const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Something went wrong';
    toast.error(errorMessage, {
      id: 'global-api-error', // Use fixed id to prevent duplicate toasts
    });

    return Promise.reject(error);
  }
);

export default api;
