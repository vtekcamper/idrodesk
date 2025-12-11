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
      const date = new Date(data as string);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      where.dataProgrammata = {
        gte: date,
        lt: nextDay,
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

