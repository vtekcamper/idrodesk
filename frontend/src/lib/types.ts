// Re-export Prisma types for frontend use
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED' | 'DELETED';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type Ruolo = 'OWNER' | 'TECNICO' | 'BACKOFFICE';
export type StatoJob = 'BOZZA' | 'PIANIFICATO' | 'IN_CORSO' | 'COMPLETATO' | 'FATTURATO' | 'ANNULLATO';
export type StatoPreventivo = 'BOZZA' | 'INVIATO' | 'ACCETTATO' | 'RIFIUTATO' | 'SCADUTO';

