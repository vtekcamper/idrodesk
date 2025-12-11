import { Ruolo } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        companyId: string;
        role: Ruolo;
        email: string;
      };
      companyId?: string;
    }
  }
}

export {};

