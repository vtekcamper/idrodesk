import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor per aggiungere il token a tutte le richieste
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor per gestire errori 401 (token scaduto)
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token scaduto, logout
          this.clearAuth();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private clearAuth(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', token);
    }
  }

  get axiosInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();

// Helper per estrarre i dati dalla risposta axios
export const extractData = <T>(response: any): T => {
  return response.data;
};

// Auth API
export const authApi = {
  registerCompany: (data: any) => apiClient.axiosInstance.post('/auth/register-company', data),
  login: (data: { email: string; password: string }) =>
    apiClient.axiosInstance.post('/auth/login', data),
  refresh: (refreshToken: string) =>
    apiClient.axiosInstance.post('/auth/refresh', { refreshToken }),
};

// Clients API
export const clientsApi = {
  getAll: (params?: { search?: string }) =>
    apiClient.axiosInstance.get('/clients', { params }),
  getById: (id: string) => apiClient.axiosInstance.get(`/clients/${id}`),
  create: (data: any) => apiClient.axiosInstance.post('/clients', data),
  update: (id: string, data: any) =>
    apiClient.axiosInstance.patch(`/clients/${id}`, data),
};

// Quotes API
export const quotesApi = {
  getAll: (params?: { clientId?: string; stato?: string }) =>
    apiClient.axiosInstance.get('/quotes', { params }),
  getById: (id: string) => apiClient.axiosInstance.get(`/quotes/${id}`),
  create: (data: any) => apiClient.axiosInstance.post('/quotes', data),
  update: (id: string, data: any) =>
    apiClient.axiosInstance.patch(`/quotes/${id}`, data),
  duplicate: (id: string) => apiClient.axiosInstance.post(`/quotes/${id}/duplicate`),
  convertToJob: (id: string, data?: any) =>
    apiClient.axiosInstance.post(`/quotes/${id}/to-job`, data),
};

// Jobs API
export const jobsApi = {
  getAll: (params?: { stato?: string; assegnatoA?: string; data?: string }) =>
    apiClient.axiosInstance.get('/jobs', { params }),
  getById: (id: string) => apiClient.axiosInstance.get(`/jobs/${id}`),
  create: (data: any) => apiClient.axiosInstance.post('/jobs', data),
  update: (id: string, data: any) =>
    apiClient.axiosInstance.patch(`/jobs/${id}`, data),
  start: (id: string) => apiClient.axiosInstance.patch(`/jobs/${id}/start`),
  complete: (id: string) => apiClient.axiosInstance.patch(`/jobs/${id}/complete`),
  // Dashboard endpoints
  getDashboardStats: () => apiClient.axiosInstance.get('/jobs/dashboard/stats'),
  getToday: () => apiClient.axiosInstance.get('/jobs/dashboard/today'),
  getUpcoming: () => apiClient.axiosInstance.get('/jobs/dashboard/upcoming'),
  getToClose: () => apiClient.axiosInstance.get('/jobs/dashboard/to-close'),
  addMaterial: (jobId: string, data: any) =>
    apiClient.axiosInstance.post(`/jobs/${jobId}/materials`, data),
  deleteMaterial: (jobId: string, materialId: string) =>
    apiClient.axiosInstance.delete(`/jobs/${jobId}/materials/${materialId}`),
  startChecklist: (jobId: string, checklistId: string) =>
    apiClient.axiosInstance.post(`/jobs/${jobId}/checklists/${checklistId}/start`),
  saveChecklistResponses: (checklistId: string, responses: any[]) =>
    apiClient.axiosInstance.post(`/job-checklists/${checklistId}/responses`, { responses }),
  addAttachment: (jobId: string, file: File, tipo?: string, descrizione?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (tipo) formData.append('tipo', tipo);
    if (descrizione) formData.append('descrizione', descrizione);
    return apiClient.axiosInstance.post(`/jobs/${jobId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAttachments: (jobId: string) =>
    apiClient.axiosInstance.get(`/jobs/${jobId}/attachments`),
  getReport: (jobId: string) => apiClient.axiosInstance.get(`/jobs/${jobId}/report`),
  createReport: (jobId: string, data: any) =>
    apiClient.axiosInstance.post(`/jobs/${jobId}/report`, data),
  updateReport: (jobId: string, reportId: string, data: any) =>
    apiClient.axiosInstance.patch(`/jobs/${jobId}/report/${reportId}`, data),
  getReportPDF: (jobId: string) =>
    apiClient.axiosInstance.get(`/jobs/${jobId}/report-pdf`, { responseType: 'blob' }),
};

// Materials API
export const materialsApi = {
  getAll: (params?: { search?: string }) =>
    apiClient.axiosInstance.get('/materials', { params }),
  create: (data: any) => apiClient.axiosInstance.post('/materials', data),
  update: (id: string, data: any) =>
    apiClient.axiosInstance.patch(`/materials/${id}`, data),
};

// Checklists API
export const checklistsApi = {
  getAll: () => apiClient.axiosInstance.get('/checklists'),
  getById: (id: string) => apiClient.axiosInstance.get(`/checklists/${id}`),
  create: (data: any) => apiClient.axiosInstance.post('/checklists', data),
};

// Users API
export const usersApi = {
  getAll: () => apiClient.axiosInstance.get('/users'),
  create: (data: any) => apiClient.axiosInstance.post('/users', data),
  update: (id: string, data: any) =>
    apiClient.axiosInstance.patch(`/users/${id}`, data),
};

// Company API (Tenant Admin)
export const companyApi = {
  // Settings unificato
  getAllSettings: () => apiClient.axiosInstance.get('/company/settings'),
  // Company settings
  updateCompanySettings: (data: any) => apiClient.axiosInstance.patch('/company/settings/company', data),
  // Document settings
  getDocumentSettings: () => apiClient.axiosInstance.get('/company/settings/documents'),
  updateDocumentSettings: (data: any) => apiClient.axiosInstance.patch('/company/settings/documents', data),
  // App preferences
  getAppPreferences: () => apiClient.axiosInstance.get('/company/settings/preferences'),
  updateAppPreferences: (data: any) => apiClient.axiosInstance.patch('/company/settings/preferences', data),
  // Notifications
  updateNotifications: (data: any) => apiClient.axiosInstance.patch('/company/settings/notifications', data),
  // Usage & Billing
  getUsage: () => apiClient.axiosInstance.get('/company/usage'),
  getBilling: () => apiClient.axiosInstance.get('/company/billing'),
  getPayments: (params?: { page?: number; limit?: number }) =>
    apiClient.axiosInstance.get('/company/payments', { params }),
  // GDPR
  requestDataExport: (data: { format?: string; includeTables?: string[] }) =>
    apiClient.axiosInstance.post('/company/export', data),
  getDataExports: () => apiClient.axiosInstance.get('/company/exports'),
  downloadDataExport: (id: string) =>
    apiClient.axiosInstance.get(`/company/exports/${id}/download`, { responseType: 'blob' }),
  softDeleteCompany: () => apiClient.axiosInstance.delete('/company/delete'),
};

// Auth API
export const authApi = {
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.axiosInstance.post('/auth/change-password', data),
};

// Users API (esteso)
export const usersApi = {
  getAll: () => apiClient.axiosInstance.get('/users'),
  create: (data: any) => apiClient.axiosInstance.post('/users', data),
  update: (id: string, data: any) =>
    apiClient.axiosInstance.patch(`/users/${id}`, data),
  resetPassword: (id: string) => apiClient.axiosInstance.post(`/users/${id}/reset-password`),
};

