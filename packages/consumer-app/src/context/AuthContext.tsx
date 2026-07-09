import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth as authApi } from '../services/api';

interface AuthContextType {
  user: any;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: any) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      const t = await AsyncStorage.getItem('tfood_token');
      if (t) {
        setToken(t);
        try {
          const res = await authApi.getProfile();
          setUser(res.data.data);
        } catch { await AsyncStorage.removeItem('tfood_token'); }
      }
      setIsLoading(false);
    };
    loadToken();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { token: newToken, user: userData } = res.data.data;
    await AsyncStorage.setItem('tfood_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const register = async (data: any) => {
    const res = await authApi.register(data);
    const { token: newToken, user: userData } = res.data.data;
    await AsyncStorage.setItem('tfood_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('tfood_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (data: any) => setUser((prev: any) => ({ ...prev, ...data }));

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
