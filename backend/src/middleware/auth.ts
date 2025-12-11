import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token non fornito' });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    req.user = {
      userId: payload.userId,
      companyId: payload.companyId,
      role: payload.role as any,
      email: payload.email,
    };
    req.companyId = payload.companyId;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token non valido' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non autenticato' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permessi insufficienti' });
    }

    next();
  };
};

