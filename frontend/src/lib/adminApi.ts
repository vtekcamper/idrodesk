import { apiClient } from './api';

// Admin API (solo per super admin)
export const adminApi = {
  // Companies
  getAllCompanies: (params?: { search?: string; piano?: string; attivo?: string }) =>
    apiClient.axiosInstance.get('/admin/companies', { params }),
  getCompany: (id: string) => apiClient.axiosInstance.get(`/admin/companies/${id}`),
  updateCompanyPlan: (id: string, data: { pianoAbbonamento: string; abbonamentoAttivo?: boolean; dataScadenza?: string; motivo?: string }) =>
    apiClient.axiosInstance.patch(`/admin/companies/${id}/plan`, data),
  toggleSubscription: (id: string, data: { attivo: boolean; motivo?: string }) =>
    apiClient.axiosInstance.patch(`/admin/companies/${id}/subscription`, data),

  // System Stats
  getSystemStats: () => apiClient.axiosInstance.get('/admin/stats'),

  // Super Admins
  getSuperAdmins: () => apiClient.axiosInstance.get('/admin/super-admins'),
  createSuperAdmin: (data: { nome: string; cognome: string; email: string; password: string }) =>
    apiClient.axiosInstance.post('/admin/super-admins', data),

  // Login super admin
  login: (email: string, password: string) =>
    apiClient.axiosInstance.post('/admin/login', { email, password }),
};

