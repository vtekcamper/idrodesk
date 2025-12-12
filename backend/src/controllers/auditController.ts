import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Ottiene tutti gli audit log con filtri e paginazione
 */
export const getAllAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '50',
      actorType,
      action,
      entity,
      companyId,
      actorId,
      startDate,
      endDate,
      search,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (actorType) {
      where.actorType = actorType;
    }

    if (action) {
      where.action = action;
    }

    if (entity) {
      where.entity = entity;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (actorId) {
      where.actorId = actorId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    // Search in metadata (action, entity, etc.)
    if (search) {
      where.OR = [
        { action: { contains: search as string, mode: 'insensitive' } },
        { entity: { contains: search as string, mode: 'insensitive' } },
        { entityId: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              nome: true,
              cognome: true,
              email: true,
            },
          },
          company: {
            select: {
              id: true,
              ragioneSociale: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get all audit logs error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero audit log' });
  }
};

/**
 * Ottiene un singolo audit log
 */
export const getAuditLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        actor: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            email: true,
            isSuperAdmin: true,
          },
        },
        company: {
          select: {
            id: true,
            ragioneSociale: true,
            piva: true,
          },
        },
      },
    });

    if (!log) {
      return res.status(404).json({ error: 'Audit log non trovato' });
    }

    res.json(log);
  } catch (error: any) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero audit log' });
  }
};

/**
 * Ottiene statistiche audit log
 */
export const getAuditStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const [
      total,
      byAction,
      byActorType,
      byEntity,
      recentActions,
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.auditLog.groupBy({
        by: ['actorType'],
        where,
        _count: { id: true },
      }),
      prisma.auditLog.groupBy({
        by: ['entity'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.auditLog.findMany({
        where,
        select: {
          action: true,
          entity: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    res.json({
      total,
      byAction: byAction.map((item) => ({
        action: item.action,
        count: item._count.id,
      })),
      byActorType: byActorType.map((item) => ({
        actorType: item.actorType,
        count: item._count.id,
      })),
      byEntity: byEntity.map((item) => ({
        entity: item.entity,
        count: item._count.id,
      })),
      recentActions,
    });
  } catch (error: any) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero statistiche audit' });
  }
};

