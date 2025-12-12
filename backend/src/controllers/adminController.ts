import { Request, Response } from 'express';
import prisma from '../config/database';
import { getPlanLimits } from '../config/planLimits';
import { calculateSubscriptionStatus, updateCompanySubscriptionStatus } from '../utils/subscriptionState';
import { logAuditAction } from '../middleware/auditLog';

/**
 * Ottiene tutte le aziende (solo super admin)
 */
export const getAllCompanies = async (req: Request, res: Response) => {
  try {
    const { search, piano, attivo } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { ragioneSociale: { contains: search as string, mode: 'insensitive' } },
        { piva: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (piano) {
      where.pianoAbbonamento = piano;
    }

    if (attivo !== undefined) {
      where.abbonamentoAttivo = attivo === 'true';
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            jobs: true,
            quotes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Aggiungi statistiche uso per ogni azienda
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const limits = getPlanLimits(company.pianoAbbonamento);
        
        // Conta lavori del mese corrente
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const jobsThisMonth = await prisma.job.count({
          where: {
            companyId: company.id,
            createdAt: { gte: startOfMonth },
          },
        });

        const quotesThisMonth = await prisma.quote.count({
          where: {
            companyId: company.id,
            createdAt: { gte: startOfMonth },
          },
        });

        // Calcola subscription status se non presente
        const subscriptionStatus = company.subscriptionStatus || 
          calculateSubscriptionStatus(
            company.dataScadenza,
            company.abbonamentoAttivo,
            company.pianoAbbonamento,
            company.deletedAt
          );

        return {
          ...company,
          subscriptionStatus,
          usage: {
            users: {
              current: company._count.users,
              limit: limits.maxUsers,
            },
            clients: {
              current: company._count.clients,
              limit: limits.maxClients,
            },
            jobsThisMonth: {
              current: jobsThisMonth,
              limit: limits.maxJobsPerMonth,
            },
            quotesThisMonth: {
              current: quotesThisMonth,
              limit: limits.maxQuotesPerMonth,
            },
          },
        };
      })
    );

    res.json(companiesWithStats);
  } catch (error: any) {
    console.error('Get all companies error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero aziende' });
  }
};

/**
 * Ottiene dettagli di una singola azienda
 */
export const getCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            email: true,
            ruolo: true,
            attivo: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            clients: true,
            jobs: true,
            quotes: true,
            materials: true,
            checklists: true,
          },
        },
        subscriptionHistory: {
          orderBy: { dataCambio: 'desc' },
          take: 10,
        },
      },
    });

    if (!company) {
      return res.status(404).json({ error: 'Azienda non trovata' });
    }

    const limits = getPlanLimits(company.pianoAbbonamento);

    // Calcola subscription status se non presente
    const subscriptionStatus = company.subscriptionStatus || 
      calculateSubscriptionStatus(
        company.dataScadenza,
        company.abbonamentoAttivo,
        company.pianoAbbonamento,
        company.deletedAt
      );

    res.json({
      ...company,
      subscriptionStatus,
      limits,
    });
  } catch (error: any) {
    console.error('Get company error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero azienda' });
  }
};

/**
 * Aggiorna piano abbonamento di un'azienda
 */
export const updateCompanyPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pianoAbbonamento, abbonamentoAttivo, dataScadenza, motivo } = req.body;
    const adminId = req.user!.userId;

    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return res.status(404).json({ error: 'Azienda non trovata' });
    }

    // Crea record nella history
    await prisma.subscriptionHistory.create({
      data: {
        companyId: id,
        pianoPrecedente: company.pianoAbbonamento,
        pianoNuovo: pianoAbbonamento,
        cambiatoDa: adminId,
        motivo: motivo || 'Cambio piano da admin',
      },
    });

    // Aggiorna azienda
    const updated = await prisma.company.update({
      where: { id },
      data: {
        pianoAbbonamento,
        ...(abbonamentoAttivo !== undefined && { abbonamentoAttivo }),
        ...(dataScadenza && { dataScadenza: new Date(dataScadenza) }),
      },
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            jobs: true,
            quotes: true,
          },
        },
      },
    });

    // Ricalcola e aggiorna subscription status
    const newStatus = await updateCompanySubscriptionStatus(prisma, id);

    // Log audit
    await logAuditAction(req, 'CHANGE_PLAN', 'Company', id, {
      before: {
        pianoAbbonamento: company.pianoAbbonamento,
        abbonamentoAttivo: company.abbonamentoAttivo,
        dataScadenza: company.dataScadenza,
      },
      after: {
        pianoAbbonamento: updated.pianoAbbonamento,
        abbonamentoAttivo: updated.abbonamentoAttivo,
        dataScadenza: updated.dataScadenza,
        subscriptionStatus: newStatus,
      },
      motivo,
    });

    res.json({
      ...updated,
      subscriptionStatus: newStatus,
    });
  } catch (error: any) {
    console.error('Update company plan error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'aggiornamento piano' });
  }
};

/**
 * Disattiva/attiva abbonamento
 */
export const toggleSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { attivo, motivo } = req.body;
    const adminId = req.user!.userId;

    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return res.status(404).json({ error: 'Azienda non trovata' });
    }

    // Se disattiviamo, crea record history
    if (attivo === false && company.abbonamentoAttivo) {
      await prisma.subscriptionHistory.create({
        data: {
          companyId: id,
          pianoPrecedente: company.pianoAbbonamento,
          pianoNuovo: company.pianoAbbonamento,
          cambiatoDa: adminId,
          motivo: motivo || 'Abbonamento disattivato da admin',
        },
      });
    }

    const updated = await prisma.company.update({
      where: { id },
      data: {
        abbonamentoAttivo: attivo,
      },
    });

    // Ricalcola subscription status
    const newStatus = await updateCompanySubscriptionStatus(prisma, id);

    // Log audit
    await logAuditAction(req, 'TOGGLE_SUBSCRIPTION', 'Company', id, {
      before: {
        abbonamentoAttivo: company.abbonamentoAttivo,
        subscriptionStatus: company.subscriptionStatus,
      },
      after: {
        abbonamentoAttivo: updated.abbonamentoAttivo,
        subscriptionStatus: newStatus,
      },
      motivo,
    });

    res.json({
      ...updated,
      subscriptionStatus: newStatus,
    });
  } catch (error: any) {
    console.error('Toggle subscription error:', error);
    res.status(500).json({ error: error.message || 'Errore nella modifica abbonamento' });
  }
};

/**
 * Ottiene statistiche globali del sistema
 */
export const getSystemStats = async (req: Request, res: Response) => {
  try {
    const [
      totalCompanies,
      activeCompanies,
      totalUsers,
      totalClients,
      totalJobs,
      totalQuotes,
      companiesByPlan,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { abbonamentoAttivo: true } }),
      prisma.user.count({ where: { isSuperAdmin: false } }),
      prisma.client.count(),
      prisma.job.count(),
      prisma.quote.count(),
      prisma.company.groupBy({
        by: ['pianoAbbonamento'],
        _count: { id: true },
      }),
    ]);

    // Aziende create questo mese
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newCompaniesThisMonth = await prisma.company.count({
      where: {
        createdAt: { gte: startOfMonth },
      },
    });

    res.json({
      companies: {
        total: totalCompanies,
        active: activeCompanies,
        inactive: totalCompanies - activeCompanies,
        newThisMonth: newCompaniesThisMonth,
        byPlan: companiesByPlan.reduce((acc, item) => {
          acc[item.pianoAbbonamento] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
      },
      users: {
        total: totalUsers,
      },
      data: {
        clients: totalClients,
        jobs: totalJobs,
        quotes: totalQuotes,
      },
    });
  } catch (error: any) {
    console.error('Get system stats error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero statistiche' });
  }
};


