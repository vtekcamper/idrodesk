import { Request, Response } from 'express';
import prisma from '../config/database';
import Stripe from 'stripe';
import { PaymentProvider, PaymentStatus } from '@prisma/client';
import { updateCompanySubscriptionStatus } from '../utils/subscriptionState';

// Inizializza Stripe solo se la chiave è presente
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY non configurata');
  }
  return new Stripe(secretKey, {
    apiVersion: '2023-10-16',
  });
};

/**
 * Crea un pagamento (Stripe o PayPal)
 */
export const createPayment = async (req: Request, res: Response) => {
  try {
    const { companyId, amount, currency, paymentMethod, paymentProvider, subscriptionHistoryId } = req.body;

    if (!companyId || !amount || !paymentMethod || !paymentProvider) {
      return res.status(400).json({ error: 'Dati mancanti' });
    }

    // Verifica che l'azienda esista
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return res.status(404).json({ error: 'Azienda non trovata' });
    }

    let providerPaymentId: string | null = null;
    let status: PaymentStatus = PaymentStatus.PENDING;

    // Crea pagamento con Stripe
    if (paymentProvider === PaymentProvider.STRIPE) {
      try {
        const stripe = getStripe();
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Converti in centesimi
          currency: currency.toLowerCase(),
          payment_method_types: ['card'],
          metadata: {
            companyId,
            subscriptionHistoryId: subscriptionHistoryId || '',
          },
        });

        providerPaymentId = paymentIntent.id;
        status = PaymentStatus.PROCESSING;
      } catch (error: any) {
        console.error('Stripe error:', error);
        return res.status(500).json({ error: 'Errore nella creazione pagamento Stripe: ' + error.message });
      }
    }

    // Crea record pagamento nel database
    const payment = await prisma.payment.create({
      data: {
        companyId,
        subscriptionHistoryId: subscriptionHistoryId || null,
        amount,
        currency,
        status,
        paymentMethod,
        paymentProvider,
        providerPaymentId,
      },
      include: {
        company: {
          select: {
            id: true,
            ragioneSociale: true,
          },
        },
      },
    });

    let clientSecret: string | null = null;
    if (paymentProvider === PaymentProvider.STRIPE && providerPaymentId) {
      try {
        const stripe = getStripe();
        const intent = await stripe.paymentIntents.retrieve(providerPaymentId);
        clientSecret = intent.client_secret;
      } catch (error) {
        console.error('Error retrieving payment intent:', error);
      }
    }

    res.status(201).json({
      payment,
      clientSecret,
    });
  } catch (error: any) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: error.message || 'Errore nella creazione pagamento' });
  }
};

/**
 * Webhook Stripe per confermare pagamenti (con idempotency)
 */
export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    // Verifica idempotency: controlla se l'evento è già stato processato
    const existingEvent = await prisma.stripeEvent.findUnique({
      where: { id: event.id },
    });

    if (existingEvent && existingEvent.processed) {
      console.log(`Event ${event.id} already processed, skipping`);
      return res.json({ received: true, message: 'Event already processed' });
    }

    // Salva evento (anche se non processato ancora, per tracking)
    await prisma.stripeEvent.upsert({
      where: { id: event.id },
      create: {
        id: event.id,
        eventType: event.type,
        processed: false,
        metadata: event.data.object as any,
      },
      update: {
        eventType: event.type,
        metadata: event.data.object as any,
      },
    });

    // Processa evento in base al tipo
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        case 'invoice.payment_succeeded':
          await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Marca evento come processato
      await prisma.stripeEvent.update({
        where: { id: event.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });

      res.json({ received: true });
    } catch (processError: any) {
      // Salva errore ma marca come processato per evitare retry infiniti
      await prisma.stripeEvent.update({
        where: { id: event.id },
        data: {
          processed: true,
          processedAt: new Date(),
          error: processError.message,
        },
      });

      console.error(`Error processing event ${event.id}:`, processError);
      // Rispondi 200 per evitare retry da Stripe, ma logga l'errore
      res.status(200).json({ received: true, error: processError.message });
    }
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
};

/**
 * Gestisce payment_intent.succeeded
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  await prisma.payment.updateMany({
    where: { providerPaymentId: paymentIntent.id },
    data: {
      status: PaymentStatus.COMPLETED,
      paidAt: new Date(),
    },
  });

  // Aggiorna abbonamento azienda se necessario
  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId: paymentIntent.id },
    include: { company: true },
  });

  if (payment && payment.subscriptionHistoryId) {
    // Rinnova abbonamento (30 giorni)
    const newExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    await prisma.company.update({
      where: { id: payment.companyId },
      data: {
        abbonamentoAttivo: true,
        dataScadenza: newExpiryDate,
      },
    });

    // Aggiorna subscription status
    await updateCompanySubscriptionStatus(prisma, payment.companyId);
  }
}

/**
 * Gestisce payment_intent.payment_failed
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  await prisma.payment.updateMany({
    where: { providerPaymentId: paymentIntent.id },
    data: {
      status: PaymentStatus.FAILED,
    },
  });
}

/**
 * Gestisce charge.refunded
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  // Trova payment intent associato
  const paymentIntentId = typeof charge.payment_intent === 'string' 
    ? charge.payment_intent 
    : charge.payment_intent?.id;

  if (paymentIntentId) {
    await prisma.payment.updateMany({
      where: { providerPaymentId: paymentIntentId },
      data: {
        status: PaymentStatus.REFUNDED,
      },
    });
  }
}

/**
 * Gestisce invoice.payment_succeeded
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Se l'invoice ha un payment intent, aggiorna il payment
  const paymentIntentId = typeof invoice.payment_intent === 'string'
    ? invoice.payment_intent
    : invoice.payment_intent?.id;

  if (paymentIntentId) {
    await handlePaymentIntentSucceeded({
      id: paymentIntentId,
    } as Stripe.PaymentIntent);
  }
}

/**
 * Gestisce invoice.payment_failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const paymentIntentId = typeof invoice.payment_intent === 'string'
    ? invoice.payment_intent
    : invoice.payment_intent?.id;

  if (paymentIntentId) {
    await handlePaymentIntentFailed({
      id: paymentIntentId,
    } as Stripe.PaymentIntent);
  }
}

/**
 * Ottiene tutti i pagamenti
 */
export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const { companyId, status, paymentProvider } = req.query;

    const where: any = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (status) {
      where.status = status;
    }

    if (paymentProvider) {
      where.paymentProvider = paymentProvider;
    }

    const payments = await prisma.payment.findMany({
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
    });

    res.json(payments);
  } catch (error: any) {
    console.error('Get all payments error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero pagamenti' });
  }
};

/**
 * Ottiene un singolo pagamento
 */
export const getPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            ragioneSociale: true,
            pianoAbbonamento: true,
          },
        },
        subscriptionHistory: true,
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pagamento non trovato' });
    }

    res.json(payment);
  } catch (error: any) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero pagamento' });
  }
};

