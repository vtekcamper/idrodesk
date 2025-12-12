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

// Public route per creare il primo super admin (solo se non esistono super admin)
// IMPORTANTE: Rimuovi questa route dopo aver creato il primo super admin per sicurezza!
router.post('/super-admins', async (req, res, next) => {
  try {
    const prisma = (await import('../config/database')).default;
    const superAdminCount = await prisma.user.count({
      where: { isSuperAdmin: true },
    });
    
    // Se già esiste un super admin, richiedi autenticazione
    if (superAdminCount > 0) {
      // Usa i middleware di autenticazione
      return authenticate(req, res, () => {
        requireSuperAdmin(req, res, () => {
          createSuperAdmin(req, res);
        });
      });
    }
    
    // Se non ci sono super admin, permetti la creazione senza autenticazione
    return createSuperAdmin(req, res);
  } catch (error) {
    next(error);
  }
});

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

// Super admins management (GET richiede sempre autenticazione)
router.get('/super-admins', getSuperAdmins);

export default router;

