import { Request, Response } from 'express';
import prisma from '../config/database';
import nodemailer from 'nodemailer';
import { EmailType, EmailStatus } from '@prisma/client';

// Configurazione email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

/**
 * Invia email
 */
export const sendEmail = async (req: Request, res: Response) => {
  try {
    const { companyId, userId, type, to, subject, body, metadata } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Dati email mancanti' });
    }

    // Crea record notifica
    const notification = await prisma.emailNotification.create({
      data: {
        companyId: companyId || null,
        userId: userId || null,
        type: type || EmailType.CUSTOM,
        to,
        subject,
        body,
        status: EmailStatus.PENDING,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Invia email
    try {
      const transporter = createTransporter();
      
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html: body,
      });

      // Aggiorna status
      await prisma.emailNotification.update({
        where: { id: notification.id },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
        },
      });

      res.json({ success: true, notification });
    } catch (emailError: any) {
      // Aggiorna status con errore
      await prisma.emailNotification.update({
        where: { id: notification.id },
        data: {
          status: EmailStatus.FAILED,
          error: emailError.message,
        },
      });

      throw emailError;
    }
  } catch (error: any) {
    console.error('Send email error:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'invio email' });
  }
};

/**
 * Helper per inviare email di benvenuto (da chiamare da altri controller)
 */
export const sendWelcomeEmailHelper = async (companyId: string, companyEmail: string, companyName: string) => {
  try {
    const body = `
      <h1>Benvenuto in IdroDesk!</h1>
      <p>Ciao ${companyName},</p>
      <p>La tua azienda è stata registrata con successo su IdroDesk.</p>
      <p>Puoi iniziare a gestire i tuoi clienti, preventivi e lavori.</p>
      <p>Buon lavoro!</p>
    `;

    const notification = await prisma.emailNotification.create({
      data: {
        companyId,
        type: EmailType.WELCOME,
        to: companyEmail,
        subject: 'Benvenuto in IdroDesk',
        body,
        status: EmailStatus.PENDING,
      },
    });

    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: companyEmail,
      subject: 'Benvenuto in IdroDesk',
      html: body,
    });

    await prisma.emailNotification.update({
      where: { id: notification.id },
      data: {
        status: EmailStatus.SENT,
        sentAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Send welcome email error:', error);
  }
};

/**
 * Helper per inviare email di scadenza abbonamento
 */
export const sendSubscriptionExpiringEmailHelper = async (companyId: string, daysUntilExpiry: number) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company || !company.email) return;

    const body = `
      <h1>Abbonamento in scadenza</h1>
      <p>Ciao ${company.ragioneSociale},</p>
      <p>Il tuo abbonamento scadrà tra ${daysUntilExpiry} giorni.</p>
      <p>Rinnova ora per continuare a usare IdroDesk senza interruzioni.</p>
      <a href="${process.env.FRONTEND_URL}/subscription/renew">Rinnova Abbonamento</a>
    `;

    const notification = await prisma.emailNotification.create({
      data: {
        companyId,
        type: EmailType.SUBSCRIPTION_EXPIRING,
        to: company.email,
        subject: `Abbonamento in scadenza - ${daysUntilExpiry} giorni`,
        body,
        status: EmailStatus.PENDING,
      },
    });

    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: company.email,
      subject: `Abbonamento in scadenza - ${daysUntilExpiry} giorni`,
      html: body,
    });

    await prisma.emailNotification.update({
      where: { id: notification.id },
      data: {
        status: EmailStatus.SENT,
        sentAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Send subscription expiring email error:', error);
  }
};

/**
 * Ottiene tutte le notifiche email
 */
export const getAllEmailNotifications = async (req: Request, res: Response) => {
  try {
    const { companyId, type, status } = req.query;

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

    const notifications = await prisma.emailNotification.findMany({
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
      take: 100,
    });

    res.json(notifications);
  } catch (error: any) {
    console.error('Get all email notifications error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero notifiche' });
  }
};

