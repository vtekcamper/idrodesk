import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { checkPlanLimits } from '../middleware/planLimits';
import prisma from '../config/database';
import { hashPassword } from '../utils/password';

const router = Router();

router.use(authenticate);
// Solo OWNER o super admin possono gestire utenti
router.use((req, res, next) => {
  if (req.user?.isSuperAdmin || req.user?.role === 'OWNER') {
    return next();
  }
  return res.status(403).json({ error: 'Permessi insufficienti' });
});

router.get('/', async (req, res) => {
  try {
    // Super admin può vedere tutti, OWNER solo della sua azienda
    const where: any = req.user?.isSuperAdmin 
      ? { isSuperAdmin: false, companyId: { not: null } } // Super admin vede tutti gli utenti aziendali
      : { companyId: req.companyId! };
      
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        telefono: true,
        ruolo: true,
        attivo: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero utenti' });
  }
});

// Verifica limiti utenti prima di creare (solo per utenti aziendali, non super admin)
router.post('/', checkPlanLimits('users'), async (req, res) => {
  try {
    // Super admin può creare utenti per qualsiasi azienda
    const companyId = req.user?.isSuperAdmin 
      ? req.body.companyId || req.companyId
      : req.companyId!;
      
    const {
      nome,
      cognome,
      email,
      telefono,
      ruolo,
      password,
    } = req.body;

    if (!companyId && !req.user?.isSuperAdmin) {
      return res.status(400).json({ error: 'companyId richiesto per creare utenti aziendali' });
    }

    // Verifica che l'email non esista già (per questa company o globalmente se super admin)
    const existing = companyId
      ? await prisma.user.findUnique({
          where: {
            companyId_email: {
              companyId,
              email,
            },
          },
        })
      : await prisma.user.findUnique({
          where: { email },
        });

    if (existing) {
      return res.status(400).json({ error: 'Email già esistente per questa azienda' });
    }

    const user = await prisma.user.create({
      data: {
        ...(companyId && { companyId }),
        nome,
        cognome,
        email,
        telefono,
        ruolo: ruolo || 'BACKOFFICE',
        passwordHash: await hashPassword(password),
      },
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        telefono: true,
        ruolo: true,
        attivo: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(500).json({ error: error.message || 'Errore nella creazione utente' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Super admin può modificare qualsiasi utente
    const where: any = req.user?.isSuperAdmin
      ? { id }
      : { id, companyId: req.companyId! };
      
    const {
      nome,
      cognome,
      email,
      telefono,
      ruolo,
      attivo,
      password,
    } = req.body;

    const user = await prisma.user.findFirst({
      where,
    });

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    const updateData: any = {
      ...(nome && { nome }),
      ...(cognome && { cognome }),
      ...(telefono !== undefined && { telefono }),
      ...(ruolo && { ruolo }),
      ...(attivo !== undefined && { attivo }),
    };

    // Se cambia email, verifica che non esista già
    if (email && email !== user.email) {
      const existing = user.companyId
        ? await prisma.user.findUnique({
            where: {
              companyId_email: {
                companyId: user.companyId,
                email,
              },
            },
          })
        : await prisma.user.findUnique({
            where: { email },
          });

      if (existing) {
        return res.status(400).json({ error: 'Email già esistente' });
      }

      updateData.email = email;
    }

    // Se c'è una nuova password, hasha
    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        telefono: true,
        ruolo: true,
        attivo: true,
        createdAt: true,
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'aggiornamento utente' });
  }
});

export default router;

