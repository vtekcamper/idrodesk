import { Request, Response } from 'express';
import prisma from '../config/database';
import { ExportStatus } from '@prisma/client';
import { logAuditAction } from '../middleware/auditLog';
import { addDataExportJob } from '../queues/dataExportQueue';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';

/**
 * Richiede export dati company (GDPR)
 */
export const requestDataExport = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const userId = req.user!.userId;
    const { format = 'ZIP', includeTables } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID richiesto' });
    }

    // Verifica che la company esista e non sia eliminata
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company || company.deletedAt) {
      return res.status(404).json({ error: 'Company non trovata' });
    }

    // Crea record export
    const dataExport = await prisma.dataExport.create({
      data: {
        companyId,
        requestedBy: userId,
        format: format.toUpperCase(),
        status: ExportStatus.PENDING,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 giorni
        metadata: {
          includeTables: includeTables || ['all'],
          requestedAt: new Date().toISOString(),
        },
      },
    });

    // Aggiungi job alla queue
    await addDataExportJob({
      exportId: dataExport.id,
      companyId,
      format: format.toUpperCase(),
      includeTables: includeTables || ['all'],
    });

    // Log audit
    await logAuditAction(req, 'EXPORT_DATA', 'DataExport', dataExport.id, {
      format,
      includeTables,
    });

    res.json({
      success: true,
      export: dataExport,
      message: 'Export richiesto. Riceverai una notifica quando sarà pronto.',
    });
  } catch (error: any) {
    console.error('Request data export error:', error);
    res.status(500).json({ error: error.message || 'Errore nella richiesta export' });
  }
};

/**
 * Ottiene lista export richiesti
 */
export const getDataExports = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId || req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID richiesto' });
    }

    const exports = await prisma.dataExport.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json(exports);
  } catch (error: any) {
    console.error('Get data exports error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero export' });
  }
};

/**
 * Download export file
 */
export const downloadDataExport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId || req.user?.companyId;

    const dataExport = await prisma.dataExport.findUnique({
      where: { id },
    });

    if (!dataExport) {
      return res.status(404).json({ error: 'Export non trovato' });
    }

    // Verifica ownership
    if (dataExport.companyId !== companyId) {
      return res.status(403).json({ error: 'Accesso negato' });
    }

    // Verifica status
    if (dataExport.status !== ExportStatus.COMPLETED) {
      return res.status(400).json({ error: 'Export non ancora completato' });
    }

    // Verifica scadenza
    if (dataExport.expiresAt && new Date(dataExport.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'Link download scaduto' });
    }

    if (!dataExport.fileUrl) {
      return res.status(404).json({ error: 'File non trovato' });
    }

    // Log audit
    await logAuditAction(req, 'DOWNLOAD_EXPORT', 'DataExport', id, {});

    // Serve file
    const filePath = path.join(process.cwd(), dataExport.fileUrl);
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).json({ error: 'File non trovato sul server' });
    }
  } catch (error: any) {
    console.error('Download data export error:', error);
    res.status(500).json({ error: error.message || 'Errore nel download export' });
  }
};

/**
 * Soft delete company (GDPR)
 */
export const softDeleteCompany = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const userId = req.user!.userId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID richiesto' });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company non trovata' });
    }

    if (company.deletedAt) {
      return res.status(400).json({ error: 'Company già eliminata' });
    }

    // Soft delete: imposta deletedAt e subscriptionStatus
    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        deletedAt: new Date(),
        subscriptionStatus: 'DELETED',
        abbonamentoAttivo: false,
      },
    });

    // Soft delete tutti gli utenti della company
    await prisma.user.updateMany({
      where: { companyId },
      data: {
        attivo: false,
      },
    });

    // Log audit
    await logAuditAction(req, 'SOFT_DELETE_COMPANY', 'Company', companyId, {
      ragioneSociale: company.ragioneSociale,
      reason: 'GDPR request',
    });

    res.json({
      success: true,
      message: 'Company eliminata. I dati saranno eliminati definitivamente dopo 30 giorni.',
      company: updated,
    });
  } catch (error: any) {
    console.error('Soft delete company error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'eliminazione company' });
  }
};

/**
 * Ripristina company (solo super admin)
 */
export const restoreCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company non trovata' });
    }

    if (!company.deletedAt) {
      return res.status(400).json({ error: 'Company non eliminata' });
    }

    // Ripristina company
    const updated = await prisma.company.update({
      where: { id },
      data: {
        deletedAt: null,
        abbonamentoAttivo: true,
      },
    });

    // Ricalcola subscription status
    const { updateCompanySubscriptionStatus } = await import('../utils/subscriptionState');
    await updateCompanySubscriptionStatus(prisma, id);

    // Log audit
    await logAuditAction(req, 'RESTORE_COMPANY', 'Company', id, {
      ragioneSociale: company.ragioneSociale,
    });

    res.json({
      success: true,
      company: updated,
    });
  } catch (error: any) {
    console.error('Restore company error:', error);
    res.status(500).json({ error: error.message || 'Errore nel ripristino company' });
  }
};

