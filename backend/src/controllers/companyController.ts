import { Request, Response } from 'express';
import prisma from '../config/database';
import { getPlanLimits } from '../config/planLimits';
import { logAuditAction } from '../middleware/auditLog';
import { requestDataExport, getDataExports, downloadDataExport, softDeleteCompany } from './gdprController';

/**
 * Ottiene impostazioni company (tenant)
 */
export const getCompanySettings = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        ragioneSociale: true,
        piva: true,
        indirizzo: true,
        telefono: true,
        email: true,
        logoUrl: true,
        pianoAbbonamento: true,
        abbonamentoAttivo: true,
        subscriptionStatus: true,
        dataScadenza: true,
        createdAt: true,
      },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company non trovata' });
    }

    res.json(company);
  } catch (error: any) {
    console.error('Get company settings error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero impostazioni' });
  }
};

/**
 * Aggiorna impostazioni company
 */
export const updateCompanySettings = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;
    const { ragioneSociale, indirizzo, telefono, email, logoUrl } = req.body;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company non trovata' });
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...(ragioneSociale && { ragioneSociale }),
        ...(indirizzo !== undefined && { indirizzo }),
        ...(telefono !== undefined && { telefono }),
        ...(email !== undefined && { email }),
        ...(logoUrl !== undefined && { logoUrl }),
      },
    });

    // Log audit
    await logAuditAction(req, 'UPDATE_COMPANY_SETTINGS', 'Company', companyId, {
      before: {
        ragioneSociale: company.ragioneSociale,
        indirizzo: company.indirizzo,
        telefono: company.telefono,
        email: company.email,
      },
      after: {
        ragioneSociale: updated.ragioneSociale,
        indirizzo: updated.indirizzo,
        telefono: updated.telefono,
        email: updated.email,
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update company settings error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'aggiornamento impostazioni' });
  }
};

/**
 * Ottiene usage company (limiti e utilizzo)
 */
export const getCompanyUsage = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        pianoAbbonamento: true,
      },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company non trovata' });
    }

    const limits = getPlanLimits(company.pianoAbbonamento);

    // Conta utilizzo corrente
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [users, clients, jobsThisMonth, quotesThisMonth] = await Promise.all([
      prisma.user.count({ where: { companyId } }),
      prisma.client.count({ where: { companyId } }),
      prisma.job.count({
        where: {
          companyId,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.quote.count({
        where: {
          companyId,
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    res.json({
      limits,
      usage: {
        users: {
          current: users,
          limit: limits.maxUsers,
          percentage: Math.round((users / limits.maxUsers) * 100),
        },
        clients: {
          current: clients,
          limit: limits.maxClients,
          percentage: Math.round((clients / limits.maxClients) * 100),
        },
        jobsThisMonth: {
          current: jobsThisMonth,
          limit: limits.maxJobsPerMonth,
          percentage: Math.round((jobsThisMonth / limits.maxJobsPerMonth) * 100),
        },
        quotesThisMonth: {
          current: quotesThisMonth,
          limit: limits.maxQuotesPerMonth,
          percentage: Math.round((quotesThisMonth / limits.maxQuotesPerMonth) * 100),
        },
      },
    });
  } catch (error: any) {
    console.error('Get company usage error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero usage' });
  }
};

/**
 * Ottiene informazioni billing company
 */
export const getCompanyBilling = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        pianoAbbonamento: true,
        abbonamentoAttivo: true,
        subscriptionStatus: true,
        dataScadenza: true,
        subscriptionHistory: {
          orderBy: { dataCambio: 'desc' },
          take: 10,
        },
      },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company non trovata' });
    }

    // Calcola giorni rimanenti
    let daysRemaining: number | null = null;
    if (company.dataScadenza) {
      const now = new Date();
      const expiry = new Date(company.dataScadenza);
      daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    res.json({
      plan: company.pianoAbbonamento,
      active: company.abbonamentoAttivo,
      status: company.subscriptionStatus,
      expiryDate: company.dataScadenza,
      daysRemaining,
      history: company.subscriptionHistory,
    });
  } catch (error: any) {
    console.error('Get company billing error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero billing' });
  }
};

/**
 * Ottiene storico pagamenti company
 */
export const getCompanyPayments = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          subscriptionHistory: {
            select: {
              pianoPrecedente: true,
              pianoNuovo: true,
              dataCambio: true,
            },
          },
        },
      }),
      prisma.payment.count({ where: { companyId } }),
    ]);

    res.json({
      payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get company payments error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero pagamenti' });
  }
};

// Re-export GDPR functions
export { requestDataExport, getDataExports, downloadDataExport, softDeleteCompany };

