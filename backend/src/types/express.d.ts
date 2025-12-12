import { Ruolo } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        companyId?: string;
        role: Ruolo;
        email: string;
        isSuperAdmin?: boolean;
        isImpersonated?: boolean;
        impersonatedBy?: string;
      };
      companyId?: string;
      requestId?: string;
      skipAudit?: boolean;
    }
  }
}

export {};

