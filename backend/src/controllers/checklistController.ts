import { Request, Response } from 'express';
import prisma from '../config/database';

export const getChecklists = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;

    const checklists = await prisma.checklist.findMany({
      where: { companyId },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    res.json(checklists);
  } catch (error: any) {
    console.error('Get checklists error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero checklist' });
  }
};

export const getChecklist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;

    const checklist = await prisma.checklist.findFirst({
      where: { id, companyId },
      include: {
        items: {
          orderBy: { ordine: 'asc' },
        },
      },
    });

    if (!checklist) {
      return res.status(404).json({ error: 'Checklist non trovata' });
    }

    res.json(checklist);
  } catch (error: any) {
    console.error('Get checklist error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero checklist' });
  }
};

export const createChecklist = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;
    const {
      nome,
      descrizione,
      tipoIntervento,
      items,
    } = req.body;

    const checklist = await prisma.checklist.create({
      data: {
        companyId,
        nome,
        descrizione,
        tipoIntervento,
        items: {
          create: items.map((item: any, index: number) => ({
            ordine: item.ordine !== undefined ? item.ordine : index + 1,
            descrizione: item.descrizione,
            tipoCampo: item.tipoCampo || 'CHECKBOX',
          })),
        },
      },
      include: {
        items: {
          orderBy: { ordine: 'asc' },
        },
      },
    });

    res.status(201).json(checklist);
  } catch (error: any) {
    console.error('Create checklist error:', error);
    res.status(500).json({ error: error.message || 'Errore nella creazione checklist' });
  }
};

