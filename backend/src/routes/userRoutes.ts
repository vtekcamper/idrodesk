import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import prisma from '../config/database';
import { hashPassword } from '../utils/password';

const router = Router();

router.use(authenticate);
router.use(requireRole('OWNER'));

router.get('/', async (req, res) => {
  try {
    const companyId = req.companyId!;
    const users = await prisma.user.findMany({
      where: { companyId },
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

router.post('/', async (req, res) => {
  try {
    const companyId = req.companyId!;
    const {
      nome,
      cognome,
      email,
      telefono,
      ruolo,
      password,
    } = req.body;

    // Verifica che l'email non esista già per questa company
    const existing = await prisma.user.findUnique({
      where: {
        companyId_email: {
          companyId,
          email,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Email già esistente' });
    }

    const user = await prisma.user.create({
      data: {
        companyId,
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
    const companyId = req.companyId!;
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
      where: { id, companyId },
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
      const existing = await prisma.user.findUnique({
        where: {
          companyId_email: {
            companyId,
            email,
          },
        },
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

