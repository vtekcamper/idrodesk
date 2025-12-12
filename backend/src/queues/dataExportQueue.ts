import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis';

export interface DataExportJobData {
  exportId: string;
  companyId: string;
  format: 'CSV' | 'JSON' | 'ZIP';
  includeTables: string[] | 'all';
}

/**
 * Queue per export dati asincroni
 */
export const dataExportQueue = new Queue<DataExportJobData>('data-export', {
  connection: getRedisClient(),
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 secondi, poi 25 secondi
    },
    removeOnComplete: {
      age: 7 * 24 * 3600, // Rimuovi dopo 7 giorni
      count: 100,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
    },
  },
});

/**
 * Aggiunge job export alla queue
 */
export async function addDataExportJob(data: DataExportJobData) {
  return dataExportQueue.add('export-data', data, {
    jobId: data.exportId, // Idempotency
  });
}

