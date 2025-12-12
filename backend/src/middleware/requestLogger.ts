import { Request, Response, NextFunction } from 'express';
import { logger, logRequest } from '../utils/logger';

/**
 * Middleware per loggare tutte le richieste HTTP
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log quando la risposta è completata
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logRequest(req, res, responseTime);
  });

  next();
};

