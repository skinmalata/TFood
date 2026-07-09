import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('tfood_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      AsyncStorage.removeItem('tfood_token');
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.patch('/auth/profile', data),
  saveCard: (data: any) => api.post('/auth/cards', data),
};

export const discover = {
  getNearby: (lat: number, lng: number, radius?: number, cuisine?: string) =>
    api.get('/discover/nearby', { params: { latitude: lat, longitude: lng, radius, cuisine } }),
  search: (q: string) => api.get('/discover/search', { params: { q } }),
  getCuisines: () => api.get('/discover/cuisines'),
};

export const vendors = {
  getPublic: (id: number) => api.get(`/vendors/public/${id}`),
  getMenu: (vendorId?: number) => api.get(`/vendors/menu`, { params: { vendorId } }),
};

export const orders = {
  create: (data: any) => api.post('/orders', data),
  list: (status?: string) => api.get('/orders/consumer', { params: { status } }),
  get: (id: number) => api.get(`/orders/${id}`),
  cancel: (id: number) => api.patch(`/orders/${id}/cancel`),
};

export const chat = {
  getMessages: (orderId: number) => api.get(`/chat/messages/${orderId}`),
  send: (data: any) => api.post('/chat/messages', data),
  markRead: (orderId: number) => api.patch(`/chat/messages/${orderId}/read`),
  initiateCall: (data: any) => api.post('/chat/calls', data),
  getUnread: () => api.get('/chat/unread'),
};

export const reviews = {
  create: (data: any) => api.post('/reviews', data),
  getVendorReviews: (vendorId: number) => api.get(`/reviews/vendor/${vendorId}`),
};

export const payments = {
  verify: (ref: string) => api.get(`/payments/verify/${ref}`),
  chargeCard: (data: any) => api.post('/payments/charge-card', data),
  history: () => api.get('/payments/history'),
};

export default api;
