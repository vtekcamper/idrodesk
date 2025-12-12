import { Request, Response } from 'express';
import prisma from '../config/database';
import { EmailType, EmailStatus } from '@prisma/client';
import { addEmailJob } from '../queues/emailQueue';
import { renderEmailTemplate, getTemplateName, prepareTemplateData } from '../utils/emailTemplates';
import { logAuditAction } from '../middleware/auditLog';

/**
 * Invia email (usa queue asincrona)
 */
export const sendEmail = async (req: Request, res: Response) => {
  try {
    const { companyId, userId, type, to, subject, body, metadata, useTemplate, templateData } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ error: 'Destinatario e oggetto richiesti' });
    }

    // Se useTemplate è true, renderizza template
    let htmlBody = body;
    if (useTemplate && type) {
      const templateName = getTemplateName(type);
      const data = prepareTemplateData(type, { ...templateData, ...metadata });
      htmlBody = renderEmailTemplate(templateName, data);
    }

    // Crea record notifica
    const notification = await prisma.emailNotification.create({
      data: {
        companyId: companyId || null,
        userId: userId || null,
        type: type || EmailType.CUSTOM,
        to,
        subject,
        body: htmlBody,
        status: EmailStatus.PENDING,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Aggiungi job alla queue (invio asincrono)
    await addEmailJob({
      notificationId: notification.id,
      to,
      subject,
      html: htmlBody,
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      companyId: companyId || undefined,
      userId: userId || undefined,
      type: type || EmailType.CUSTOM,
    });

    // Log audit
    await logAuditAction(req, 'SEND_EMAIL', 'EmailNotification', notification.id, {
      to,
      subject,
      type: type || EmailType.CUSTOM,
      companyId,
    });

    res.json({
      success: true,
      notification: {
        ...notification,
        status: 'PENDING', // In coda, non ancora inviata
      },
      message: 'Email aggiunta alla coda di invio',
    });
  } catch (error: any) {
    console.error('Send email error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'invio email' });
  }
};

/**
 * Preview template email
 */
export const previewEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { type, templateData } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Tipo email richiesto' });
    }

    const templateName = getTemplateName(type);
    const data = prepareTemplateData(type, templateData || {});
    const html = renderEmailTemplate(templateName, data);

    res.json({
      html,
      templateName,
      data,
    });
  } catch (error: any) {
    console.error('Preview email template error:', error);
    res.status(500).json({ error: error.message || 'Errore nel preview template' });
  }
};

/**
 * Ottiene lista template disponibili
 */
export const getEmailTemplates = async (req: Request, res: Response) => {
  try {
    const templates = [
      {
        type: 'WELCOME',
        name: 'Benvenuto',
        description: 'Email di benvenuto per nuove aziende',
        variables: ['companyName'],
      },
      {
        type: 'SUBSCRIPTION_EXPIRING',
        name: 'Abbonamento in Scadenza',
        description: 'Notifica scadenza abbonamento',
        variables: ['companyName', 'daysUntilExpiry', 'expiryDate'],
      },
      {
        type: 'SUBSCRIPTION_EXPIRED',
        name: 'Abbonamento Scaduto',
        description: 'Notifica abbonamento scaduto',
        variables: ['companyName', 'expiryDate'],
      },
      {
        type: 'PAYMENT_SUCCESS',
        name: 'Pagamento Riuscito',
        description: 'Conferma pagamento',
        variables: ['companyName', 'amount', 'expiryDate'],
      },
      {
        type: 'PAYMENT_FAILED',
        name: 'Pagamento Fallito',
        description: 'Notifica pagamento fallito',
        variables: ['companyName', 'amount', 'errorMessage'],
      },
      {
        type: 'PLAN_UPGRADE',
        name: 'Upgrade Piano',
        description: 'Notifica upgrade piano',
        variables: ['companyName', 'newPlan', 'oldPlan'],
      },
      {
        type: 'PLAN_DOWNGRADE',
        name: 'Downgrade Piano',
        description: 'Notifica downgrade piano',
        variables: ['companyName', 'newPlan', 'oldPlan'],
      },
    ];

    res.json(templates);
  } catch (error: any) {
    console.error('Get email templates error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero template' });
  }
};

/**
 * Helper per inviare email di benvenuto (usa queue)
 */
export const sendWelcomeEmailHelper = async (companyId: string, companyEmail: string, companyName: string) => {
  try {
    const notification = await prisma.emailNotification.create({
      data: {
        companyId,
        type: EmailType.WELCOME,
        to: companyEmail,
        subject: 'Benvenuto in IdroDesk',
        body: '', // Sarà generato dal template
        status: EmailStatus.PENDING,
      },
    });

    // Aggiungi job alla queue
    const templateName = getTemplateName(EmailType.WELCOME);
    const data = prepareTemplateData(EmailType.WELCOME, {
      companyName,
      ragioneSociale: companyName,
    });
    const html = renderEmailTemplate(templateName, data);

    await addEmailJob({
      notificationId: notification.id,
      to: companyEmail,
      subject: 'Benvenuto in IdroDesk',
      html,
      companyId,
      type: EmailType.WELCOME,
    });

    // Aggiorna body nel database
    await prisma.emailNotification.update({
      where: { id: notification.id },
      data: { body: html },
    });
  } catch (error) {
    console.error('Send welcome email error:', error);
  }
};

/**
 * Helper per inviare email di scadenza abbonamento (usa queue)
 */
export const sendSubscriptionExpiringEmailHelper = async (companyId: string, daysUntilExpiry: number) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company || !company.email) return;

    const notification = await prisma.emailNotification.create({
      data: {
        companyId,
        type: EmailType.SUBSCRIPTION_EXPIRING,
        to: company.email,
        subject: `Abbonamento in scadenza - ${daysUntilExpiry} giorni`,
        body: '', // Sarà generato dal template
        status: EmailStatus.PENDING,
      },
    });

    // Aggiungi job alla queue
    const templateName = getTemplateName(EmailType.SUBSCRIPTION_EXPIRING);
    const expiryDate = company.dataScadenza 
      ? new Date(company.dataScadenza).toLocaleDateString('it-IT')
      : 'Prossimamente';
    
    const data = prepareTemplateData(EmailType.SUBSCRIPTION_EXPIRING, {
      companyName: company.ragioneSociale,
      ragioneSociale: company.ragioneSociale,
      daysUntilExpiry,
      expiryDate,
      dataScadenza: company.dataScadenza,
    });
    const html = renderEmailTemplate(templateName, data);

    await addEmailJob({
      notificationId: notification.id,
      to: company.email,
      subject: `Abbonamento in scadenza - ${daysUntilExpiry} giorni`,
      html,
      companyId,
      type: EmailType.SUBSCRIPTION_EXPIRING,
    });

    // Aggiorna body nel database
    await prisma.emailNotification.update({
      where: { id: notification.id },
      data: { body: html },
    });
  } catch (error) {
    console.error('Send subscription expiring email error:', error);
  }
};

/**
 * Helper per inviare email abbonamento scaduto
 */
export const sendSubscriptionExpiredEmailHelper = async (companyId: string) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company || !company.email) return;

    const notification = await prisma.emailNotification.create({
      data: {
        companyId,
        type: EmailType.SUBSCRIPTION_EXPIRED,
        to: company.email,
        subject: 'Abbonamento Scaduto',
        body: '',
        status: EmailStatus.PENDING,
      },
    });

    const templateName = getTemplateName(EmailType.SUBSCRIPTION_EXPIRED);
    const expiryDate = company.dataScadenza 
      ? new Date(company.dataScadenza).toLocaleDateString('it-IT')
      : 'Prossimamente';
    
    const data = prepareTemplateData(EmailType.SUBSCRIPTION_EXPIRED, {
      companyName: company.ragioneSociale,
      ragioneSociale: company.ragioneSociale,
      expiryDate,
      dataScadenza: company.dataScadenza,
    });
    const html = renderEmailTemplate(templateName, data);

    await addEmailJob({
      notificationId: notification.id,
      to: company.email,
      subject: 'Abbonamento Scaduto',
      html,
      companyId,
      type: EmailType.SUBSCRIPTION_EXPIRED,
    });

    await prisma.emailNotification.update({
      where: { id: notification.id },
      data: { body: html },
    });
  } catch (error) {
    console.error('Send subscription expired email error:', error);
  }
};

/**
 * Helper per inviare email pagamento riuscito
 */
export const sendPaymentSuccessEmailHelper = async (
  companyId: string,
  amount: number,
  expiryDate: Date
) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company || !company.email) return;

    const notification = await prisma.emailNotification.create({
      data: {
        companyId,
        type: EmailType.PAYMENT_SUCCESS,
        to: company.email,
        subject: 'Pagamento Confermato',
        body: '',
        status: EmailStatus.PENDING,
      },
    });

    const templateName = getTemplateName(EmailType.PAYMENT_SUCCESS);
    const data = prepareTemplateData(EmailType.PAYMENT_SUCCESS, {
      companyName: company.ragioneSociale,
      ragioneSociale: company.ragioneSociale,
      amount,
      expiryDate: expiryDate.toLocaleDateString('it-IT'),
      dataScadenza: expiryDate,
    });
    const html = renderEmailTemplate(templateName, data);

    await addEmailJob({
      notificationId: notification.id,
      to: company.email,
      subject: 'Pagamento Confermato',
      html,
      companyId,
      type: EmailType.PAYMENT_SUCCESS,
    });

    await prisma.emailNotification.update({
      where: { id: notification.id },
      data: { body: html },
    });
  } catch (error) {
    console.error('Send payment success email error:', error);
  }
};

/**
 * Helper per inviare email pagamento fallito
 */
export const sendPaymentFailedEmailHelper = async (
  companyId: string,
  amount: number,
  errorMessage: string
) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company || !company.email) return;

    const notification = await prisma.emailNotification.create({
      data: {
        companyId,
        type: EmailType.PAYMENT_FAILED,
        to: company.email,
        subject: 'Pagamento Fallito',
        body: '',
        status: EmailStatus.PENDING,
      },
    });

    const templateName = getTemplateName(EmailType.PAYMENT_FAILED);
    const data = prepareTemplateData(EmailType.PAYMENT_FAILED, {
      companyName: company.ragioneSociale,
      ragioneSociale: company.ragioneSociale,
      amount,
      errorMessage,
    });
    const html = renderEmailTemplate(templateName, data);

    await addEmailJob({
      notificationId: notification.id,
      to: company.email,
      subject: 'Pagamento Fallito',
      html,
      companyId,
      type: EmailType.PAYMENT_FAILED,
    });

    await prisma.emailNotification.update({
      where: { id: notification.id },
      data: { body: html },
    });
  } catch (error) {
    console.error('Send payment failed email error:', error);
  }
};

/**
 * Helper per inviare email upgrade/downgrade piano
 */
export const sendPlanChangeEmailHelper = async (
  companyId: string,
  oldPlan: string,
  newPlan: string,
  isUpgrade: boolean
) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company || !company.email) return;

    const emailType = isUpgrade ? EmailType.PLAN_UPGRADE : EmailType.PLAN_DOWNGRADE;
    const subject = isUpgrade ? 'Piano Aggiornato' : 'Piano Modificato';

    const notification = await prisma.emailNotification.create({
      data: {
        companyId,
        type: emailType,
        to: company.email,
        subject,
        body: '',
        status: EmailStatus.PENDING,
      },
    });

    const templateName = getTemplateName(emailType);
    const data = prepareTemplateData(emailType, {
      companyName: company.ragioneSociale,
      ragioneSociale: company.ragioneSociale,
      oldPlan,
      newPlan,
      pianoAbbonamento: newPlan,
      pianoPrecedente: oldPlan,
    });
    const html = renderEmailTemplate(templateName, data);

    await addEmailJob({
      notificationId: notification.id,
      to: company.email,
      subject,
      html,
      companyId,
      type: emailType,
    });

    await prisma.emailNotification.update({
      where: { id: notification.id },
      data: { body: html },
    });
  } catch (error) {
    console.error('Send plan change email error:', error);
  }
};

/**
 * Ottiene tutte le notifiche email
 */
export const getAllEmailNotifications = async (req: Request, res: Response) => {
  try {
    const { companyId, type, status, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [notifications, total] = await Promise.all([
      prisma.emailNotification.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              ragioneSociale: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.emailNotification.count({ where }),
    ]);

    res.json({
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get all email notifications error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero notifiche' });
  }
};
