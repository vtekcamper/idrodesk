import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { SubscriptionStatus } from '@prisma/client';

/**
 * Middleware per bloccare accesso se subscription status è DELETED o SUSPENDED
 * Da applicare a tutte le route tenant (non super admin)
 */
export const enforceSubscriptionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Super admin bypassa
    if (req.user?.isSuperAdmin) {
      return next();
    }

    // Se non c'è companyId, non è una richiesta tenant
    if (!req.companyId) {
      return next();
    }

    // Verifica subscription status
    const company = await prisma.company.findUnique({
      where: { id: req.companyId },
      select: {
        subscriptionStatus: true,
        ragioneSociale: true,
      },
    });

    if (!company) {
      return res.status(404).json({ error: 'Azienda non trovata' });
    }

    // Blocca se DELETED
    if (company.subscriptionStatus === SubscriptionStatus.DELETED) {
      return res.status(403).json({
        error: 'Account eliminato. Contatta il supporto per maggiori informazioni.',
        code: 'ACCOUNT_DELETED',
      });
    }

    // Blocca se SUSPENDED (tranne pagine consentite)
    if (company.subscriptionStatus === SubscriptionStatus.SUSPENDED) {
      // Permetti solo route di billing/support
      const allowedPaths = ['/api/company/billing', '/api/company/settings', '/api/auth/logout'];
      const isAllowed = allowedPaths.some(path => req.path.startsWith(path));

      if (!isAllowed) {
        return res.status(403).json({
          error: 'Account sospeso. Rinnova l\'abbonamento per continuare a usare il servizio.',
          code: 'ACCOUNT_SUSPENDED',
          companyName: company.ragioneSociale,
        });
      }
    }

    // PAST_DUE: warning ma permette accesso (gestito da UI)
    // ACTIVE/TRIAL: ok

    next();
  } catch (error: any) {
    console.error('Subscription enforcement error:', error);
    res.status(500).json({ error: 'Errore nel controllo abbonamento' });
  }
};

