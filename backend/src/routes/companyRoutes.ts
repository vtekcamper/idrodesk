import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenantIsolation';
import { exportRateLimiter, emailRateLimiter } from '../middleware/rateLimit';
import {
  getCompanySettings,
  updateCompanySettings,
  getCompanyUsage,
  getCompanyBilling,
  getCompanyPayments,
  requestDataExport,
  getDataExports,
  downloadDataExport,
  softDeleteCompany,
} from '../controllers/companyController';
import {
  getAllSettings,
  updateCompanySettings as updateCompanySettingsNew,
  getDocumentSettings,
  updateDocumentSettings,
  getAppPreferences,
  updateAppPreferences,
  updateNotifications,
} from '../controllers/settingsController';
import {
  requestDataExport as gdprRequestExport,
  getDataExports as gdprGetExports,
  downloadDataExport as gdprDownloadExport,
  softDeleteCompany as gdprSoftDelete,
} from '../controllers/gdprController';

const router = Router();

// Tutte le route richiedono autenticazione e tenant
router.use(authenticate);
router.use(requireTenant);

// Settings unificato (GET tutte le impostazioni)
router.get('/settings', getAllSettings);

// Company Settings (azienda)
router.patch('/settings/company', updateCompanySettingsNew);

// Document Settings (preventivi/rapporti)
router.get('/settings/documents', getDocumentSettings);
router.patch('/settings/documents', updateDocumentSettings);

// App Preferences
router.get('/settings/preferences', getAppPreferences);
router.patch('/settings/preferences', updateAppPreferences);

// Notifications
router.patch('/settings/notifications', updateNotifications);

// Usage & Billing
router.get('/usage', getCompanyUsage);
router.get('/billing', getCompanyBilling);
router.get('/payments', getCompanyPayments);

// GDPR (con rate limiting)
router.post('/export', exportRateLimiter, requestDataExport);
router.get('/exports', getDataExports);
router.get('/exports/:id/download', downloadDataExport);
router.delete('/delete', softDeleteCompany);

export default router;

