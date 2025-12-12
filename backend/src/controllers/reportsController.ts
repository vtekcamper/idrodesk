import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Report avanzati per super admin
 */
export const getAdvancedReports = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, companyId } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const where: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    if (companyId) {
      where.companyId = companyId;
    }

    // Statistiche generali
    const [
      totalRevenue,
      totalPayments,
      activeSubscriptions,
      expiringSubscriptions,
      newCompanies,
      newUsers,
      totalJobs,
      totalQuotes,
      revenueByPlan,
      companiesByPlan,
    ] = await Promise.all([
      // Revenue totale
      prisma.payment.aggregate({
        where: {
          ...where,
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      }),

      // Totale pagamenti
      prisma.payment.count({
        where: {
          ...where,
          status: 'COMPLETED',
        },
      }),

      // Abbonamenti attivi
      prisma.company.count({
        where: {
          abbonamentoAttivo: true,
        },
      }),

      // Abbonamenti in scadenza (prossimi 7 giorni)
      prisma.company.count({
        where: {
          abbonamentoAttivo: true,
          dataScadenza: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Nuove aziende nel periodo
      prisma.company.count({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      }),

      // Nuovi utenti nel periodo
      prisma.user.count({
        where: {
          ...where,
          isSuperAdmin: false,
        },
      }),

      // Totale lavori
      prisma.job.count({
        where: companyId ? { companyId: companyId as string } : {},
      }),

      // Totale preventivi
      prisma.quote.count({
        where: companyId ? { companyId: companyId as string } : {},
      }),

      // Revenue per provider
      prisma.payment.groupBy({
        by: ['paymentProvider'],
        where: {
          ...where,
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      }),

      // Aziende per piano
      prisma.company.groupBy({
        by: ['pianoAbbonamento'],
        _count: {
          id: true,
        },
      }),
    ]);

    // Statistiche mensili (ultimi 12 mesi)
    const monthlyStats = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const [revenue, companies, users] = await Promise.all([
        prisma.payment.aggregate({
          where: {
            status: 'COMPLETED',
            createdAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          _sum: {
            amount: true,
          },
        }),
        prisma.company.count({
          where: {
            createdAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        }),
        prisma.user.count({
          where: {
            isSuperAdmin: false,
            createdAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        }),
      ]);

      monthlyStats.push({
        month: monthStart.toISOString().substring(0, 7),
        revenue: revenue._sum.amount || 0,
        companies,
        users,
      });
    }

    res.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        payments: totalPayments,
        byProvider: revenueByPlan,
      },
      subscriptions: {
        active: activeSubscriptions,
        expiring: expiringSubscriptions,
        byPlan: companiesByPlan.reduce((acc, item) => {
          acc[item.pianoAbbonamento] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
      },
      growth: {
        newCompanies,
        newUsers,
      },
      activity: {
        jobs: totalJobs,
        quotes: totalQuotes,
      },
      monthly: monthlyStats,
    });
  } catch (error: any) {
    console.error('Get advanced reports error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero report' });
  }
};

/**
 * Report abbonamenti in scadenza
 */
export const getExpiringSubscriptions = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days as string);

    const expiryDate = new Date(Date.now() + daysNum * 24 * 60 * 60 * 1000);

    const companies = await prisma.company.findMany({
      where: {
        abbonamentoAttivo: true,
        dataScadenza: {
          lte: expiryDate,
          gte: new Date(),
        },
      },
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            jobs: true,
          },
        },
      },
      orderBy: {
        dataScadenza: 'asc',
      },
    });

    res.json(companies);
  } catch (error: any) {
    console.error('Get expiring subscriptions error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero abbonamenti in scadenza' });
  }
};

/**
 * Report top aziende per attività
 */
export const getTopCompanies = async (req: Request, res: Response) => {
  try {
    const { limit = 10, metric = 'jobs' } = req.query;
    const limitNum = parseInt(limit as string);

    let orderBy: any = {};

    if (metric === 'jobs') {
      orderBy = {
        jobs: {
          _count: 'desc',
        },
      };
    } else if (metric === 'clients') {
      orderBy = {
        clients: {
          _count: 'desc',
        },
      };
    } else if (metric === 'revenue') {
      // Ordina per revenue totale
      const companies = await prisma.company.findMany({
        include: {
          _count: {
            select: {
              jobs: true,
              clients: true,
            },
          },
          payments: {
            where: {
              status: 'COMPLETED',
            },
            _sum: {
              amount: true,
            },
          },
        },
      });

      const sorted = companies
        .map((c) => ({
          ...c,
          totalRevenue: c.payments._sum.amount || 0,
        }))
        .sort((a, b) => Number(b.totalRevenue) - Number(a.totalRevenue))
        .slice(0, limitNum);

      return res.json(sorted);
    }

    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            jobs: true,
            clients: true,
            users: true,
          },
        },
      },
      orderBy,
      take: limitNum,
    });

    res.json(companies);
  } catch (error: any) {
    console.error('Get top companies error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero top aziende' });
  }
};

