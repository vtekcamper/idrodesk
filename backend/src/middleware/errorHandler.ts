import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Error handler globale
 * Logga errori e ritorna risposte appropriate
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log errore con contesto
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.requestId,
    userId: req.user?.userId,
    companyId: req.user?.companyId,
  });

  // Gestione errori specifici
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: err.message,
      code: 'VALIDATION_ERROR',
    });
  }

  if (err.name === 'UnauthorizedError' || err.message.includes('Token')) {
    return res.status(401).json({ 
      error: 'Non autorizzato',
      code: 'UNAUTHORIZED',
    });
  }

  // Errore generico
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Errore interno del server',
    code: 'INTERNAL_ERROR',
    requestId: req.requestId,
  });
};

