import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://easylandmaintenance.apiforapp.link/',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  let token = Cookies.get('token');
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('token') || undefined;
  }
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success === false && response.data.message === '*Not authenticated.') {
      handleAuthError();
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.data && error.response.data.message === '*Not authenticated.') {
      handleAuthError();
    }
    return Promise.reject(error);
  }
);

function handleAuthError() {
  Cookies.remove('token');
  localStorage.removeItem('token');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('session-expired'));
  }
}

export default api;
