import prisma from '../config/database';
import { SubscriptionStatus, ExportStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

/**
 * Job per hard delete company eliminate da più di 30 giorni
 * Da eseguire giornalmente
 */
export async function hardDeleteExpiredCompanies() {
  try {
    console.log('🗑️  Checking for companies to hard delete...');

    // Trova company eliminate da più di 30 giorni
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const companies = await prisma.company.findMany({
      where: {
        deletedAt: {
          not: null,
          lte: thirtyDaysAgo,
        },
        subscriptionStatus: SubscriptionStatus.DELETED,
      },
      select: {
        id: true,
        ragioneSociale: true,
        deletedAt: true,
      },
    });

    let deleted = 0;
    let errors = 0;

    for (const company of companies) {
      try {
        console.log(`🗑️  Hard deleting company ${company.id} (${company.ragioneSociale})`);

        // Elimina file export se esistono
        const exportDir = path.join(process.cwd(), 'exports', company.id);
        if (fs.existsSync(exportDir)) {
          fs.rmSync(exportDir, { recursive: true, force: true });
          console.log(`  ✅ Deleted export files for ${company.id}`);
        }

        // Hard delete: Prisma cascade eliminerà tutti i dati correlati
        await prisma.company.delete({
          where: { id: company.id },
        });

        deleted++;
        console.log(`  ✅ Hard deleted company ${company.id}`);
      } catch (error: any) {
        errors++;
        console.error(`  ❌ Error hard deleting company ${company.id}:`, error.message);
      }
    }

    return {
      total: companies.length,
      deleted,
      errors,
    };
  } catch (error: any) {
    console.error('Error in hard delete job:', error);
    throw error;
  }
}

/**
 * Job per pulire export scaduti
 */
export async function cleanupExpiredExports() {
  try {
    console.log('🧹 Cleaning up expired exports...');

    const now = new Date();
    const exports = await prisma.dataExport.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
        status: ExportStatus.COMPLETED,
      },
    });

    let deleted = 0;

    for (const exp of exports) {
      try {
        // Elimina file
        if (exp.fileUrl) {
          const filePath = path.join(process.cwd(), exp.fileUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        // Aggiorna status
        await prisma.dataExport.update({
          where: { id: exp.id },
          data: {
            status: ExportStatus.EXPIRED,
            fileUrl: null,
          },
        });

        deleted++;
      } catch (error: any) {
        console.error(`Error cleaning up export ${exp.id}:`, error.message);
      }
    }

    return { deleted };
  } catch (error: any) {
    console.error('Error in cleanup expired exports:', error);
    throw error;
  }
}

