import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/admin';
import {
  getAllCompanies,
  getCompany,
  updateCompanyPlan,
  toggleSubscription,
  getSystemStats,
} from '../controllers/adminController';
import {
  createSuperAdmin,
  loginSuperAdmin,
  getSuperAdmins,
} from '../controllers/adminUserController';

const router = Router();

// Public routes (super admin login)
router.post('/login', loginSuperAdmin);

// Protected routes (richiedono super admin)
router.use(authenticate);
router.use(requireSuperAdmin);

// Companies management
router.get('/companies', getAllCompanies);
router.get('/companies/:id', getCompany);
router.patch('/companies/:id/plan', updateCompanyPlan);
router.patch('/companies/:id/subscription', toggleSubscription);

// System stats
router.get('/stats', getSystemStats);

// Super admins management
router.get('/super-admins', getSuperAdmins);
router.post('/super-admins', createSuperAdmin);

export default router;

