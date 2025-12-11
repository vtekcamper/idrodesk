import { Request, Response } from 'express';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export const getMaterials = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const companyId = req.companyId!;

    const where: any = { companyId };

    if (search) {
      where.OR = [
        { codice: { contains: search as string, mode: 'insensitive' } },
        { descrizione: { contains: search as string, mode: 'insensitive' } },
        { categoria: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const materials = await prisma.material.findMany({
      where,
      orderBy: { descrizione: 'asc' },
    });

    res.json(materials);
  } catch (error: any) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero materiali' });
  }
};

export const createMaterial = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;
    const {
      codice,
      descrizione,
      categoria,
      prezzoAcquisto,
      prezzoVendita,
      unita,
      scortaMinima,
      giacenza,
    } = req.body;

    // Verifica che il codice non esista già per questa company
    const existing = await prisma.material.findUnique({
      where: {
        companyId_codice: {
          companyId,
          codice,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Codice materiale già esistente' });
    }

    const material = await prisma.material.create({
      data: {
        companyId,
        codice,
        descrizione,
        categoria,
        prezzoAcquisto: prezzoAcquisto ? new Prisma.Decimal(prezzoAcquisto) : null,
        prezzoVendita: new Prisma.Decimal(prezzoVendita || 0),
        unita: unita || 'pz',
        scortaMinima: scortaMinima || 0,
        giacenza: giacenza || 0,
      },
    });

    res.status(201).json(material);
  } catch (error: any) {
    console.error('Create material error:', error);
    res.status(500).json({ error: error.message || 'Errore nella creazione materiale' });
  }
};

export const updateMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const {
      codice,
      descrizione,
      categoria,
      prezzoAcquisto,
      prezzoVendita,
      unita,
      scortaMinima,
      giacenza,
    } = req.body;

    const material = await prisma.material.findFirst({
      where: { id, companyId },
    });

    if (!material) {
      return res.status(404).json({ error: 'Materiale non trovato' });
    }

    // Se cambia il codice, verifica che non esista già
    if (codice && codice !== material.codice) {
      const existing = await prisma.material.findUnique({
        where: {
          companyId_codice: {
            companyId,
            codice,
          },
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Codice materiale già esistente' });
      }
    }

    const updated = await prisma.material.update({
      where: { id },
      data: {
        ...(codice && { codice }),
        ...(descrizione && { descrizione }),
        ...(categoria !== undefined && { categoria }),
        ...(prezzoAcquisto !== undefined && { prezzoAcquisto: prezzoAcquisto ? new Prisma.Decimal(prezzoAcquisto) : null }),
        ...(prezzoVendita !== undefined && { prezzoVendita: new Prisma.Decimal(prezzoVendita) }),
        ...(unita && { unita }),
        ...(scortaMinima !== undefined && { scortaMinima }),
        ...(giacenza !== undefined && { giacenza }),
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update material error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'aggiornamento materiale' });
  }
};

