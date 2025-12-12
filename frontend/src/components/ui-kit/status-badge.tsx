import { Badge } from './badge';
import { SubscriptionStatus, PaymentStatus, Ruolo, StatoJob, StatoPreventivo } from '@/lib/types';

interface StatusBadgeProps {
  status: SubscriptionStatus | PaymentStatus | Ruolo | StatoJob | StatoPreventivo | string;
  type?: 'subscription' | 'payment' | 'role' | 'job' | 'quote';
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'secondary' }> = {
  // Subscription Status
  TRIAL: { label: 'Trial', variant: 'secondary' },
  ACTIVE: { label: 'Attivo', variant: 'success' },
  PAST_DUE: { label: 'Scaduto', variant: 'warning' },
  SUSPENDED: { label: 'Sospeso', variant: 'danger' },
  CANCELED: { label: 'Cancellato', variant: 'secondary' },
  DELETED: { label: 'Eliminato', variant: 'secondary' },
  
  // Payment Status
  PENDING: { label: 'In attesa', variant: 'warning' },
  PROCESSING: { label: 'In elaborazione', variant: 'secondary' },
  COMPLETED: { label: 'Completato', variant: 'success' },
  FAILED: { label: 'Fallito', variant: 'danger' },
  REFUNDED: { label: 'Rimborsato', variant: 'secondary' },
  CANCELLED: { label: 'Annullato', variant: 'secondary' },
  
  // Role
  OWNER: { label: 'Proprietario', variant: 'default' },
  TECNICO: { label: 'Tecnico', variant: 'secondary' },
  BACKOFFICE: { label: 'Backoffice', variant: 'secondary' },
  
  // Job Status
  BOZZA: { label: 'Bozza', variant: 'secondary' },
  PIANIFICATO: { label: 'Pianificato', variant: 'default' },
  IN_CORSO: { label: 'In corso', variant: 'default' },
  COMPLETATO: { label: 'Completato', variant: 'success' },
  FATTURATO: { label: 'Fatturato', variant: 'success' },
  ANNULLATO: { label: 'Annullato', variant: 'secondary' },
  
  // Quote Status
  INVIATO: { label: 'Inviato', variant: 'default' },
  ACCETTATO: { label: 'Accettato', variant: 'success' },
  RIFIUTATO: { label: 'Rifiutato', variant: 'danger' },
  SCADUTO: { label: 'Scaduto', variant: 'warning' },
};

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}

