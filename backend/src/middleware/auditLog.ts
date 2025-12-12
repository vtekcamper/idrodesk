import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { randomUUID } from 'crypto';

// Estendiamo Request per includere requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      skipAudit?: boolean; // Flag per saltare audit log (es. health check)
    }
  }
}

/**
 * Middleware per generare requestId univoco per ogni richiesta
 * Utile per tracciare richieste e correlare log
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  req.requestId = randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

/**
 * Middleware per loggare automaticamente azioni critiche
 * 
 * Azioni loggate:
 * - LOGIN, LOGOUT
 * - IMPERSONATE, STOP_IMPERSONATE
 * - CHANGE_PLAN, TOGGLE_SUBSCRIPTION
 * - CREATE_PAYMENT, UPDATE_PAYMENT
 * - SEND_EMAIL
 * - EXPORT_DATA
 * - DELETE (soft delete)
 * - CREATE_USER, UPDATE_USER, DELETE_USER
 * - CREATE_COMPANY, UPDATE_COMPANY, DELETE_COMPANY
 */
export const auditLog = async (
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Record<string, any>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Salta audit log se esplicitamente richiesto
    if (req.skipAudit) {
      return next();
    }

    // Salta audit log per route pubbliche (health check, etc.)
    if (req.path === '/health' || req.path.startsWith('/api-docs')) {
      return next();
    }

    // Esegui la richiesta originale
    const originalSend = res.send;
    res.send = function (body: any) {
      // Logga dopo che la risposta è stata inviata
      logAuditEntry(req, action, entity, entityId, metadata, res.statusCode)
        .catch((error) => {
          console.error('Error logging audit entry:', error);
          // Non blocchiamo la risposta se l'audit log fallisce
        });

      return originalSend.call(this, body);
    };

    next();
  };
};

/**
 * Helper per creare entry audit log
 */
async function logAuditEntry(
  req: Request,
  action: string,
  entity: string,
  entityId: string | undefined,
  metadata: Record<string, any> | undefined,
  statusCode: number
) {
  try {
    // Determina actorType e actorId
    let actorType: string = 'SYSTEM';
    let actorId: string | undefined = undefined;

    if (req.user) {
      actorType = req.user.isSuperAdmin ? 'SUPER_ADMIN' : 'USER';
      actorId = req.user.userId;
    }

    // Estrai entityId da params, body o metadata se non fornito
    if (!entityId) {
      entityId = req.params?.id || req.body?.id || req.params?.companyId || req.params?.userId;
    }

    // Prepara metadata con informazioni aggiuntive
    const auditMetadata: any = {
      ...metadata,
      method: req.method,
      path: req.path,
      statusCode,
      requestId: req.requestId,
    };

    // Aggiungi before/after se presente nel body
    if (req.body?.before) {
      auditMetadata.before = req.body.before;
    }
    if (req.body?.after) {
      auditMetadata.after = req.body.after;
    }

    // Crea entry audit log
    await prisma.auditLog.create({
      data: {
        actorType,
        actorId,
        companyId: req.companyId || req.body?.companyId || req.params?.companyId || null,
        action,
        entity,
        entityId: entityId || null,
        metadata: auditMetadata,
        ip: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get('user-agent') || null,
        requestId: req.requestId || null,
      },
    });
  } catch (error) {
    console.error('Error creating audit log entry:', error);
    // Non lanciare errore per non bloccare la richiesta
  }
}

/**
 * Helper per loggare azioni manualmente (quando il middleware non è sufficiente)
 */
export async function logAuditAction(
  req: Request,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Record<string, any>
) {
  try {
    let actorType: string = 'SYSTEM';
    let actorId: string | undefined = undefined;

    if (req.user) {
      actorType = req.user.isSuperAdmin ? 'SUPER_ADMIN' : 'USER';
      actorId = req.user.userId;
    }

    await prisma.auditLog.create({
      data: {
        actorType,
        actorId,
        companyId: req.companyId || null,
        action,
        entity,
        entityId: entityId || null,
        metadata: metadata || {},
        ip: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get('user-agent') || null,
        requestId: req.requestId || null,
      },
    });
  } catch (error) {
    console.error('Error logging audit action:', error);
  }
}

