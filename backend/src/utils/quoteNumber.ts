import prisma from '../config/database';

/**
 * Genera un numero preventivo univoco per una company
 * Formato: PREV-YYYY-NNNN (es. PREV-2024-0001)
 */
export async function generateQuoteNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PREV-${year}-`;

  // Trova l'ultimo preventivo dell'anno corrente
  const lastQuote = await prisma.quote.findFirst({
    where: {
      companyId,
      numeroPreventivo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      numeroPreventivo: 'desc',
    },
  });

  let nextNumber = 1;

  if (lastQuote) {
    // Estrai il numero dall'ultimo preventivo
    const lastNumber = parseInt(lastQuote.numeroPreventivo.split('-')[2] || '0', 10);
    nextNumber = lastNumber + 1;
  }

  // Formatta con padding a 4 cifre
  const formattedNumber = nextNumber.toString().padStart(4, '0');

  return `${prefix}${formattedNumber}`;
}

