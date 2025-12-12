import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken } from '../utils/jwt';

/**
 * Crea un super admin
 */
export const createSuperAdmin = async (req: Request, res: Response) => {
  try {
    const { nome, cognome, email, password } = req.body;

    // Verifica che non esista già
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({ error: 'Email già esistente' });
    }

    const superAdmin = await prisma.user.create({
      data: {
        nome,
        cognome,
        email,
        passwordHash: await hashPassword(password),
        ruolo: 'OWNER',
        isSuperAdmin: true,
        companyId: null, // Super admin non appartiene a nessuna azienda
      },
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        isSuperAdmin: true,
        createdAt: true,
      },
    });

    res.status(201).json(superAdmin);
  } catch (error: any) {
    console.error('Create super admin error:', error);
    res.status(500).json({ error: error.message || 'Errore nella creazione super admin' });
  }
};

/**
 * Login super admin
 */
export const loginSuperAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isSuperAdmin) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const isValid = await comparePassword(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const tokenPayload = {
      userId: user.id,
      companyId: undefined,
      role: user.ruolo,
      email: user.email,
      isSuperAdmin: true,
    };

    const accessToken = generateAccessToken(tokenPayload);

    res.json({
      accessToken,
      user: {
        id: user.id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        isSuperAdmin: true,
      },
    });
  } catch (error: any) {
    console.error('Super admin login error:', error);
    res.status(500).json({ error: error.message || 'Errore durante il login' });
  }
};

/**
 * Ottiene tutti i super admin
 */
export const getSuperAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await prisma.user.findMany({
      where: { isSuperAdmin: true },
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        attivo: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(admins);
  } catch (error: any) {
    console.error('Get super admins error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero super admin' });
  }
};

