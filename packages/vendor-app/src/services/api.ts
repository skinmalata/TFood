import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('tfood_vendor_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) AsyncStorage.removeItem('tfood_vendor_token');
    return Promise.reject(error);
  }
);

export const auth = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/vendors/me'),
};

export const vendor = {
  getProfile: () => api.get('/vendors/me'),
  update: (data: any) => api.patch('/vendors/me', data),
  toggleOpen: () => api.post('/vendors/toggle-open'),
  getDashboard: () => api.get('/vendors/dashboard'),
  uploadDocument: (data: FormData) => api.post('/vendors/documents', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const menu = {
  list: () => api.get('/vendors/menu'),
  create: (data: any) => api.post('/vendors/menu', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: number, data: any) => api.patch(`/vendors/menu/${id}`, data),
  delete: (id: number) => api.delete(`/vendors/menu/${id}`),
  toggle: (id: number) => api.patch(`/vendors/menu/${id}/toggle`),
};

export const orders = {
  list: (status?: string) => api.get('/vendors/orders', { params: { status } }),
  get: (id: number) => api.get(`/orders/${id}`),
  updateStatus: (id: number, status: string) => api.patch(`/orders/${id}/action`, { status }),
};

export const chat = {
  getMessages: (orderId: number) => api.get(`/chat/messages/${orderId}`),
  send: (data: any) => api.post('/chat/messages', data),
  markRead: (orderId: number) => api.patch(`/chat/messages/${orderId}/read`),
  getUnread: () => api.get('/chat/unread'),
};

export default api;
