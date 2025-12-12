import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiter generale per tutte le API
 * 100 richieste per minuto per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 richieste per finestra
  message: {
    error: 'Troppe richieste, riprova più tardi',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  // Skip rate limiting per super admin (opzionale, da valutare)
  skip: (req: Request) => {
    // Se è un super admin autenticato, può avere limiti più alti
    // Ma per sicurezza manteniamo il rate limit anche per loro
    return false;
  },
});

/**
 * Rate limiter per login (brute force protection)
 * 5 tentativi per 15 minuti per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // 5 tentativi per finestra
  message: {
    error: 'Troppi tentativi di login. Riprova tra 15 minuti.',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Usa IP + email come chiave per limitare anche per email
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const email = req.body?.email || '';
    return `${ip}:${email}`;
  },
  skipSuccessfulRequests: true, // Non contare i login riusciti
});

/**
 * Rate limiter per creazione risorse (prevenire spam)
 * 20 creazioni per ora per IP
 */
export const createRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 20, // 20 creazioni per ora
  message: {
    error: 'Troppe creazioni. Riprova più tardi.',
    code: 'CREATE_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter per email sending (prevenire spam email)
 * 10 email per ora per utente
 */
export const emailRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 10, // 10 email per ora
  message: {
    error: 'Limite email raggiunto. Riprova più tardi.',
    code: 'EMAIL_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Usa userId come chiave se autenticato, altrimenti IP
  keyGenerator: (req: Request) => {
    if (req.user?.userId) {
      return `user:${req.user.userId}`;
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

/**
 * Rate limiter per export dati (GDPR export può essere pesante)
 * 3 export per giorno per company
 */
export const exportRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 ore
  max: 3, // 3 export per giorno
  message: {
    error: 'Limite export raggiunto. Riprova domani.',
    code: 'EXPORT_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Usa companyId come chiave
  keyGenerator: (req: Request) => {
    const companyId = req.params?.id || req.body?.companyId || req.user?.companyId;
    return `export:${companyId || req.ip || 'unknown'}`;
  },
});

