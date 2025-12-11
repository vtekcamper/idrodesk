import { Prisma } from '@prisma/client';
import prisma from '../config/database';

/**
 * Helper per aggiungere automaticamente il filtro companyId alle query Prisma
 */
export const withCompanyFilter = <T extends { companyId?: string }>(
  companyId: string,
  data: T
): T & { companyId: string } => {
  return { ...data, companyId };
};

/**
 * Helper per filtrare automaticamente le query per companyId
 */
export const findManyWithCompany = async <T>(
  model: any,
  companyId: string,
  where?: any
) => {
  return model.findMany({
    where: {
      ...where,
      companyId,
    },
  });
};

export const findUniqueWithCompany = async <T>(
  model: any,
  companyId: string,
  where: any
) => {
  const result = await model.findUnique({
    where,
  });

  if (!result || result.companyId !== companyId) {
    return null;
  }

  return result;
};

