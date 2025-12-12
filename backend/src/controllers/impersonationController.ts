import { Request, Response } from 'express';
import prisma from '../config/database';
import { generateAccessToken } from '../utils/jwt';
import { logAuditAction } from '../middleware/auditLog';

/**
 * Impersona un utente tenant (solo super admin)
 */
export const impersonateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = req.user!.userId;

    // Verifica che sia super admin
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({
        error: 'Solo super admin può impersonare utenti',
        code: 'FORBIDDEN',
      });
    }

    // Trova l'utente da impersonare
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          select: {
            id: true,
            ragioneSociale: true,
          },
        },
      },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    // Non permettere di impersonare altri super admin
    if (targetUser.isSuperAdmin) {
      return res.status(403).json({
        error: 'Non puoi impersonare altri super admin',
        code: 'FORBIDDEN',
      });
    }

    // Verifica che l'utente sia attivo
    if (!targetUser.attivo) {
      return res.status(400).json({
        error: 'Utente non attivo',
        code: 'USER_INACTIVE',
      });
    }

    // Verifica che l'utente abbia una company
    if (!targetUser.companyId || !targetUser.company) {
      return res.status(400).json({
        error: 'Utente non associato a nessuna azienda',
        code: 'NO_COMPANY',
      });
    }

    // Genera token temporaneo per impersonation (15 minuti)
    // Usa signToken direttamente per controllare expiration
    const { signToken } = await import('../utils/jwt');
    const impersonationToken = signToken({
      userId: targetUser.id,
      companyId: targetUser.companyId,
      role: targetUser.ruolo,
      email: targetUser.email,
      isSuperAdmin: false,
      isImpersonated: true,
      impersonatedBy: adminId,
    }, '15m'); // 15 minuti

    // Log audit (obbligatorio)
    await logAuditAction(req, 'IMPERSONATE', 'User', targetUser.id, {
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
      targetCompanyId: targetUser.companyId,
      targetCompanyName: targetUser.company.ragioneSociale,
      adminId,
      adminEmail: req.user.email,
    });

    res.json({
      accessToken: impersonationToken,
      user: {
        id: targetUser.id,
        nome: targetUser.nome,
        cognome: targetUser.cognome,
        email: targetUser.email,
        ruolo: targetUser.ruolo,
        companyId: targetUser.companyId,
        company: targetUser.company,
        isImpersonated: true,
        impersonatedBy: adminId,
      },
      expiresIn: 15 * 60, // 15 minuti in secondi
    });
  } catch (error: any) {
    console.error('Impersonate user error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'impersonation' });
  }
};

/**
 * Termina impersonation e ritorna al super admin
 */
export const stopImpersonation = async (req: Request, res: Response) => {
  try {
    const adminId = req.user!.userId;

    // Verifica che sia super admin
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({
        error: 'Solo super admin può terminare impersonation',
        code: 'FORBIDDEN',
      });
    }

    // Trova il super admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || !admin.isSuperAdmin) {
      return res.status(404).json({ error: 'Super admin non trovato' });
    }

    // Genera nuovo token per super admin
    const adminToken = generateAccessToken({
      userId: admin.id,
      companyId: undefined,
      role: admin.ruolo,
      email: admin.email,
      isSuperAdmin: true,
    });

    // Log audit
    await logAuditAction(req, 'STOP_IMPERSONATE', 'User', adminId, {
      adminId,
      adminEmail: admin.email,
    });

    res.json({
      accessToken: adminToken,
      user: {
        id: admin.id,
        nome: admin.nome,
        cognome: admin.cognome,
        email: admin.email,
        isSuperAdmin: true,
      },
    });
  } catch (error: any) {
    console.error('Stop impersonation error:', error);
    res.status(500).json({ error: error.message || 'Errore nella terminazione impersonation' });
  }
};

