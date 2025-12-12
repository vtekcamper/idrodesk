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
      };
      companyId?: string;
    }
  }
}

export {};

