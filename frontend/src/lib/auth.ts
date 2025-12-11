import { apiClient, authApi } from './api';

export interface User {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  ruolo: 'OWNER' | 'TECNICO' | 'BACKOFFICE';
}

export interface Company {
  id: string;
  ragioneSociale: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  company: Company;
}

export const auth = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await authApi.login({ email, password });
    const data: AuthResponse = response.data;

    apiClient.setToken(data.accessToken);
    apiClient.setRefreshToken(data.refreshToken);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('company', JSON.stringify(data.company));
    }

    return data;
  },

  register: async (data: {
    ragioneSociale: string;
    piva: string;
    indirizzo?: string;
    telefono?: string;
    email: string;
    nome: string;
    cognome: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await authApi.registerCompany(data);
    const authData: AuthResponse = response.data;

    apiClient.setToken(authData.accessToken);
    apiClient.setRefreshToken(authData.refreshToken);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(authData.user));
      localStorage.setItem('company', JSON.stringify(authData.company));
    }

    return authData;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('company');
    }
  },

  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getCompany: (): Company | null => {
    if (typeof window === 'undefined') return null;
    const companyStr = localStorage.getItem('company');
    return companyStr ? JSON.parse(companyStr) : null;
  },

  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('accessToken');
  },
};

