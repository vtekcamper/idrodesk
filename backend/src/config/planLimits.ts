/**
 * Configurazione limiti per ogni piano abbonamento
 */
export interface PlanLimits {
  maxUsers: number;
  maxClients: number;
  maxJobsPerMonth: number;
  maxQuotesPerMonth: number;
  maxStorageGB: number;
  features: string[];
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  BASIC: {
    maxUsers: 3,
    maxClients: 50,
    maxJobsPerMonth: 100,
    maxQuotesPerMonth: 100,
    maxStorageGB: 1,
    features: [
      'Gestione clienti base',
      'Preventivi base',
      'Lavori base',
      'Checklist base',
      'Report PDF base',
    ],
  },
  PRO: {
    maxUsers: 10,
    maxClients: -1, // -1 = illimitato
    maxJobsPerMonth: -1,
    maxQuotesPerMonth: -1,
    maxStorageGB: 10,
    features: [
      'Tutto del piano BASIC',
      'Clienti illimitati',
      'Lavori illimitati',
      'Preventivi illimitati',
      'Storage 10GB',
      'Export dati',
      'API access',
    ],
  },
  ELITE: {
    maxUsers: -1,
    maxClients: -1,
    maxJobsPerMonth: -1,
    maxQuotesPerMonth: -1,
    maxStorageGB: 100,
    features: [
      'Tutto del piano PRO',
      'Utenti illimitati',
      'Storage 100GB',
      'Supporto prioritario',
      'Custom branding',
      'White label',
      'Integrazioni avanzate',
    ],
  },
};

/**
 * Verifica se un valore è entro il limite
 */
export function isWithinLimit(current: number, limit: number): boolean {
  if (limit === -1) return true; // Illimitato
  return current < limit;
}

/**
 * Ottiene i limiti per un piano
 */
export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.BASIC;
}

