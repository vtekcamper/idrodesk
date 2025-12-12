import { Request, Response } from 'express';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { logAuditAction } from '../middleware/auditLog';

/**
 * Ottiene tutte le impostazioni company (unificato)
 */
export const getAllSettings = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;

    const [company, documentSettings, appPreferences] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          ragioneSociale: true,
          nomeCommerciale: true,
          piva: true,
          codiceFiscale: true,
          indirizzo: true,
          citta: true,
          cap: true,
          provincia: true,
          paese: true,
          telefono: true,
          email: true,
          sitoWeb: true,
          pecEmail: true,
          sdiCode: true,
          iban: true,
          defaultPaymentTermsDays: true,
          notePublic: true,
          logoUrl: true,
        },
      }),
      prisma.documentSettings.findUnique({
        where: { companyId },
      }),
      prisma.appPreferences.findUnique({
        where: { companyId },
      }),
    ]);

    if (!company) {
      return res.status(404).json({ error: 'Company non trovata' });
    }

    res.json({
      company,
      documents: documentSettings || null,
      preferences: appPreferences || null,
    });
  } catch (error: any) {
    console.error('Get all settings error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero impostazioni' });
  }
};

/**
 * Aggiorna impostazioni azienda
 */
export const updateCompanySettings = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;
    const {
      ragioneSociale,
      nomeCommerciale,
      piva,
      codiceFiscale,
      indirizzo,
      citta,
      cap,
      provincia,
      paese,
      telefono,
      email,
      sitoWeb,
      pecEmail,
      sdiCode,
      iban,
      defaultPaymentTermsDays,
      notePublic,
      logoUrl,
    } = req.body;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company non trovata' });
    }

    // Validazione P.IVA (soft)
    if (piva && piva !== company.piva) {
      // Verifica formato base (almeno 11 caratteri per IT)
      if (piva.length < 11) {
        return res.status(400).json({ error: 'P.IVA non valida (minimo 11 caratteri)' });
      }
    }

    // Validazione email
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email non valida' });
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...(ragioneSociale && { ragioneSociale }),
        ...(nomeCommerciale !== undefined && { nomeCommerciale }),
        ...(piva && { piva }),
        ...(codiceFiscale !== undefined && { codiceFiscale }),
        ...(indirizzo !== undefined && { indirizzo }),
        ...(citta !== undefined && { citta }),
        ...(cap !== undefined && { cap }),
        ...(provincia !== undefined && { provincia }),
        ...(paese !== undefined && { paese }),
        ...(telefono !== undefined && { telefono }),
        ...(email !== undefined && { email }),
        ...(sitoWeb !== undefined && { sitoWeb }),
        ...(pecEmail !== undefined && { pecEmail }),
        ...(sdiCode !== undefined && { sdiCode }),
        ...(iban !== undefined && { iban }),
        ...(defaultPaymentTermsDays !== undefined && { defaultPaymentTermsDays }),
        ...(notePublic !== undefined && { notePublic }),
        ...(logoUrl !== undefined && { logoUrl }),
      },
    });

    await logAuditAction(req, 'UPDATE_COMPANY_SETTINGS', 'Company', companyId, {
      before: company,
      after: updated,
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update company settings error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'P.IVA già esistente' });
    }
    res.status(500).json({ error: error.message || 'Errore nell\'aggiornamento impostazioni' });
  }
};

/**
 * Ottiene o crea document settings
 */
export const getDocumentSettings = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;

    let settings = await prisma.documentSettings.findUnique({
      where: { companyId },
    });

    // Se non esiste, crea con defaults
    if (!settings) {
      settings = await prisma.documentSettings.create({
        data: {
          companyId,
        },
      });
    }

    res.json(settings);
  } catch (error: any) {
    console.error('Get document settings error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero impostazioni documenti' });
  }
};

/**
 * Aggiorna document settings
 */
export const updateDocumentSettings = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;
    const data = req.body;

    // Validazioni
    if (data.quoteNextNumber !== undefined && data.quoteNextNumber < 1) {
      return res.status(400).json({ error: 'Numero preventivo deve essere positivo' });
    }
    if (data.jobNextNumber !== undefined && data.jobNextNumber < 1) {
      return res.status(400).json({ error: 'Numero intervento deve essere positivo' });
    }
    if (data.defaultTaxRate !== undefined && (data.defaultTaxRate < 0 || data.defaultTaxRate > 100)) {
      return res.status(400).json({ error: 'Aliquota IVA deve essere tra 0 e 100' });
    }

    // Upsert document settings
    const settings = await prisma.documentSettings.upsert({
      where: { companyId },
      update: {
        ...(data.quotePrefix !== undefined && { quotePrefix: data.quotePrefix }),
        ...(data.quoteNextNumber !== undefined && { quoteNextNumber: data.quoteNextNumber }),
        ...(data.jobPrefix !== undefined && { jobPrefix: data.jobPrefix }),
        ...(data.jobNextNumber !== undefined && { jobNextNumber: data.jobNextNumber }),
        ...(data.docFooterText !== undefined && { docFooterText: data.docFooterText }),
        ...(data.docHeaderText !== undefined && { docHeaderText: data.docHeaderText }),
        ...(data.defaultQuoteValidityDays !== undefined && { defaultQuoteValidityDays: data.defaultQuoteValidityDays }),
        ...(data.defaultWarrantyText !== undefined && { defaultWarrantyText: data.defaultWarrantyText }),
        ...(data.defaultTermsText !== undefined && { defaultTermsText: data.defaultTermsText }),
        ...(data.defaultPrivacyText !== undefined && { defaultPrivacyText: data.defaultPrivacyText }),
        ...(data.defaultEmailTemplateQuoteSubject !== undefined && { defaultEmailTemplateQuoteSubject: data.defaultEmailTemplateQuoteSubject }),
        ...(data.defaultEmailTemplateQuoteBody !== undefined && { defaultEmailTemplateQuoteBody: data.defaultEmailTemplateQuoteBody }),
        ...(data.defaultEmailTemplateReportSubject !== undefined && { defaultEmailTemplateReportSubject: data.defaultEmailTemplateReportSubject }),
        ...(data.defaultEmailTemplateReportBody !== undefined && { defaultEmailTemplateReportBody: data.defaultEmailTemplateReportBody }),
        ...(data.defaultTaxRate !== undefined && { defaultTaxRate: new Prisma.Decimal(data.defaultTaxRate) }),
        ...(data.showTax !== undefined && { showTax: data.showTax }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.locale !== undefined && { locale: data.locale }),
      },
      create: {
        companyId,
        quotePrefix: data.quotePrefix || 'PREV',
        quoteNextNumber: data.quoteNextNumber || 1,
        jobPrefix: data.jobPrefix || 'INT',
        jobNextNumber: data.jobNextNumber || 1,
        docFooterText: data.docFooterText || null,
        docHeaderText: data.docHeaderText || null,
        defaultQuoteValidityDays: data.defaultQuoteValidityDays || 30,
        defaultWarrantyText: data.defaultWarrantyText || null,
        defaultTermsText: data.defaultTermsText || null,
        defaultPrivacyText: data.defaultPrivacyText || null,
        defaultEmailTemplateQuoteSubject: data.defaultEmailTemplateQuoteSubject || null,
        defaultEmailTemplateQuoteBody: data.defaultEmailTemplateQuoteBody || null,
        defaultEmailTemplateReportSubject: data.defaultEmailTemplateReportSubject || null,
        defaultEmailTemplateReportBody: data.defaultEmailTemplateReportBody || null,
        defaultTaxRate: data.defaultTaxRate ? new Prisma.Decimal(data.defaultTaxRate) : new Prisma.Decimal(22),
        showTax: data.showTax !== undefined ? data.showTax : true,
        currency: data.currency || 'EUR',
        locale: data.locale || 'it-IT',
      },
    });

    await logAuditAction(req, 'UPDATE_DOCUMENT_SETTINGS', 'DocumentSettings', settings.id, {
      companyId,
      changes: data,
    });

    res.json(settings);
  } catch (error: any) {
    console.error('Update document settings error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'aggiornamento impostazioni documenti' });
  }
};

/**
 * Ottiene o crea app preferences
 */
export const getAppPreferences = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;

    let preferences = await prisma.appPreferences.findUnique({
      where: { companyId },
    });

    if (!preferences) {
      preferences = await prisma.appPreferences.create({
        data: {
          companyId,
        },
      });
    }

    res.json(preferences);
  } catch (error: any) {
    console.error('Get app preferences error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero preferenze app' });
  }
};

/**
 * Aggiorna app preferences
 */
export const updateAppPreferences = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;
    const data = req.body;

    // Validazione maxUploadSizeMB
    if (data.maxUploadSizeMB !== undefined && (data.maxUploadSizeMB < 1 || data.maxUploadSizeMB > 100)) {
      return res.status(400).json({ error: 'Dimensione massima upload deve essere tra 1 e 100 MB' });
    }

    const preferences = await prisma.appPreferences.upsert({
      where: { companyId },
      update: {
        ...(data.workflowEnabled !== undefined && { workflowEnabled: data.workflowEnabled }),
        ...(data.requireReportOnComplete !== undefined && { requireReportOnComplete: data.requireReportOnComplete }),
        ...(data.enableMaterialsPricing !== undefined && { enableMaterialsPricing: data.enableMaterialsPricing }),
        ...(data.defaultUnit !== undefined && { defaultUnit: data.defaultUnit }),
        ...(data.dateFormat !== undefined && { dateFormat: data.dateFormat }),
        ...(data.timeTrackingEnabled !== undefined && { timeTrackingEnabled: data.timeTrackingEnabled }),
        ...(data.attachmentsEnabled !== undefined && { attachmentsEnabled: data.attachmentsEnabled }),
        ...(data.maxUploadSizeMB !== undefined && { maxUploadSizeMB: data.maxUploadSizeMB }),
        ...(data.notifyQuoteExpiring !== undefined && { notifyQuoteExpiring: data.notifyQuoteExpiring }),
        ...(data.notifyJobsTomorrow !== undefined && { notifyJobsTomorrow: data.notifyJobsTomorrow }),
        ...(data.notifyMissingReports !== undefined && { notifyMissingReports: data.notifyMissingReports }),
      },
      create: {
        companyId,
        workflowEnabled: data.workflowEnabled !== undefined ? data.workflowEnabled : true,
        requireReportOnComplete: data.requireReportOnComplete !== undefined ? data.requireReportOnComplete : false,
        enableMaterialsPricing: data.enableMaterialsPricing !== undefined ? data.enableMaterialsPricing : true,
        defaultUnit: data.defaultUnit || 'pz',
        dateFormat: data.dateFormat || 'DD/MM/YYYY',
        timeTrackingEnabled: data.timeTrackingEnabled !== undefined ? data.timeTrackingEnabled : false,
        attachmentsEnabled: data.attachmentsEnabled !== undefined ? data.attachmentsEnabled : true,
        maxUploadSizeMB: data.maxUploadSizeMB || 10,
        notifyQuoteExpiring: data.notifyQuoteExpiring !== undefined ? data.notifyQuoteExpiring : true,
        notifyJobsTomorrow: data.notifyJobsTomorrow !== undefined ? data.notifyJobsTomorrow : true,
        notifyMissingReports: data.notifyMissingReports !== undefined ? data.notifyMissingReports : true,
      },
    });

    await logAuditAction(req, 'UPDATE_APP_PREFERENCES', 'AppPreferences', preferences.id, {
      companyId,
      changes: data,
    });

    res.json(preferences);
  } catch (error: any) {
    console.error('Update app preferences error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'aggiornamento preferenze app' });
  }
};

/**
 * Aggiorna notifiche (parte di app preferences)
 */
export const updateNotifications = async (req: Request, res: Response) => {
  try {
    const companyId = req.companyId!;
    const { notifyQuoteExpiring, notifyJobsTomorrow, notifyMissingReports } = req.body;

    const preferences = await prisma.appPreferences.upsert({
      where: { companyId },
      update: {
        ...(notifyQuoteExpiring !== undefined && { notifyQuoteExpiring }),
        ...(notifyJobsTomorrow !== undefined && { notifyJobsTomorrow }),
        ...(notifyMissingReports !== undefined && { notifyMissingReports }),
      },
      create: {
        companyId,
        notifyQuoteExpiring: notifyQuoteExpiring !== undefined ? notifyQuoteExpiring : true,
        notifyJobsTomorrow: notifyJobsTomorrow !== undefined ? notifyJobsTomorrow : true,
        notifyMissingReports: notifyMissingReports !== undefined ? notifyMissingReports : true,
      },
    });

    await logAuditAction(req, 'UPDATE_NOTIFICATIONS', 'AppPreferences', preferences.id, {
      companyId,
      changes: { notifyQuoteExpiring, notifyJobsTomorrow, notifyMissingReports },
    });

    res.json({
      notifyQuoteExpiring: preferences.notifyQuoteExpiring,
      notifyJobsTomorrow: preferences.notifyJobsTomorrow,
      notifyMissingReports: preferences.notifyMissingReports,
    });
  } catch (error: any) {
    console.error('Update notifications error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'aggiornamento notifiche' });
  }
};

