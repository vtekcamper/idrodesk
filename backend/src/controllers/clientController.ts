import { Request, Response } from 'express';
import prisma from '../config/database';

export const getClients = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const companyId = req.companyId!;

    const where: any = { companyId };

    if (search) {
      where.OR = [
        { nome: { contains: search as string, mode: 'insensitive' } },
        { cognome: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { telefono: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            quotes: true,
            jobs: true,
          },
        },
      },
    });

    res.json(clients);
  } catch (error: any) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero clienti' });
  }
};

export const getClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;

    const client = await prisma.client.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        sites: true,
        quotes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }

    res.json(client);
  } catch (error: any) {
    console.error('Get client error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero cliente' });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;
    const {
      nome,
      cognome,
      indirizzo,
      citta,
      cap,
      telefono,
      email,
      note,
    } = req.body;

    const client = await prisma.client.create({
      data: {
        companyId,
        nome,
        cognome,
        indirizzo,
        citta,
        cap,
        telefono,
        email,
        note,
      },
    });

    res.status(201).json(client);
  } catch (error: any) {
    console.error('Create client error:', error);
    res.status(500).json({ error: error.message || 'Errore nella creazione cliente' });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const {
      nome,
      cognome,
      indirizzo,
      citta,
      cap,
      telefono,
      email,
      note,
    } = req.body;

    const client = await prisma.client.findFirst({
      where: { id, companyId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        nome,
        cognome,
        indirizzo,
        citta,
        cap,
        telefono,
        email,
        note,
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update client error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'aggiornamento cliente' });
  }
};

