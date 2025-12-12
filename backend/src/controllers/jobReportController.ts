import { Request, Response } from 'express';
import prisma from '../config/database';

// Crea o recupera checklist "Rapporto Intervento" per la company
async function getOrCreateReportChecklist(companyId: string) {
  let checklist = await prisma.checklist.findFirst({
    where: {
      companyId,
      nome: 'Rapporto Intervento',
    },
  });

  if (!checklist) {
    // Crea checklist con campi essenziali
    checklist = await prisma.checklist.create({
      data: {
        companyId,
        nome: 'Rapporto Intervento',
        descrizione: 'Rapporto standard per interventi',
        tipoIntervento: 'RIPARAZIONE',
        items: {
          create: [
            {
              ordine: 1,
              descrizione: 'Lavoro svolto',
              tipoCampo: 'TESTO',
            },
            {
              ordine: 2,
              descrizione: 'Esito intervento',
              tipoCampo: 'SI_NO',
            },
            {
              ordine: 3,
              descrizione: 'Cliente presente',
              tipoCampo: 'CHECKBOX',
            },
            {
              ordine: 4,
              descrizione: 'Tempo impiegato (minuti)',
              tipoCampo: 'NUMERO',
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });
  }

  return checklist;
}

// Crea rapporto per un intervento
export const createJobReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { lavoroSvolto, esito, clientePresente, tempoImpiegato, note } = req.body;
    const companyId = req.companyId!;
    const userId = req.user!.userId;

    const job = await prisma.job.findFirst({
      where: { id, companyId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Intervento non trovato' });
    }

    if (job.stato !== 'COMPLETATO') {
      return res.status(400).json({ error: 'Puoi creare un rapporto solo per interventi completati' });
    }

    // Verifica se esiste già un rapporto
    const existingReport = await prisma.jobChecklist.findFirst({
      where: {
        jobId: id,
        checklist: {
          nome: 'Rapporto Intervento',
        },
      },
    });

    if (existingReport) {
      return res.status(400).json({ error: 'Rapporto già esistente per questo intervento' });
    }

    // Crea o recupera checklist
    const checklist = await getOrCreateReportChecklist(companyId);

    // Crea JobChecklist
    const jobChecklist = await prisma.jobChecklist.create({
      data: {
        jobId: id,
        checklistId: checklist.id,
        compilataDa: userId,
        responses: {
          create: [
            // Lavoro svolto
            {
              checklistItemId: checklist.items.find((i) => i.ordine === 1)!.id,
              valoreTesto: lavoroSvolto || '',
            },
            // Esito
            {
              checklistItemId: checklist.items.find((i) => i.ordine === 2)!.id,
              valoreBoolean: esito === 'RISOLTO',
            },
            // Cliente presente
            {
              checklistItemId: checklist.items.find((i) => i.ordine === 3)!.id,
              valoreBoolean: clientePresente || false,
            },
            // Tempo impiegato
            {
              checklistItemId: checklist.items.find((i) => i.ordine === 4)!.id,
              valoreNumero: tempoImpiegato ? parseFloat(tempoImpiegato) : null,
            },
          ],
        },
      },
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
      },
    });

    res.status(201).json(jobChecklist);
  } catch (error: any) {
    console.error('Create job report error:', error);
    res.status(500).json({ error: error.message || 'Errore nella creazione rapporto' });
  }
};

// Aggiorna rapporto esistente
export const updateJobReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { lavoroSvolto, esito, clientePresente, tempoImpiegato, note } = req.body;
    const companyId = req.companyId!;

    const jobChecklist = await prisma.jobChecklist.findFirst({
      where: {
        id,
        job: {
          companyId,
        },
        checklist: {
          nome: 'Rapporto Intervento',
        },
      },
      include: {
        checklist: {
          include: {
            items: true,
          },
        },
        responses: true,
      },
    });

    if (!jobChecklist) {
      return res.status(404).json({ error: 'Rapporto non trovato' });
    }

    // Aggiorna risposte
    const items = jobChecklist.checklist.items;
    const lavoroItem = items.find((i) => i.ordine === 1)!;
    const esitoItem = items.find((i) => i.ordine === 2)!;
    const clienteItem = items.find((i) => i.ordine === 3)!;
    const tempoItem = items.find((i) => i.ordine === 4)!;

    // Elimina risposte esistenti
    await prisma.jobChecklistResponse.deleteMany({
      where: { jobChecklistId: id },
    });

    // Crea nuove risposte
    await prisma.jobChecklistResponse.createMany({
      data: [
        {
          jobChecklistId: id,
          checklistItemId: lavoroItem.id,
          valoreTesto: lavoroSvolto || '',
        },
        {
          jobChecklistId: id,
          checklistItemId: esitoItem.id,
          valoreBoolean: esito === 'RISOLTO',
        },
        {
          jobChecklistId: id,
          checklistItemId: clienteItem.id,
          valoreBoolean: clientePresente || false,
        },
        {
          jobChecklistId: id,
          checklistItemId: tempoItem.id,
          valoreNumero: tempoImpiegato ? parseFloat(tempoImpiegato) : null,
        },
      ],
    });

    const updated = await prisma.jobChecklist.findUnique({
      where: { id },
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
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update job report error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'aggiornamento rapporto' });
  }
};

// Ottieni rapporto per un intervento
export const getJobReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;

    const jobChecklist = await prisma.jobChecklist.findFirst({
      where: {
        jobId: id,
        job: {
          companyId,
        },
        checklist: {
          nome: 'Rapporto Intervento',
        },
      },
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
        compilatore: {
          select: {
            id: true,
            nome: true,
            cognome: true,
          },
        },
      },
    });

    if (!jobChecklist) {
      return res.status(404).json({ error: 'Rapporto non trovato' });
    }

    res.json(jobChecklist);
  } catch (error: any) {
    console.error('Get job report error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero rapporto' });
  }
};

