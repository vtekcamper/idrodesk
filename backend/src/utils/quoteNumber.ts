import prisma from '../config/database';

/**
 * Genera un numero preventivo univoco per una company usando DocumentSettings
 * Formato: {prefix}-{nextNumber} (es. PREV-0001)
 */
export async function generateQuoteNumber(companyId: string): Promise<string> {
  // Ottieni o crea DocumentSettings
  let docSettings = await prisma.documentSettings.findUnique({
    where: { companyId },
  });

  if (!docSettings) {
    docSettings = await prisma.documentSettings.create({
      data: {
        companyId,
        quotePrefix: 'PREV',
        quoteNextNumber: 1,
      },
    });
  }

  const prefix = docSettings.quotePrefix || 'PREV';
  const nextNumber = docSettings.quoteNextNumber || 1;

  // Incrementa il numero in modo atomico
  await prisma.documentSettings.update({
    where: { companyId },
    data: {
      quoteNextNumber: {
        increment: 1,
      },
    },
  });

  // Formatta con padding a 4 cifre
  const formattedNumber = nextNumber.toString().padStart(4, '0');

  return `${prefix}-${formattedNumber}`;
}

/**
 * Genera un numero intervento univoco per una company usando DocumentSettings
 */
export async function generateJobNumber(companyId: string): Promise<string> {
  // Ottieni o crea DocumentSettings
  let docSettings = await prisma.documentSettings.findUnique({
    where: { companyId },
  });

  if (!docSettings) {
    docSettings = await prisma.documentSettings.create({
      data: {
        companyId,
        jobPrefix: 'INT',
        jobNextNumber: 1,
      },
    });
  }

  const prefix = docSettings.jobPrefix || 'INT';
  const nextNumber = docSettings.jobNextNumber || 1;

  // Incrementa il numero in modo atomico
  await prisma.documentSettings.update({
    where: { companyId },
    data: {
      jobNextNumber: {
        increment: 1,
      },
    },
  });

  // Formatta con padding a 4 cifre
  const formattedNumber = nextNumber.toString().padStart(4, '0');

  return `${prefix}-${formattedNumber}`;
}

