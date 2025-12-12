import prisma from '../config/database';
import { updateAllSubscriptionStatuses } from '../utils/subscriptionState';

/**
 * Job per aggiornare stati abbonamento di tutte le company
 * Da eseguire periodicamente (es. ogni ora via cron o scheduler)
 */
export async function runSubscriptionStateJob() {
  try {
    console.log('🔄 Running subscription state update job...');
    const result = await updateAllSubscriptionStatuses(prisma);
    console.log(`✅ Subscription state job completed: ${result.updated}/${result.total} updated`);
    return result;
  } catch (error: any) {
    console.error('❌ Error running subscription state job:', error);
    throw error;
  }
}

/**
 * Avvia job periodico (se eseguito come processo separato)
 * Altrimenti può essere chiamato da cron job esterno
 */
if (require.main === module) {
  // Esegui job se chiamato direttamente
  runSubscriptionStateJob()
    .then(() => {
      console.log('Job completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Job failed:', error);
      process.exit(1);
    });
}

