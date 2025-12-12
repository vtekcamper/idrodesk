import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { Ruolo } from '@prisma/client';

export const registerCompany = async (req: Request, res: Response) => {
  try {
    const {
      ragioneSociale,
      piva,
      indirizzo,
      telefono,
      email,
      nome,
      cognome,
      password,
    } = req.body;

    // Verifica se la P.IVA esiste già
    const existingCompany = await prisma.company.findUnique({
      where: { piva },
    });

    if (existingCompany) {
      return res.status(400).json({ error: 'P.IVA già registrata' });
    }

    // Crea company e utente owner
    const company = await prisma.company.create({
      data: {
        ragioneSociale,
        piva,
        indirizzo,
        telefono,
        email,
        users: {
          create: {
            nome,
            cognome,
            email,
            passwordHash: await hashPassword(password),
            ruolo: Ruolo.OWNER,
          },
        },
      },
      include: {
        users: {
          where: { ruolo: Ruolo.OWNER },
          take: 1,
        },
      },
    });

    const user = company.users[0];

    const tokenPayload = {
      userId: user.id,
      companyId: company.id,
      role: user.ruolo,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin || false,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        ruolo: user.ruolo,
      },
      company: {
        id: company.id,
        ragioneSociale: company.ragioneSociale,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message || 'Errore durante la registrazione' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findFirst({
      where: { email },
      include: { company: true },
    });

    // Super admin non può fare login normale, deve usare endpoint dedicato
    if (user?.isSuperAdmin) {
      return res.status(401).json({ error: 'Usa l\'endpoint /admin/login per super admin' });
    }

    if (!user || !user.attivo) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Utenti normali devono avere una company
    if (!user.company) {
      return res.status(401).json({ error: 'Utente non associato ad alcuna azienda' });
    }

    const isValid = await comparePassword(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const tokenPayload = {
      userId: user.id,
      companyId: user.companyId || undefined,
      role: user.ruolo,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin || false,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        ruolo: user.ruolo,
      },
      company: {
        id: user.company.id,
        ragioneSociale: user.company.ragioneSociale,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Errore durante il login' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token non fornito' });
    }

    const payload = verifyRefreshToken(refreshToken);

    // Verifica che l'utente esista ancora
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { company: true },
    });

    if (!user || !user.attivo) {
      return res.status(401).json({ error: 'Utente non valido' });
    }

    // Se è super admin, companyId può essere null
    // Se è utente normale, deve avere companyId
    const tokenPayload = {
      userId: user.id,
      companyId: user.companyId ?? undefined,
      role: user.ruolo,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin || false,
    };

    const newAccessToken = generateAccessToken(tokenPayload);

    res.json({
      accessToken: newAccessToken,
    });
  } catch (error: any) {
    console.error('Refresh error:', error);
    res.status(401).json({ error: 'Refresh token non valido' });
  }
};

