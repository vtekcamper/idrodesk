import { Request, Response } from 'express';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';

const calculateTotals = (items: any[]) => {
  let totaleNetto = 0;
  let totaleIva = 0;

  items.forEach((item) => {
    const quantita = Number(item.quantita);
    const prezzoUnitario = Number(item.prezzoUnitario);
    const sconto = Number(item.scontoPercentuale) / 100;
    const iva = Number(item.ivaPercentuale) / 100;

    const subtotale = quantita * prezzoUnitario;
    const totaleScontato = subtotale * (1 - sconto);
    const ivaRiga = totaleScontato * iva;

    totaleNetto += totaleScontato;
    totaleIva += ivaRiga;
  });

  return {
    totaleNetto: new Prisma.Decimal(totaleNetto),
    totaleIva: new Prisma.Decimal(totaleIva),
    totaleLordo: new Prisma.Decimal(totaleNetto + totaleIva),
  };
};

export const getQuotes = async (req: Request, res: Response) => {
  try {
    const { clientId, stato } = req.query;
    const companyId = req.companyId!;

    const where: any = { companyId };

    if (clientId) {
      where.clientId = clientId as string;
    }

    if (stato) {
      where.stato = stato;
    }

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            nome: true,
            cognome: true,
          },
        },
        site: {
          select: {
            id: true,
            descrizione: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(quotes);
  } catch (error: any) {
    console.error('Get quotes error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero preventivi' });
  }
};

export const getQuote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;

    const quote = await prisma.quote.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        site: true,
        items: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Preventivo non trovato' });
    }

    res.json(quote);
  } catch (error: any) {
    console.error('Get quote error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero preventivo' });
  }
};

export const createQuote = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;
    const {
      clientId,
      siteId,
      numeroPreventivo,
      data,
      noteInterne,
      noteCliente,
      items,
    } = req.body;

    // Verifica che il cliente appartenga alla company
    const client = await prisma.client.findFirst({
      where: { id: clientId, companyId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }

    // Calcola totali
    const totals = calculateTotals(items);

    const quote = await prisma.quote.create({
      data: {
        companyId,
        clientId,
        siteId: siteId || null,
        numeroPreventivo,
        data: data ? new Date(data) : new Date(),
        noteInterne,
        noteCliente,
        ...totals,
        items: {
          create: items.map((item: any) => ({
            descrizione: item.descrizione,
            tipo: item.tipo,
            quantita: new Prisma.Decimal(item.quantita || 1),
            unita: item.unita || 'pz',
            prezzoUnitario: new Prisma.Decimal(item.prezzoUnitario || 0),
            scontoPercentuale: new Prisma.Decimal(item.scontoPercentuale || 0),
            ivaPercentuale: new Prisma.Decimal(item.ivaPercentuale || 22),
            totaleRiga: new Prisma.Decimal(
              (Number(item.quantita || 1) * Number(item.prezzoUnitario || 0)) *
              (1 - Number(item.scontoPercentuale || 0) / 100) *
              (1 + Number(item.ivaPercentuale || 22) / 100)
            ),
          })),
        },
      },
      include: {
        items: true,
        client: true,
        site: true,
      },
    });

    res.status(201).json(quote);
  } catch (error: any) {
    console.error('Create quote error:', error);
    res.status(500).json({ error: error.message || 'Errore nella creazione preventivo' });
  }
};

export const updateQuote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const {
      clientId,
      siteId,
      numeroPreventivo,
      data,
      stato,
      noteInterne,
      noteCliente,
      items,
    } = req.body;

    const quote = await prisma.quote.findFirst({
      where: { id, companyId },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Preventivo non trovato' });
    }

    // Se ci sono items, ricalcola totali
    let totals = {};
    if (items) {
      totals = calculateTotals(items);

      // Elimina items esistenti e ricreali
      await prisma.quoteItem.deleteMany({
        where: { quoteId: id },
      });
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        ...(clientId && { clientId }),
        ...(siteId !== undefined && { siteId: siteId || null }),
        ...(numeroPreventivo && { numeroPreventivo }),
        ...(data && { data: new Date(data) }),
        ...(stato && { stato }),
        ...(noteInterne !== undefined && { noteInterne }),
        ...(noteCliente !== undefined && { noteCliente }),
        ...totals,
        ...(items && {
          items: {
            create: items.map((item: any) => ({
              descrizione: item.descrizione,
              tipo: item.tipo,
              quantita: new Prisma.Decimal(item.quantita || 1),
              unita: item.unita || 'pz',
              prezzoUnitario: new Prisma.Decimal(item.prezzoUnitario || 0),
              scontoPercentuale: new Prisma.Decimal(item.scontoPercentuale || 0),
              ivaPercentuale: new Prisma.Decimal(item.ivaPercentuale || 22),
              totaleRiga: new Prisma.Decimal(
                (Number(item.quantita || 1) * Number(item.prezzoUnitario || 0)) *
                (1 - Number(item.scontoPercentuale || 0) / 100) *
                (1 + Number(item.ivaPercentuale || 22) / 100)
              ),
            })),
          },
        }),
      },
      include: {
        items: true,
        client: true,
        site: true,
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update quote error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'aggiornamento preventivo' });
  }
};

export const duplicateQuote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;

    const original = await prisma.quote.findFirst({
      where: { id, companyId },
      include: { items: true },
    });

    if (!original) {
      return res.status(404).json({ error: 'Preventivo non trovato' });
    }

    const duplicated = await prisma.quote.create({
      data: {
        companyId,
        clientId: original.clientId,
        siteId: original.siteId,
        numeroPreventivo: `${original.numeroPreventivo}-COPIA`,
        data: new Date(),
        stato: 'BOZZA',
        totaleNetto: original.totaleNetto,
        totaleIva: original.totaleIva,
        totaleLordo: original.totaleLordo,
        noteInterne: original.noteInterne,
        noteCliente: original.noteCliente,
        items: {
          create: original.items.map((item) => ({
            descrizione: item.descrizione,
            tipo: item.tipo,
            quantita: item.quantita,
            unita: item.unita,
            prezzoUnitario: item.prezzoUnitario,
            scontoPercentuale: item.scontoPercentuale,
            ivaPercentuale: item.ivaPercentuale,
            totaleRiga: item.totaleRiga,
          })),
        },
      },
      include: {
        items: true,
        client: true,
        site: true,
      },
    });

    res.status(201).json(duplicated);
  } catch (error: any) {
    console.error('Duplicate quote error:', error);
    res.status(500).json({ error: error.message || 'Errore nella duplicazione preventivo' });
  }
};

export const convertToJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const { titolo, dataProgrammata, oraProgrammata, assegnatoA } = req.body;

    const quote = await prisma.quote.findFirst({
      where: { id, companyId },
      include: { client: true },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Preventivo non trovato' });
    }

    if (quote.stato !== 'ACCETTATO') {
      return res.status(400).json({ error: 'Il preventivo deve essere accettato' });
    }

    if (quote.job) {
      return res.status(400).json({ error: 'Il preventivo è già stato convertito in lavoro' });
    }

    const job = await prisma.job.create({
      data: {
        companyId,
        clientId: quote.clientId,
        siteId: quote.siteId,
        titolo: titolo || `Lavoro da preventivo ${quote.numeroPreventivo}`,
        descrizione: quote.noteCliente,
        stato: 'PIANIFICATO',
        dataProgrammata: dataProgrammata ? new Date(dataProgrammata) : null,
        oraProgrammata,
        assegnatoA: assegnatoA || null,
        quoteId: quote.id,
      },
      include: {
        client: true,
        site: true,
        quote: true,
      },
    });

    res.status(201).json(job);
  } catch (error: any) {
    console.error('Convert to job error:', error);
    res.status(500).json({ error: error.message || 'Errore nella conversione in lavoro' });
  }
};

