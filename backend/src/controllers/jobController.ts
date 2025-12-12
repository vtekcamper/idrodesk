import { Request, Response } from 'express';
import prisma from '../config/database';

export const getJobs = async (req: Request, res: Response) => {
  try {
    const { stato, assegnatoA, data } = req.query;
    const companyId = req.companyId!;

    const where: any = { companyId };

    if (stato) {
      where.stato = stato;
    }

    if (assegnatoA) {
      where.assegnatoA = assegnatoA;
    }

    if (data) {
      // Gestione corretta timezone: crea range per l'intera giornata in UTC
      const dateStr = data as string; // YYYY-MM-DD
      const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
      const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

      where.dataProgrammata = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            telefono: true,
          },
        },
        site: {
          select: {
            id: true,
            descrizione: true,
            indirizzo: true,
          },
        },
        tecnico: {
          select: {
            id: true,
            nome: true,
            cognome: true,
          },
        },
        _count: {
          select: {
            materials: true,
            attachments: true,
            checklists: true,
          },
        },
      },
      orderBy: [
        { dataProgrammata: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(jobs);
  } catch (error: any) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero lavori' });
  }
};

export const getJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;

    const job = await prisma.job.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        site: true,
        tecnico: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            telefono: true,
          },
        },
        quote: {
          include: {
            items: true,
          },
        },
        materials: {
          include: {
            material: true,
          },
        },
        checklists: {
          include: {
            checklist: {
              include: {
                items: true,
              },
            },
            responses: {
              include: {
                checklistItem: true,
              },
            },
            compilatore: {
              select: {
                id: true,
                nome: true,
                cognome: true,
              },
            },
          },
        },
        attachments: {
          include: {
            uploader: {
              select: {
                id: true,
                nome: true,
                cognome: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Lavoro non trovato' });
    }

    res.json(job);
  } catch (error: any) {
    console.error('Get job error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero lavoro' });
  }
};

export const createJob = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;
    const {
      clientId,
      siteId,
      titolo,
      descrizione,
      priorita,
      dataProgrammata,
      oraProgrammata,
      durataPrevistaMinuti,
      assegnatoA,
    } = req.body;

    // Verifica che il cliente appartenga alla company
    const client = await prisma.client.findFirst({
      where: { id: clientId, companyId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }

    const job = await prisma.job.create({
      data: {
        companyId,
        clientId,
        siteId: siteId || null,
        titolo,
        descrizione,
        priorita: priorita || 'NORMALE',
        dataProgrammata: dataProgrammata ? new Date(dataProgrammata) : null,
        oraProgrammata,
        durataPrevistaMinuti,
        assegnatoA: assegnatoA || null,
      },
      include: {
        client: true,
        site: true,
        tecnico: true,
      },
    });

    res.status(201).json(job);
  } catch (error: any) {
    console.error('Create job error:', error);
    res.status(500).json({ error: error.message || 'Errore nella creazione lavoro' });
  }
};

export const updateJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const {
      clientId,
      siteId,
      titolo,
      descrizione,
      stato,
      priorita,
      dataProgrammata,
      oraProgrammata,
      durataPrevistaMinuti,
      assegnatoA,
    } = req.body;

    const job = await prisma.job.findFirst({
      where: { id, companyId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Lavoro non trovato' });
    }

    // Se lo stato diventa COMPLETATO, imposta completedAt
    const updateData: any = {
      ...(clientId && { clientId }),
      ...(siteId !== undefined && { siteId: siteId || null }),
      ...(titolo && { titolo }),
      ...(descrizione !== undefined && { descrizione }),
      ...(stato && { stato }),
      ...(priorita && { priorita }),
      ...(dataProgrammata !== undefined && { dataProgrammata: dataProgrammata ? new Date(dataProgrammata) : null }),
      ...(oraProgrammata !== undefined && { oraProgrammata }),
      ...(durataPrevistaMinuti !== undefined && { durataPrevistaMinuti }),
      ...(assegnatoA !== undefined && { assegnatoA: assegnatoA || null }),
    };

    if (stato === 'COMPLETATO' && job.stato !== 'COMPLETATO') {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        site: true,
        tecnico: true,
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update job error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'aggiornamento lavoro' });
  }
};

// Nuovo endpoint: Avvia intervento
export const startJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;

    const job = await prisma.job.findFirst({
      where: { id, companyId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Intervento non trovato' });
    }

    if (job.stato === 'COMPLETATO' || job.stato === 'FATTURATO') {
      return res.status(400).json({ error: 'Non puoi avviare un intervento già completato o fatturato' });
    }

    const updated = await prisma.job.update({
      where: { id },
      data: {
        stato: 'IN_CORSO',
        // Nota: se serve timestamp start, aggiungere campo startedAt al modello
      },
      include: {
        client: true,
        site: true,
        tecnico: true,
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Start job error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'avvio intervento' });
  }
};

// Nuovo endpoint: Completa intervento
export const completeJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;

    const job = await prisma.job.findFirst({
      where: { id, companyId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Intervento non trovato' });
    }

    if (job.stato !== 'IN_CORSO' && job.stato !== 'PIANIFICATO') {
      return res.status(400).json({ error: 'Puoi completare solo interventi in corso o pianificati' });
    }

    const updated = await prisma.job.update({
      where: { id },
      data: {
        stato: 'COMPLETATO',
        completedAt: new Date(),
      },
      include: {
        client: true,
        site: true,
        tecnico: true,
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Complete job error:', error);
    res.status(500).json({ error: error.message || 'Errore nel completamento intervento' });
  }
};

// Nuovo endpoint: Dashboard stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Interventi oggi
    const todayCount = await prisma.job.count({
      where: {
        companyId,
        dataProgrammata: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Interventi in corso
    const inProgressCount = await prisma.job.count({
      where: {
        companyId,
        stato: 'IN_CORSO',
      },
    });

    // Interventi pianificati
    const plannedCount = await prisma.job.count({
      where: {
        companyId,
        stato: 'PIANIFICATO',
      },
    });

    // Prossimi 7 giorni
    const upcomingCount = await prisma.job.count({
      where: {
        companyId,
        dataProgrammata: {
          gte: today,
          lte: nextWeek,
        },
        stato: {
          in: ['PIANIFICATO', 'IN_CORSO'],
        },
      },
    });

    // Da chiudere: completati senza rapporto (checklist)
    const completedWithoutReport = await prisma.job.count({
      where: {
        companyId,
        stato: 'COMPLETATO',
        checklists: {
          none: {},
        },
      },
    });

    // Preventivi in attesa
    const pendingQuotes = await prisma.quote.count({
      where: {
        companyId,
        stato: 'INVIATO',
      },
    });

    // Interventi completati non fatturati
    const completedNotInvoiced = await prisma.job.count({
      where: {
        companyId,
        stato: 'COMPLETATO',
      },
    });

    res.json({
      today: todayCount,
      inProgress: inProgressCount,
      planned: plannedCount,
      upcoming: upcomingCount,
      toClose: {
        withoutReport: completedWithoutReport,
        pendingQuotes,
        notInvoiced: completedNotInvoiced,
        total: completedWithoutReport + pendingQuotes + completedNotInvoiced,
      },
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero statistiche' });
  }
};

// Nuovo endpoint: Interventi oggi
export const getTodayJobs = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const jobs = await prisma.job.findMany({
      where: {
        companyId,
        dataProgrammata: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            telefono: true,
          },
        },
        site: {
          select: {
            id: true,
            descrizione: true,
            indirizzo: true,
          },
        },
        tecnico: {
          select: {
            id: true,
            nome: true,
            cognome: true,
          },
        },
      },
      orderBy: [
        { oraProgrammata: 'asc' },
        { dataProgrammata: 'asc' },
      ],
    });

    res.json(jobs);
  } catch (error: any) {
    console.error('Get today jobs error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero interventi di oggi' });
  }
};

// Nuovo endpoint: Prossimi 7 giorni
export const getUpcomingJobs = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const jobs = await prisma.job.findMany({
      where: {
        companyId,
        dataProgrammata: {
          gte: today,
          lte: nextWeek,
        },
        stato: {
          in: ['PIANIFICATO', 'IN_CORSO'],
        },
      },
      include: {
        client: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            telefono: true,
          },
        },
        site: {
          select: {
            id: true,
            descrizione: true,
            indirizzo: true,
          },
        },
        tecnico: {
          select: {
            id: true,
            nome: true,
            cognome: true,
          },
        },
      },
      orderBy: [
        { dataProgrammata: 'asc' },
        { oraProgrammata: 'asc' },
      ],
    });

    res.json(jobs);
  } catch (error: any) {
    console.error('Get upcoming jobs error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero prossimi interventi' });
  }
};

// Nuovo endpoint: Da chiudere
export const getToCloseJobs = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;

    // Interventi completati senza rapporto
    const withoutReport = await prisma.job.findMany({
      where: {
        companyId,
        stato: 'COMPLETATO',
        checklists: {
          none: {},
        },
      },
      include: {
        client: {
          select: {
            id: true,
            nome: true,
            cognome: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
    });

    // Preventivi in attesa
    const pendingQuotes = await prisma.quote.findMany({
      where: {
        companyId,
        stato: 'INVIATO',
      },
      include: {
        client: {
          select: {
            id: true,
            nome: true,
            cognome: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    // Interventi completati non fatturati
    const notInvoiced = await prisma.job.findMany({
      where: {
        companyId,
        stato: 'COMPLETATO',
      },
      include: {
        client: {
          select: {
            id: true,
            nome: true,
            cognome: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
    });

    res.json({
      withoutReport,
      pendingQuotes,
      notInvoiced,
    });
  } catch (error: any) {
    console.error('Get to close jobs error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero interventi da chiudere' });
  }
};

