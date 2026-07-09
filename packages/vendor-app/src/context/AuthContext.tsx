import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth as authApi } from '../services/api';

interface AuthContextType {
  user: any;
  vendor: any;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshVendor: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const t = await AsyncStorage.getItem('tfood_vendor_token');
      if (t) {
        setToken(t);
        try {
          const res = await authApi.getProfile();
          setUser(res.data.data);
          setVendor(res.data.data.profile);
        } catch { await AsyncStorage.removeItem('tfood_vendor_token'); }
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    if (res.data.data.user.role !== 'vendor') throw new Error('This app is for vendors only');
    const { token: newToken, user: userData } = res.data.data;
    await AsyncStorage.setItem('tfood_vendor_token', newToken);
    setToken(newToken);
    setUser(userData);
    setVendor(userData.profile);
  };

  const register = async (data: any) => {
    const res = await authApi.register({ ...data, role: 'vendor' });
    const { token: newToken, user: userData } = res.data.data;
    await AsyncStorage.setItem('tfood_vendor_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('tfood_vendor_token');
    setToken(null);
    setUser(null);
    setVendor(null);
  };

  const refreshVendor = async () => {
    try {
      const res = await authApi.getProfile();
      setVendor(res.data.data.profile);
    } catch { }
  };

  return (
    <AuthContext.Provider value={{ user, vendor, token, isLoading, login, register, logout, refreshVendor }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
