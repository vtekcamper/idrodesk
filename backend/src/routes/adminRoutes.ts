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

// Public route per verificare se esiste già un super admin
router.get('/super-admins/check', async (req, res) => {
  try {
    const prisma = (await import('../config/database')).default;
    
    let superAdminCount = 0;
    try {
      superAdminCount = await prisma.user.count({
        where: { isSuperAdmin: true },
      });
    } catch (error: any) {
      // Se le tabelle non esistono ancora, non ci sono super admin
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        return res.json({ exists: false, count: 0 });
      }
      throw error;
    }
    
    return res.json({ exists: superAdminCount > 0, count: superAdminCount });
  } catch (error: any) {
    console.error('Check super admin error:', error);
    // In caso di errore, assumiamo che non ci siano super admin
    return res.json({ exists: false, count: 0 });
  }
});

// Public route per creare il primo super admin (solo se non esistono super admin)
// IMPORTANTE: Rimuovi questa route dopo aver creato il primo super admin per sicurezza!
router.post('/super-admins', async (req, res, next) => {
  try {
    const prisma = (await import('../config/database')).default;
    
    // Prova a contare i super admin, ma se le tabelle non esistono, permetti la creazione
    let superAdminCount = 0;
    let testSuperAdmin = null;
    try {
      superAdminCount = await prisma.user.count({
        where: { isSuperAdmin: true },
      });
      
      // Se c'è solo un super admin e è quello di test (test@test.com), permettiamo di eliminarlo e crearne uno nuovo
      if (superAdminCount === 1) {
        testSuperAdmin = await prisma.user.findFirst({
          where: { 
            isSuperAdmin: true,
            email: 'test@test.com'
          },
        });
        
        // Se esiste solo il super admin di test, eliminiamolo e permettiamo la creazione
        if (testSuperAdmin) {
          console.log('Found test super admin, deleting it to allow real super admin creation');
          await prisma.user.delete({
            where: { id: testSuperAdmin.id },
          });
          // Ora possiamo creare il super admin reale
          return createSuperAdmin(req, res);
        }
      }
    } catch (error: any) {
      // Se le tabelle non esistono ancora (errore P2021), permetti la creazione
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.log('Tables do not exist yet, allowing super admin creation');
        return createSuperAdmin(req, res);
      }
      // Altrimenti, rilancia l'errore
      throw error;
    }
    
    // Se già esiste un super admin (e non è quello di test), richiedi autenticazione
    if (superAdminCount > 0) {
      // Verifica se c'è un token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token richiesto. Fai login come super admin.' });
      }
      
      // Usa i middleware di autenticazione
      return authenticate(req, res, () => {
        requireSuperAdmin(req, res, () => {
          createSuperAdmin(req, res);
        });
      });
    }
    
    // Se non ci sono super admin, permetti la creazione senza autenticazione
    return createSuperAdmin(req, res);
  } catch (error: any) {
    console.error('Super admin creation route error:', error);
    return res.status(500).json({ error: error.message || 'Errore nella creazione super admin' });
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

