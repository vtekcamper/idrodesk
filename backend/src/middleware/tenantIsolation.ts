import { Request, Response, NextFunction } from 'express';

/**
 * Middleware per garantire tenant isolation esplicita
 * Verifica che req.companyId sia presente e valido per richieste tenant
 * 
 * IMPORTANTE: Questo middleware deve essere usato dopo authenticate
 * e solo per route che richiedono un tenant (non per super admin routes)
 */
export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  // Super admin può bypassare tenant isolation
  if (req.user?.isSuperAdmin) {
    return next();
  }

  // Verifica che l'utente sia autenticato
  if (!req.user) {
    return res.status(401).json({
      error: 'Autenticazione richiesta',
      code: 'UNAUTHORIZED',
    });
  }

  // Verifica che companyId sia presente
  if (!req.companyId) {
    return res.status(403).json({
      error: 'Accesso negato: tenant non identificato',
      code: 'TENANT_REQUIRED',
    });
  }

  // Verifica che l'utente appartenga al tenant richiesto
  // (se companyId è passato come parametro o nel body)
  const requestedCompanyId = req.params?.companyId || req.body?.companyId || req.query?.companyId;
  
  if (requestedCompanyId && requestedCompanyId !== req.companyId) {
    return res.status(403).json({
      error: 'Accesso negato: tenant non autorizzato',
      code: 'TENANT_MISMATCH',
    });
  }

  next();
};

/**
 * Helper per applicare automaticamente companyId a query Prisma
 * Usa questo helper in tutti i controller per garantire tenant isolation
 */
export function withTenantFilter<T extends { companyId?: string }>(
  companyId: string | undefined,
  filter: Partial<T>
): Partial<T> {
  if (!companyId) {
    throw new Error('companyId is required for tenant isolation');
  }

  return {
    ...filter,
    companyId,
  } as Partial<T>;
}

/**
 * Verifica che una risorsa appartenga al tenant corrente
 * Usa questo helper prima di operazioni su risorse specifiche
 */
export async function verifyTenantOwnership(
  prisma: any,
  model: string,
  resourceId: string,
  companyId: string
): Promise<boolean> {
  try {
    const resource = await prisma[model].findUnique({
      where: { id: resourceId },
      select: { companyId: true },
    });

    if (!resource) {
      return false;
    }

    return resource.companyId === companyId;
  } catch (error) {
    console.error(`Error verifying tenant ownership for ${model}:`, error);
    return false;
  }
}

