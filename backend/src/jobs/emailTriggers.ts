import prisma from '../config/database';
import {
  sendSubscriptionExpiringEmailHelper,
  sendSubscriptionExpiredEmailHelper,
  sendPaymentSuccessEmailHelper,
  sendPaymentFailedEmailHelper,
  sendPlanChangeEmailHelper,
} from '../controllers/emailController';
import { SubscriptionStatus } from '@prisma/client';
import { calculateSubscriptionStatus } from '../utils/subscriptionState';

/**
 * Job per inviare email di trial in scadenza
 * Da eseguire giornalmente
 */
export async function sendTrialExpiringEmails() {
  try {
    console.log('📧 Checking for trial expiring companies...');

    // Trova company in trial che scadono tra 3 giorni
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const companies = await prisma.company.findMany({
      where: {
        deletedAt: null,
        abbonamentoAttivo: true,
        pianoAbbonamento: 'BASIC',
        dataScadenza: {
          lte: threeDaysFromNow,
          gte: new Date(), // Non ancora scaduto
        },
      },
    });

    for (const company of companies) {
      const daysUntilExpiry = Math.ceil(
        (new Date(company.dataScadenza!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      // Invia email solo se tra 1-7 giorni
      if (daysUntilExpiry >= 1 && daysUntilExpiry <= 7) {
        await sendSubscriptionExpiringEmailHelper(company.id, daysUntilExpiry);
        console.log(`📧 Sent trial expiring email to ${company.ragioneSociale}`);
      }
    }

    return { sent: companies.length };
  } catch (error: any) {
    console.error('Error sending trial expiring emails:', error);
    throw error;
  }
}

/**
 * Job per inviare email abbonamento scaduto
 * Da eseguire giornalmente
 */
export async function sendSubscriptionExpiredEmails() {
  try {
    console.log('📧 Checking for expired subscriptions...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const companies = await prisma.company.findMany({
      where: {
        deletedAt: null,
        abbonamentoAttivo: true,
        dataScadenza: {
          lte: yesterday,
        },
        subscriptionStatus: {
          in: [SubscriptionStatus.PAST_DUE, SubscriptionStatus.SUSPENDED],
        },
      },
    });

    for (const company of companies) {
      // Verifica che non abbiamo già inviato email oggi
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const recentEmail = await prisma.emailNotification.findFirst({
        where: {
          companyId: company.id,
          type: 'SUBSCRIPTION_EXPIRED',
          createdAt: {
            gte: today,
          },
        },
      });

      if (!recentEmail) {
        await sendSubscriptionExpiredEmailHelper(company.id);
        console.log(`📧 Sent subscription expired email to ${company.ragioneSociale}`);
      }
    }

    return { sent: companies.length };
  } catch (error: any) {
    console.error('Error sending subscription expired emails:', error);
    throw error;
  }
}

/**
 * Job per inviare email reminder abbonamento in scadenza
 * Da eseguire giornalmente
 */
export async function sendSubscriptionReminderEmails() {
  try {
    console.log('📧 Checking for subscriptions expiring soon...');

    // Trova abbonamenti che scadono tra 7, 3, 1 giorni
    const reminders = [7, 3, 1];

    for (const days of reminders) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const companies = await prisma.company.findMany({
        where: {
          deletedAt: null,
          abbonamentoAttivo: true,
          dataScadenza: {
            gte: targetDate,
            lt: nextDay,
          },
          subscriptionStatus: SubscriptionStatus.ACTIVE,
        },
      });

      for (const company of companies) {
        // Verifica che non abbiamo già inviato reminder per questo giorno
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const recentEmail = await prisma.emailNotification.findFirst({
          where: {
            companyId: company.id,
            type: 'SUBSCRIPTION_EXPIRING',
            createdAt: {
              gte: today,
            },
            metadata: {
              contains: `"daysUntilExpiry":${days}`,
            },
          },
        });

        if (!recentEmail) {
          await sendSubscriptionExpiringEmailHelper(company.id, days);
          console.log(`📧 Sent ${days}-day reminder to ${company.ragioneSociale}`);
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending subscription reminder emails:', error);
    throw error;
  }
}

/**
 * Integra trigger email nei controller esistenti
 * Questa funzione viene chiamata quando:
 * - Pagamento riuscito (da paymentController)
 * - Pagamento fallito (da paymentController)
 * - Cambio piano (da adminController)
 */
export async function triggerPaymentSuccessEmail(
  companyId: string,
  amount: number,
  expiryDate: Date
) {
  try {
    await sendPaymentSuccessEmailHelper(companyId, amount, expiryDate);
  } catch (error) {
    console.error('Error triggering payment success email:', error);
  }
}

export async function triggerPaymentFailedEmail(
  companyId: string,
  amount: number,
  errorMessage: string
) {
  try {
    await sendPaymentFailedEmailHelper(companyId, amount, errorMessage);
  } catch (error) {
    console.error('Error triggering payment failed email:', error);
  }
}

export async function triggerPlanChangeEmail(
  companyId: string,
  oldPlan: string,
  newPlan: string,
  isUpgrade: boolean
) {
  try {
    await sendPlanChangeEmailHelper(companyId, oldPlan, newPlan, isUpgrade);
  } catch (error) {
    console.error('Error triggering plan change email:', error);
  }
}

