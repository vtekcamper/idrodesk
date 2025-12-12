import { Request, Response, NextFunction } from 'express';

/**
 * Middleware per verificare che l'utente sia super admin
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  if (!req.user.isSuperAdmin) {
    return res.status(403).json({ error: 'Accesso negato. Solo super admin.' });
  }

  next();
};


