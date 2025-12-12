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

  // Users (tutti gli utenti)
  getAllUsers: (params?: { search?: string; ruolo?: string; attivo?: string; companyId?: string }) =>
    apiClient.axiosInstance.get('/admin/users', { params }),
  getUser: (id: string) => apiClient.axiosInstance.get(`/admin/users/${id}`),
  updateUser: (id: string, data: any) => apiClient.axiosInstance.patch(`/admin/users/${id}`, data),
  toggleUserStatus: (id: string, data: { attivo: boolean }) =>
    apiClient.axiosInstance.patch(`/admin/users/${id}/status`, data),

  // Payments
  createPayment: (data: any) => apiClient.axiosInstance.post('/admin/payments', data),
  getAllPayments: (params?: { companyId?: string; status?: string; paymentProvider?: string }) =>
    apiClient.axiosInstance.get('/admin/payments', { params }),
  getPayment: (id: string) => apiClient.axiosInstance.get(`/admin/payments/${id}`),

  // Email
  sendEmail: (data: any) => apiClient.axiosInstance.post('/admin/emails/send', data),
  getAllEmailNotifications: (params?: { companyId?: string; type?: string; status?: string }) =>
    apiClient.axiosInstance.get('/admin/emails', { params }),

  // Reports
  getAdvancedReports: (params?: { startDate?: string; endDate?: string; companyId?: string }) =>
    apiClient.axiosInstance.get('/admin/reports/advanced', { params }),
  getExpiringSubscriptions: (params?: { days?: number }) =>
    apiClient.axiosInstance.get('/admin/reports/subscriptions/expiring', { params }),
  getTopCompanies: (params?: { limit?: number; metric?: string }) =>
    apiClient.axiosInstance.get('/admin/reports/companies/top', { params }),

  // Check super admin exists
  checkSuperAdminExists: () => apiClient.axiosInstance.get('/admin/super-admins/check'),

  // Audit Logs
  getAllAuditLogs: (params?: {
    page?: number;
    limit?: number;
    actorType?: string;
    action?: string;
    entity?: string;
    companyId?: string;
    actorId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => apiClient.axiosInstance.get('/admin/audit-logs', { params }),
  getAuditLog: (id: string) => apiClient.axiosInstance.get(`/admin/audit-logs/${id}`),
  getAuditStats: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.axiosInstance.get('/admin/audit-logs/stats', { params }),

  // Impersonation
  impersonateUser: (userId: string) => apiClient.axiosInstance.post(`/admin/impersonate/${userId}`),
  stopImpersonation: () => apiClient.axiosInstance.post('/admin/impersonate/stop'),

  // Email Templates
  previewEmailTemplate: (data: { type: string; templateData?: any }) =>
    apiClient.axiosInstance.post('/admin/emails/preview', data),
  getEmailTemplates: () => apiClient.axiosInstance.get('/admin/emails/templates'),
};


