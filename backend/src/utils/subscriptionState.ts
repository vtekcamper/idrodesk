import { SubscriptionStatus, PianoAbbonamento } from '@prisma/client';

/**
 * Calcola lo stato di abbonamento di una company basandosi su:
 * - dataScadenza
 * - abbonamentoAttivo
 * - pianoAbbonamento
 */
export function calculateSubscriptionStatus(
  dataScadenza: Date | null,
  abbonamentoAttivo: boolean,
  pianoAbbonamento: PianoAbbonamento,
  deletedAt: Date | null
): SubscriptionStatus {
  // Se è soft deleted, ritorna DELETED
  if (deletedAt) {
    return SubscriptionStatus.DELETED;
  }

  // Se non è attivo, ritorna CANCELED
  if (!abbonamentoAttivo) {
    return SubscriptionStatus.CANCELED;
  }

  // Se non c'è data scadenza, assume TRIAL o ACTIVE
  if (!dataScadenza) {
    // Se è BASIC e non ha scadenza, probabilmente è in trial
    if (pianoAbbonamento === PianoAbbonamento.BASIC) {
      return SubscriptionStatus.TRIAL;
    }
    return SubscriptionStatus.ACTIVE;
  }

  const now = new Date();
  const scadenza = new Date(dataScadenza);
  const giorniRimanenti = Math.ceil((scadenza.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Se scaduto da più di 7 giorni, è SUSPENDED
  if (giorniRimanenti < -7) {
    return SubscriptionStatus.SUSPENDED;
  }

  // Se scaduto ma meno di 7 giorni, è PAST_DUE
  if (giorniRimanenti < 0) {
    return SubscriptionStatus.PAST_DUE;
  }

  // Se scade tra più di 30 giorni o è ELITE, è ACTIVE
  if (giorniRimanenti > 30 || pianoAbbonamento === PianoAbbonamento.ELITE) {
    return SubscriptionStatus.ACTIVE;
  }

  // Se scade tra 0-30 giorni e non è ELITE, potrebbe essere ancora ACTIVE
  // ma monitoriamo per alert
  return SubscriptionStatus.ACTIVE;
}

/**
 * Aggiorna lo stato di abbonamento di una company
 */
export async function updateCompanySubscriptionStatus(
  prisma: any,
  companyId: string
): Promise<SubscriptionStatus> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      dataScadenza: true,
      abbonamentoAttivo: true,
      pianoAbbonamento: true,
      deletedAt: true,
      subscriptionStatus: true,
    },
  });

  if (!company) {
    throw new Error('Company non trovata');
  }

  const newStatus = calculateSubscriptionStatus(
    company.dataScadenza,
    company.abbonamentoAttivo,
    company.pianoAbbonamento,
    company.deletedAt
  );

  // Aggiorna solo se lo stato è cambiato
  if (company.subscriptionStatus !== newStatus) {
    await prisma.company.update({
      where: { id: companyId },
      data: { subscriptionStatus: newStatus },
    });
  }

  return newStatus;
}

/**
 * Job per aggiornare stati di tutte le company
 * Da eseguire periodicamente (es. ogni ora)
 */
export async function updateAllSubscriptionStatuses(prisma: any) {
  const companies = await prisma.company.findMany({
    where: {
      deletedAt: null, // Solo company non eliminate
    },
    select: {
      id: true,
      dataScadenza: true,
      abbonamentoAttivo: true,
      pianoAbbonamento: true,
      deletedAt: true,
      subscriptionStatus: true,
    },
  });

  const updates = companies.map((company) => {
    const newStatus = calculateSubscriptionStatus(
      company.dataScadenza,
      company.abbonamentoAttivo,
      company.pianoAbbonamento,
      company.deletedAt
    );

    if (company.subscriptionStatus !== newStatus) {
      return prisma.company.update({
        where: { id: company.id },
        data: { subscriptionStatus: newStatus },
      });
    }

    return Promise.resolve(null);
  });

  await Promise.all(updates.filter((u) => u !== null));

  return {
    total: companies.length,
    updated: updates.filter((u) => u !== null).length,
  };
}

/**
 * Ottiene badge color e label per stato
 */
export function getSubscriptionStatusBadge(status: SubscriptionStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case SubscriptionStatus.TRIAL:
      return {
        label: 'Trial',
        color: 'text-blue-800',
        bgColor: 'bg-blue-100',
      };
    case SubscriptionStatus.ACTIVE:
      return {
        label: 'Attivo',
        color: 'text-green-800',
        bgColor: 'bg-green-100',
      };
    case SubscriptionStatus.PAST_DUE:
      return {
        label: 'Scaduto',
        color: 'text-yellow-800',
        bgColor: 'bg-yellow-100',
      };
    case SubscriptionStatus.SUSPENDED:
      return {
        label: 'Sospeso',
        color: 'text-red-800',
        bgColor: 'bg-red-100',
      };
    case SubscriptionStatus.CANCELED:
      return {
        label: 'Cancellato',
        color: 'text-gray-800',
        bgColor: 'bg-gray-100',
      };
    case SubscriptionStatus.DELETED:
      return {
        label: 'Eliminato',
        color: 'text-gray-600',
        bgColor: 'bg-gray-200',
      };
    default:
      return {
        label: 'Sconosciuto',
        color: 'text-gray-800',
        bgColor: 'bg-gray-100',
      };
  }
}

