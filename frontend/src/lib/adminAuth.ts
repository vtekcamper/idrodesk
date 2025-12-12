import { adminApi } from './adminApi';
import { apiClient } from './api';

export interface SuperAdmin {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  isSuperAdmin: boolean;
}

export interface AdminAuthResponse {
  accessToken: string;
  user: SuperAdmin;
}

export const adminAuth = {
  login: async (email: string, password: string): Promise<AdminAuthResponse> => {
    const response = await adminApi.login(email, password);
    const data: AdminAuthResponse = response.data;

    apiClient.setToken(data.accessToken);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('isSuperAdmin', 'true');
    }

    return data;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isSuperAdmin');
      localStorage.removeItem('company');
    }
  },

  isSuperAdmin: (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('isSuperAdmin') === 'true';
  },

  getAdmin: (): SuperAdmin | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user.isSuperAdmin ? user : null;
  },
};

