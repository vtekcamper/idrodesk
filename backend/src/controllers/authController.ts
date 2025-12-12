import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { Ruolo } from '@prisma/client';
import crypto from 'crypto';
import { logAuditAction } from '../middleware/auditLog';

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
    const refreshTokenString = generateRefreshToken(tokenPayload);
    
    // Salva refresh token nel DB (30 giorni)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        companyId: company.id,
        token: refreshTokenString,
        expiresAt,
        ip: req.ip || req.socket.remoteAddress || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      },
    });

    res.status(201).json({
      accessToken,
      refreshToken: refreshTokenString,
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
    const refreshTokenString = generateRefreshToken(tokenPayload);
    
    // Salva refresh token nel DB (30 giorni)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        companyId: user.companyId || undefined,
        token: refreshTokenString,
        expiresAt,
        ip: req.ip || req.socket.remoteAddress || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      },
    });
    
    // Audit log per login
    await logAuditAction(req, 'LOGIN', 'User', user.id, {
      email: user.email,
      companyId: user.companyId,
    });

    res.json({
      accessToken,
      refreshToken: refreshTokenString,
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
    const { refreshToken: refreshTokenString } = req.body;

    if (!refreshTokenString) {
      return res.status(400).json({ error: 'Refresh token non fornito' });
    }

    // Verifica token nel DB (rotation)
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenString },
      include: { user: true },
    });

    if (!dbToken) {
      return res.status(401).json({ error: 'Refresh token non valido' });
    }

    // Verifica che non sia revocato
    if (dbToken.revoked) {
      return res.status(401).json({ error: 'Refresh token revocato' });
    }

    // Verifica che non sia scaduto
    if (new Date() > dbToken.expiresAt) {
      // Marca come revocato
      await prisma.refreshToken.update({
        where: { id: dbToken.id },
        data: { revoked: true, revokedAt: new Date() },
      });
      return res.status(401).json({ error: 'Refresh token scaduto' });
    }

    const user = dbToken.user;

    if (!user || !user.attivo) {
      return res.status(401).json({ error: 'Utente non valido' });
    }

    // Revoca token vecchio (rotation)
    await prisma.refreshToken.update({
      where: { id: dbToken.id },
      data: { revoked: true, revokedAt: new Date() },
    });

    // Genera nuovo access token
    const tokenPayload = {
      userId: user.id,
      companyId: user.companyId || undefined,
      role: user.ruolo,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin || false,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    
    // Genera nuovo refresh token (opzionale: solo se richiesto)
    // Per ora restituiamo solo access token, refresh token può essere riutilizzato
    // fino a scadenza o revoca esplicita

    res.json({
      accessToken: newAccessToken,
    });
  } catch (error: any) {
    console.error('Refresh error:', error);
    res.status(401).json({ error: 'Refresh token non valido' });
  }
};

/**
 * Logout: revoca refresh token corrente
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken: refreshTokenString } = req.body;

    if (refreshTokenString) {
      // Revoca refresh token se fornito
      await prisma.refreshToken.updateMany({
        where: {
          token: refreshTokenString,
          revoked: false,
        },
        data: {
          revoked: true,
          revokedAt: new Date(),
        },
      });
    }

    // Se autenticato, revoca tutti i token dell'utente (opzionale)
    if (req.user?.userId) {
      // Opzionale: revoca tutti i token dell'utente
      // await prisma.refreshToken.updateMany({
      //   where: {
      //     userId: req.user.userId,
      //     revoked: false,
      //   },
      //   data: {
      //     revoked: true,
      //     revokedAt: new Date(),
      //   },
      // });
    }

    res.json({ message: 'Logout effettuato con successo' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Errore durante il logout' });
  }
};

/**
 * Forgot password: genera token reset
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email richiesta' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Per sicurezza, non riveliamo se l'email esiste
    if (!user) {
      return res.json({ message: 'Se l\'email esiste, riceverai un link per resettare la password' });
    }

    // Genera token univoco
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 ora

    // Salva token nel DB
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        ip: req.ip || req.socket.remoteAddress || undefined,
      },
    });

    // TODO: Invia email con link reset
    // await sendPasswordResetEmail(user.email, token);

    res.json({ message: 'Se l\'email esiste, riceverai un link per resettare la password' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Errore durante la richiesta reset password' });
  }
};

/**
 * Reset password: usa token per resettare password
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token e password richiesti' });
    }

    // Verifica token nel DB
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return res.status(400).json({ error: 'Token non valido' });
    }

    // Verifica che non sia già stato usato
    if (resetToken.used) {
      return res.status(400).json({ error: 'Token già utilizzato' });
    }

    // Verifica che non sia scaduto
    if (new Date() > resetToken.expiresAt) {
      return res.status(400).json({ error: 'Token scaduto' });
    }

    // Aggiorna password
    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Marca token come usato
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    // Revoca tutti i refresh token dell'utente per sicurezza
    await prisma.refreshToken.updateMany({
      where: {
        userId: resetToken.userId,
        revoked: false,
      },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });

    res.json({ message: 'Password resettata con successo' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Errore durante il reset password' });
  }
};

