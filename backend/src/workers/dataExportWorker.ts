import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { DataExportJobData } from '../queues/dataExportQueue';
import prisma from '../config/database';
import { ExportStatus } from '@prisma/client';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';

/**
 * Worker per processare export dati
 */
export const dataExportWorker = new Worker<DataExportJobData>(
  'data-export',
  async (job: Job<DataExportJobData>) => {
    const { exportId, companyId, format, includeTables } = job.data;

    console.log(`📦 Processing data export ${exportId} for company ${companyId}`);

    try {
      // Aggiorna status a PROCESSING
      await prisma.dataExport.update({
        where: { id: exportId },
        data: {
          status: ExportStatus.PROCESSING,
        },
      });

      // Crea directory export se non esiste
      const exportDir = path.join(process.cwd(), 'exports', companyId);
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      let fileUrl: string;

      if (format === 'ZIP') {
        fileUrl = await createZipExport(companyId, exportId, includeTables);
      } else if (format === 'CSV') {
        fileUrl = await createCsvExport(companyId, exportId, includeTables);
      } else {
        fileUrl = await createJsonExport(companyId, exportId, includeTables);
      }

      // Aggiorna export con file URL
      await prisma.dataExport.update({
        where: { id: exportId },
        data: {
          status: ExportStatus.COMPLETED,
          fileUrl,
          completedAt: new Date(),
        },
      });

      console.log(`✅ Data export ${exportId} completed: ${fileUrl}`);

      return { success: true, fileUrl };
    } catch (error: any) {
      console.error(`❌ Error processing data export ${exportId}:`, error);

      // Aggiorna status con errore
      await prisma.dataExport.update({
        where: { id: exportId },
        data: {
          status: ExportStatus.FAILED,
          error: error.message || 'Unknown error',
        },
      }).catch((updateError) => {
        console.error('Error updating export status:', updateError);
      });

      throw error;
    }
  },
  {
    connection: getRedisClient(),
    concurrency: 2, // Max 2 export in parallelo
  }
);

/**
 * Crea export ZIP con tutti i dati
 */
async function createZipExport(
  companyId: string,
  exportId: string,
  includeTables: string[] | 'all'
): Promise<string> {
  const exportDir = path.join(process.cwd(), 'exports', companyId);
  const zipPath = path.join(exportDir, `${exportId}.zip`);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      resolve(`exports/${companyId}/${exportId}.zip`);
    });

    archive.on('error', reject);
    archive.pipe(output);

    // Export dati in JSON
    Promise.all([
      exportCompanyData(companyId),
      exportUsersData(companyId),
      exportClientsData(companyId),
      exportJobsData(companyId),
      exportQuotesData(companyId),
      exportPaymentsData(companyId),
    ]).then(([company, users, clients, jobs, quotes, payments]) => {
      archive.append(JSON.stringify(company, null, 2), { name: 'company.json' });
      archive.append(JSON.stringify(users, null, 2), { name: 'users.json' });
      archive.append(JSON.stringify(clients, null, 2), { name: 'clients.json' });
      archive.append(JSON.stringify(jobs, null, 2), { name: 'jobs.json' });
      archive.append(JSON.stringify(quotes, null, 2), { name: 'quotes.json' });
      archive.append(JSON.stringify(payments, null, 2), { name: 'payments.json' });

      archive.finalize();
    }).catch(reject);
  });
}

/**
 * Crea export CSV
 */
async function createCsvExport(
  companyId: string,
  exportId: string,
  includeTables: string[] | 'all'
): Promise<string> {
  const exportDir = path.join(process.cwd(), 'exports', companyId);
  const csvPath = path.join(exportDir, `${exportId}.csv`);

  // Export clients come CSV principale
  const clients = await exportClientsData(companyId);
  
  if (clients.length === 0) {
    // Crea CSV vuoto
    fs.writeFileSync(csvPath, '');
    return `exports/${companyId}/${exportId}.csv`;
  }

  const csvWriter = createObjectCsvWriter({
    path: csvPath,
    header: [
      { id: 'id', title: 'ID' },
      { id: 'nome', title: 'Nome' },
      { id: 'cognome', title: 'Cognome' },
      { id: 'indirizzo', title: 'Indirizzo' },
      { id: 'citta', title: 'Città' },
      { id: 'cap', title: 'CAP' },
      { id: 'telefono', title: 'Telefono' },
      { id: 'email', title: 'Email' },
      { id: 'note', title: 'Note' },
      { id: 'createdAt', title: 'Data Creazione' },
    ],
  });

  await csvWriter.writeRecords(clients);
  return `exports/${companyId}/${exportId}.csv`;
}

/**
 * Crea export JSON
 */
async function createJsonExport(
  companyId: string,
  exportId: string,
  includeTables: string[] | 'all'
): Promise<string> {
  const exportDir = path.join(process.cwd(), 'exports', companyId);
  const jsonPath = path.join(exportDir, `${exportId}.json`);

  const data = {
    company: await exportCompanyData(companyId),
    users: await exportUsersData(companyId),
    clients: await exportClientsData(companyId),
    jobs: await exportJobsData(companyId),
    quotes: await exportQuotesData(companyId),
    payments: await exportPaymentsData(companyId),
    exportedAt: new Date().toISOString(),
  };

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  return `exports/${companyId}/${exportId}.json`;
}

/**
 * Helper per export dati company
 */
async function exportCompanyData(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      ragioneSociale: true,
      piva: true,
      indirizzo: true,
      telefono: true,
      email: true,
      pianoAbbonamento: true,
      abbonamentoAttivo: true,
      dataScadenza: true,
      createdAt: true,
    },
  });
  return company;
}

/**
 * Helper per export utenti
 */
async function exportUsersData(companyId: string) {
  return prisma.user.findMany({
    where: { companyId },
    select: {
      id: true,
      nome: true,
      cognome: true,
      email: true,
      telefono: true,
      ruolo: true,
      attivo: true,
      createdAt: true,
    },
  });
}

/**
 * Helper per export clienti
 */
async function exportClientsData(companyId: string) {
  return prisma.client.findMany({
    where: { companyId },
    include: {
      sites: true,
    },
  });
}

/**
 * Helper per export lavori
 */
async function exportJobsData(companyId: string) {
  return prisma.job.findMany({
    where: { companyId },
    include: {
      client: {
        select: {
          id: true,
          nome: true,
          cognome: true,
        },
      },
      tecnico: {
        select: {
          id: true,
          nome: true,
          cognome: true,
        },
      },
    },
  });
}

/**
 * Helper per export preventivi
 */
async function exportQuotesData(companyId: string) {
  return prisma.quote.findMany({
    where: { companyId },
    include: {
      client: {
        select: {
          id: true,
          nome: true,
          cognome: true,
        },
      },
    },
  });
}

/**
 * Helper per export pagamenti
 */
async function exportPaymentsData(companyId: string) {
  return prisma.payment.findMany({
    where: { companyId },
  });
}

// Event handlers
dataExportWorker.on('completed', (job) => {
  console.log(`✅ Data export job ${job.id} completed`);
});

dataExportWorker.on('failed', (job, err) => {
  console.error(`❌ Data export job ${job?.id} failed:`, err.message);
});

dataExportWorker.on('error', (err) => {
  console.error('Data export worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down data export worker...');
  await dataExportWorker.close();
  process.exit(0);
});

