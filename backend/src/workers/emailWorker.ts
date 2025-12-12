import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { EmailJobData } from '../queues/emailQueue';
import prisma from '../config/database';
import nodemailer from 'nodemailer';
import { EmailStatus } from '@prisma/client';

/**
 * Configurazione email transporter
 */
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
 * Worker per processare email dalla queue
 */
export const emailWorker = new Worker<EmailJobData>(
  'email',
  async (job: Job<EmailJobData>) => {
    const { notificationId, to, subject, html, from } = job.data;

    console.log(`📧 Processing email job ${job.id} for notification ${notificationId}`);

    try {
      // Verifica che la notifica esista
      const notification = await prisma.emailNotification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new Error(`Email notification ${notificationId} not found`);
      }

      // Se già inviata, skip
      if (notification.status === EmailStatus.SENT) {
        console.log(`Email ${notificationId} already sent, skipping`);
        return { success: true, skipped: true };
      }

      // Invia email
      const transporter = createTransporter();
      const info = await transporter.sendMail({
        from: from || process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
      });

      // Aggiorna status
      await prisma.emailNotification.update({
        where: { id: notificationId },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
          error: null,
        },
      });

      console.log(`✅ Email ${notificationId} sent successfully: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      console.error(`❌ Error sending email ${notificationId}:`, error);

      // Aggiorna status con errore
      await prisma.emailNotification.update({
        where: { id: notificationId },
        data: {
          status: EmailStatus.FAILED,
          error: error.message || 'Unknown error',
        },
      }).catch((updateError) => {
        console.error('Error updating notification status:', updateError);
      });

      // Rilancia errore per trigger retry
      throw error;
    }
  },
  {
    connection: getRedisClient(),
    concurrency: 5, // Processa max 5 email in parallelo
    limiter: {
      max: 10, // Max 10 email al secondo
      duration: 1000,
    },
  }
);

// Event handlers
emailWorker.on('completed', (job) => {
  console.log(`✅ Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`❌ Email job ${job?.id} failed:`, err.message);
});

emailWorker.on('error', (err) => {
  console.error('Email worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down email worker...');
  await emailWorker.close();
  process.exit(0);
});

