import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis';

export interface EmailJobData {
  notificationId: string;
  to: string;
  subject: string;
  html: string;
  from?: string;
  companyId?: string;
  userId?: string;
  type: string;
}

/**
 * Queue per email asincrone
 * Configurazione:
 * - Retry: 3 tentativi
 * - Backoff: esponenziale (1s, 5s, 30s)
 * - Timeout: 30 secondi per job
 */
export const emailQueue = new Queue<EmailJobData>('email', {
  connection: getRedisClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000, // 1 secondo, poi 5s, poi 30s
    },
    removeOnComplete: {
      age: 24 * 3600, // Rimuovi job completati dopo 24 ore
      count: 1000, // Mantieni max 1000 job completati
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Rimuovi job falliti dopo 7 giorni
    },
  },
});

/**
 * Aggiunge job email alla queue
 */
export async function addEmailJob(data: EmailJobData) {
  return emailQueue.add('send-email', data, {
    jobId: data.notificationId, // Usa notificationId come jobId per idempotency
  });
}

/**
 * Ottiene stato job
 */
export async function getEmailJobStatus(jobId: string) {
  const job = await emailQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;
  const returnvalue = job.returnvalue;
  const failedReason = job.failedReason;

  return {
    id: job.id,
    state,
    progress,
    returnvalue,
    failedReason,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
  };
}

