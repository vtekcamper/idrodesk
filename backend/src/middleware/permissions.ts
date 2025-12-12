import { Request, Response, NextFunction } from 'express';

/**
 * Permessi granulari per RBAC (Role-Based Access Control)
 * Oltre ai ruoli (OWNER, TECNICO, BACKOFFICE), definiamo permessi espliciti
 */
export enum Permission {
  // User management
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_USERS = 'VIEW_USERS',
  
  // Company management
  MANAGE_COMPANY_SETTINGS = 'MANAGE_COMPANY_SETTINGS',
  VIEW_COMPANY_SETTINGS = 'VIEW_COMPANY_SETTINGS',
  
  // Billing
  MANAGE_BILLING = 'MANAGE_BILLING',
  VIEW_BILLING = 'VIEW_BILLING',
  
  // Data management
  EXPORT_DATA = 'EXPORT_DATA',
  DELETE_DATA = 'DELETE_DATA',
  
  // Email
  SEND_EMAILS = 'SEND_EMAILS',
  
  // Clients
  MANAGE_CLIENTS = 'MANAGE_CLIENTS',
  VIEW_CLIENTS = 'VIEW_CLIENTS',
  
  // Jobs
  MANAGE_JOBS = 'MANAGE_JOBS',
  VIEW_JOBS = 'VIEW_JOBS',
  
  // Quotes
  MANAGE_QUOTES = 'MANAGE_QUOTES',
  VIEW_QUOTES = 'VIEW_QUOTES',
  
  // Materials
  MANAGE_MATERIALS = 'MANAGE_MATERIALS',
  VIEW_MATERIALS = 'VIEW_MATERIALS',
  
  // Checklists
  MANAGE_CHECKLISTS = 'MANAGE_CHECKLISTS',
  VIEW_CHECKLISTS = 'VIEW_CHECKLISTS',
}

/**
 * Mapping ruoli -> permessi
 * OWNER ha tutti i permessi
 * TECNICO ha permessi operativi
 * BACKOFFICE ha permessi limitati
 */
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  OWNER: [
    // Tutti i permessi
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.MANAGE_COMPANY_SETTINGS,
    Permission.VIEW_COMPANY_SETTINGS,
    Permission.MANAGE_BILLING,
    Permission.VIEW_BILLING,
    Permission.EXPORT_DATA,
    Permission.DELETE_DATA,
    Permission.SEND_EMAILS,
    Permission.MANAGE_CLIENTS,
    Permission.VIEW_CLIENTS,
    Permission.MANAGE_JOBS,
    Permission.VIEW_JOBS,
    Permission.MANAGE_QUOTES,
    Permission.VIEW_QUOTES,
    Permission.MANAGE_MATERIALS,
    Permission.VIEW_MATERIALS,
    Permission.MANAGE_CHECKLISTS,
    Permission.VIEW_CHECKLISTS,
  ],
  TECNICO: [
    // Permessi operativi
    Permission.VIEW_USERS,
    Permission.VIEW_COMPANY_SETTINGS,
    Permission.VIEW_BILLING,
    Permission.VIEW_CLIENTS,
    Permission.MANAGE_JOBS,
    Permission.VIEW_JOBS,
    Permission.VIEW_QUOTES,
    Permission.VIEW_MATERIALS,
    Permission.MANAGE_CHECKLISTS,
    Permission.VIEW_CHECKLISTS,
  ],
  BACKOFFICE: [
    // Permessi limitati
    Permission.VIEW_USERS,
    Permission.VIEW_COMPANY_SETTINGS,
    Permission.VIEW_BILLING,
    Permission.VIEW_CLIENTS,
    Permission.VIEW_JOBS,
    Permission.MANAGE_QUOTES,
    Permission.VIEW_QUOTES,
    Permission.VIEW_MATERIALS,
    Permission.VIEW_CHECKLISTS,
  ],
};

/**
 * Verifica se un utente ha un permesso specifico
 */
export function hasPermission(user: { role: string; isSuperAdmin?: boolean }, permission: Permission): boolean {
  // Super admin ha tutti i permessi
  if (user.isSuperAdmin) {
    return true;
  }

  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Middleware per verificare permessi
 * Usa: requirePermission(Permission.MANAGE_USERS)
 */
export const requirePermission = (...permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Verifica autenticazione
    if (!req.user) {
      return res.status(401).json({
        error: 'Autenticazione richiesta',
        code: 'UNAUTHORIZED',
      });
    }

    // Super admin ha tutti i permessi
    if (req.user.isSuperAdmin) {
      return next();
    }

    // Verifica che l'utente abbia almeno uno dei permessi richiesti
    const hasAnyPermission = permissions.some((permission) =>
      hasPermission(req.user!, permission)
    );

    if (!hasAnyPermission) {
      return res.status(403).json({
        error: 'Permessi insufficienti',
        code: 'FORBIDDEN',
        required: permissions,
      });
    }

    next();
  };
};

/**
 * Middleware per verificare che l'utente abbia TUTTI i permessi richiesti
 */
export const requireAllPermissions = (...permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Verifica autenticazione
    if (!req.user) {
      return res.status(401).json({
        error: 'Autenticazione richiesta',
        code: 'UNAUTHORIZED',
      });
    }

    // Super admin ha tutti i permessi
    if (req.user.isSuperAdmin) {
      return next();
    }

    // Verifica che l'utente abbia TUTTI i permessi richiesti
    const hasAllPermissions = permissions.every((permission) =>
      hasPermission(req.user!, permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        error: 'Permessi insufficienti',
        code: 'FORBIDDEN',
        required: permissions,
      });
    }

    next();
  };
};

/**
 * Helper per verificare permessi in controller
 */
export function checkPermission(user: { role: string; isSuperAdmin?: boolean }, permission: Permission): boolean {
  return hasPermission(user, permission);
}

