import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenantIsolation';
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
  requestDataExport as gdprRequestExport,
  getDataExports as gdprGetExports,
  downloadDataExport as gdprDownloadExport,
  softDeleteCompany as gdprSoftDelete,
} from '../controllers/gdprController';

const router = Router();

// Tutte le route richiedono autenticazione e tenant
router.use(authenticate);
router.use(requireTenant);

// Company Settings
router.get('/settings', getCompanySettings);
router.patch('/settings', updateCompanySettings);

// Usage & Billing
router.get('/usage', getCompanyUsage);
router.get('/billing', getCompanyBilling);
router.get('/payments', getCompanyPayments);

// GDPR
router.post('/export', requestDataExport);
router.get('/exports', getDataExports);
router.get('/exports/:id/download', downloadDataExport);
router.delete('/delete', softDeleteCompany);

export default router;

