import { Request, Response } from 'express';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export const addJobMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const {
      materialId,
      descrizione,
      quantita,
      prezzoUnitario,
      scontoPercentuale,
    } = req.body;

    const job = await prisma.job.findFirst({
      where: { id, companyId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Lavoro non trovato' });
    }

    // Se materialId è fornito, usa i dati del materiale
    let prezzo = prezzoUnitario;
    if (materialId && !prezzoUnitario) {
      const material = await prisma.material.findFirst({
        where: { id: materialId, companyId },
      });

      if (material) {
        prezzo = Number(material.prezzoVendita);
      }
    }

    const quantitaNum = Number(quantita || 1);
    const prezzoNum = Number(prezzo || 0);
    const sconto = Number(scontoPercentuale || 0) / 100;
    const totale = quantitaNum * prezzoNum * (1 - sconto);

    const jobMaterial = await prisma.jobMaterial.create({
      data: {
        jobId: id,
        materialId: materialId || null,
        descrizione,
        quantita: new Prisma.Decimal(quantitaNum),
        prezzoUnitario: new Prisma.Decimal(prezzoNum),
        scontoPercentuale: new Prisma.Decimal(scontoPercentuale || 0),
        totale: new Prisma.Decimal(totale),
      },
      include: {
        material: true,
      },
    });

    res.status(201).json(jobMaterial);
  } catch (error: any) {
    console.error('Add job material error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'aggiunta materiale' });
  }
};

export const deleteJobMaterial = async (req: Request, res: Response) => {
  try {
    const { id, jobMaterialId } = req.params;
    const companyId = req.companyId!;

    const job = await prisma.job.findFirst({
      where: { id, companyId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Lavoro non trovato' });
    }

    const jobMaterial = await prisma.jobMaterial.findFirst({
      where: {
        id: jobMaterialId,
        jobId: id,
      },
    });

    if (!jobMaterial) {
      return res.status(404).json({ error: 'Materiale non trovato' });
    }

    await prisma.jobMaterial.delete({
      where: { id: jobMaterialId },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete job material error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'eliminazione materiale' });
  }
};

