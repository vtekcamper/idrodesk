import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { getPlanLimits, isWithinLimit } from '../config/planLimits';

/**
 * Middleware per verificare i limiti del piano abbonamento
 */
export const checkPlanLimits = (checkType: 'users' | 'clients' | 'jobs' | 'quotes' | 'storage') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Super admin bypassa i limiti
      if (req.user?.isSuperAdmin) {
        return next();
      }

      if (!req.companyId) {
        return res.status(401).json({ error: 'Non autenticato' });
      }

      const company = await prisma.company.findUnique({
        where: { id: req.companyId },
      });

      if (!company) {
        return res.status(404).json({ error: 'Azienda non trovata' });
      }

      // Se l'abbonamento non è attivo, blocca tutto tranne il piano ELITE
      if (!company.abbonamentoAttivo && company.pianoAbbonamento !== 'ELITE') {
        return res.status(403).json({
          error: 'Abbonamento scaduto. Rinnova per continuare a usare il servizio.',
          code: 'SUBSCRIPTION_EXPIRED',
        });
      }

      const limits = getPlanLimits(company.pianoAbbonamento);
      let current = 0;
      let limit = 0;

      switch (checkType) {
        case 'users':
          current = await prisma.user.count({
            where: { companyId: req.companyId, attivo: true },
          });
          limit = limits.maxUsers;
          break;

        case 'clients':
          current = await prisma.client.count({
            where: { companyId: req.companyId },
          });
          limit = limits.maxClients;
          break;

        case 'jobs':
          // Conta lavori del mese corrente
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          
          current = await prisma.job.count({
            where: {
              companyId: req.companyId,
              createdAt: { gte: startOfMonth },
            },
          });
          limit = limits.maxJobsPerMonth;
          break;

        case 'quotes':
          // Conta preventivi del mese corrente
          const startOfMonthQuotes = new Date();
          startOfMonthQuotes.setDate(1);
          startOfMonthQuotes.setHours(0, 0, 0, 0);
          
          current = await prisma.quote.count({
            where: {
              companyId: req.companyId,
              createdAt: { gte: startOfMonthQuotes },
            },
          });
          limit = limits.maxQuotesPerMonth;
          break;

        case 'storage':
          // TODO: Implementare calcolo storage reale
          // Per ora sempre OK
          return next();
      }

      if (!isWithinLimit(current, limit)) {
        return res.status(403).json({
          error: `Limite ${checkType} raggiunto per il piano ${company.pianoAbbonamento}. Passa a un piano superiore per continuare.`,
          code: 'LIMIT_EXCEEDED',
          current,
          limit,
          plan: company.pianoAbbonamento,
        });
      }

      next();
    } catch (error: any) {
      console.error('Plan limits check error:', error);
      res.status(500).json({ error: 'Errore nel controllo limiti' });
    }
  };
};

