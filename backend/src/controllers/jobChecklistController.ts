import { Request, Response } from 'express';
import prisma from '../config/database';

export const startJobChecklist = async (req: Request, res: Response) => {
  try {
    const { id, checklistId } = req.params;
    const companyId = req.companyId!;
    const userId = req.user!.userId;

    const job = await prisma.job.findFirst({
      where: { id, companyId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Lavoro non trovato' });
    }

    const checklist = await prisma.checklist.findFirst({
      where: { id: checklistId, companyId },
    });

    if (!checklist) {
      return res.status(404).json({ error: 'Checklist non trovata' });
    }

    // Verifica se esiste già
    const existing = await prisma.jobChecklist.findFirst({
      where: {
        jobId: id,
        checklistId,
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Checklist già avviata per questo lavoro' });
    }

    const jobChecklist = await prisma.jobChecklist.create({
      data: {
        jobId: id,
        checklistId,
        compilataDa: userId,
      },
      include: {
        checklist: {
          include: {
            items: {
              orderBy: { ordine: 'asc' },
            },
          },
        },
      },
    });

    res.status(201).json(jobChecklist);
  } catch (error: any) {
    console.error('Start job checklist error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'avvio checklist' });
  }
};

export const saveChecklistResponses = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { responses } = req.body;
    const companyId = req.companyId!;

    const jobChecklist = await prisma.jobChecklist.findFirst({
      where: { id },
      include: {
        job: true,
      },
    });

    if (!jobChecklist || jobChecklist.job.companyId !== companyId) {
      return res.status(404).json({ error: 'Checklist lavoro non trovata' });
    }

    // Elimina risposte esistenti
    await prisma.jobChecklistResponse.deleteMany({
      where: { jobChecklistId: id },
    });

    // Crea nuove risposte
    const createdResponses = await prisma.jobChecklistResponse.createMany({
      data: responses.map((r: any) => ({
        jobChecklistId: id,
        checklistItemId: r.checklistItemId,
        valoreTesto: r.valoreTesto || null,
        valoreNumero: r.valoreNumero ? parseFloat(r.valoreNumero) : null,
        valoreBoolean: r.valoreBoolean !== undefined ? r.valoreBoolean : null,
        note: r.note || null,
      })),
    });

    const updated = await prisma.jobChecklist.findUnique({
      where: { id },
      include: {
        checklist: {
          include: {
            items: {
              orderBy: { ordine: 'asc' },
            },
          },
        },
        responses: {
          include: {
            checklistItem: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Save checklist responses error:', error);
    res.status(500).json({ error: error.message || 'Errore nel salvataggio risposte' });
  }
};

