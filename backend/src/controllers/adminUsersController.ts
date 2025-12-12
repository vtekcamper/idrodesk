import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Ottiene tutti gli utenti di tutte le aziende (solo super admin)
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { search, ruolo, attivo, companyId } = req.query;

    const where: any = {
      isSuperAdmin: false, // Escludi super admin dalla lista
    };

    if (search) {
      where.OR = [
        { nome: { contains: search as string, mode: 'insensitive' } },
        { cognome: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (ruolo) {
      where.ruolo = ruolo;
    }

    if (attivo !== undefined) {
      where.attivo = attivo === 'true';
    }

    if (companyId) {
      where.companyId = companyId;
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            ragioneSociale: true,
            pianoAbbonamento: true,
            abbonamentoAttivo: true,
          },
        },
        _count: {
          select: {
            jobsAssegnati: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error: any) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero utenti' });
  }
};

/**
 * Ottiene dettagli di un singolo utente
 */
export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            ragioneSociale: true,
            pianoAbbonamento: true,
            abbonamentoAttivo: true,
          },
        },
        jobsAssegnati: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            titolo: true,
            stato: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            jobsAssegnati: true,
            jobChecklists: true,
            attachments: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero utente' });
  }
};

/**
 * Aggiorna un utente (solo super admin)
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, cognome, email, telefono, ruolo, attivo } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    if (user.isSuperAdmin) {
      return res.status(403).json({ error: 'Non puoi modificare un super admin' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(cognome && { cognome }),
        ...(email && { email }),
        ...(telefono !== undefined && { telefono }),
        ...(ruolo && { ruolo }),
        ...(attivo !== undefined && { attivo }),
      },
      include: {
        company: {
          select: {
            id: true,
            ragioneSociale: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'aggiornamento utente' });
  }
};

/**
 * Disattiva/attiva un utente
 */
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { attivo } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    if (user.isSuperAdmin) {
      return res.status(403).json({ error: 'Non puoi modificare un super admin' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { attivo },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: error.message || 'Errore nella modifica stato utente' });
  }
};

