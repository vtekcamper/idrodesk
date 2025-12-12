import { Request, Response } from 'express';
import prisma from '../config/database';
import Stripe from 'stripe';
import { PaymentProvider, PaymentStatus } from '@prisma/client';

// Inizializza Stripe solo se la chiave è presente
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY non configurata');
  }
  return new Stripe(secretKey, {
    apiVersion: '2024-11-20.acacia',
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
 * Webhook Stripe per confermare pagamenti
 */
export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
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
        // Rinnova abbonamento
        await prisma.company.update({
          where: { id: payment.companyId },
          data: {
            abbonamentoAttivo: true,
            dataScadenza: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 giorni
          },
        });
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
};

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

