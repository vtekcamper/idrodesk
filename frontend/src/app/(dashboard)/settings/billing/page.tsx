'use client';

import { useQuery } from '@tanstack/react-query';
import { companyApi } from '@/lib/api';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { StatCard } from '@/components/ui-kit/stat-card';
import { StatusBadge } from '@/components/ui-kit/status-badge';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { CreditCard, Calendar, TrendingUp, AlertCircle, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function BillingPage() {
  const { data: billing, isLoading: loadingBilling } = useQuery({
    queryKey: ['company', 'billing'],
    queryFn: async () => {
      const response = await companyApi.getBilling();
      return response.data;
    },
  });

  const { data: usage, isLoading: loadingUsage } = useQuery({
    queryKey: ['company', 'usage'],
    queryFn: async () => {
      const response = await companyApi.getUsage();
      return response.data;
    },
  });

  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ['company', 'payments'],
    queryFn: async () => {
      const response = await companyApi.getPayments();
      return response.data;
    },
  });

  if (loadingBilling || loadingUsage) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const planLabels: Record<string, string> = {
    BASIC: 'Base',
    PRO: 'Pro',
    ELITE: 'Elite',
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Abbonamento & Pagamenti"
        description="Gestisci il tuo abbonamento e visualizza lo storico pagamenti"
      />

      {/* Piano Attuale */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Piano Attuale"
          value={billing?.plan ? planLabels[billing.plan] || billing.plan : 'N/A'}
          icon={<CreditCard className="h-8 w-8 text-primary" />}
        />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Stato</p>
                {billing?.status ? (
                  <StatusBadge status={billing.status} type="subscription" />
                ) : (
                  <p className="text-lg font-semibold">N/A</p>
                )}
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        {billing?.daysRemaining !== null && (
          <StatCard
            title="Giorni Rimanenti"
            value={billing.daysRemaining > 0 ? `${billing.daysRemaining}` : 'Scaduto'}
            icon={<Calendar className="h-8 w-8 text-warning" />}
          />
        )}
      </div>

      {/* Dettagli Piano */}
      <Card>
        <CardHeader>
          <CardTitle>Dettagli Abbonamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Piano</p>
              <p className="font-semibold">{billing?.plan ? planLabels[billing.plan] || billing.plan : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Stato</p>
              <p>
                {billing?.status ? (
                  <StatusBadge status={billing.status} type="subscription" />
                ) : (
                  'N/A'
                )}
              </p>
            </div>
            {billing?.expiryDate && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Data Scadenza</p>
                <p className="font-semibold">
                  {new Date(billing.expiryDate).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
            {billing?.daysRemaining !== null && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Giorni Rimanenti</p>
                <p className="font-semibold">
                  {billing.daysRemaining > 0 ? `${billing.daysRemaining} giorni` : 'Scaduto'}
                </p>
              </div>
            )}
          </div>
          <div className="pt-4 border-t">
            <Button variant="outline" asChild>
              <a href="mailto:support@idrodesk.it?subject=Richiesta Upgrade Piano">
                <ExternalLink className="h-4 w-4 mr-2" />
                Contatta Supporto per Upgrade
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Utilizzo */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle>Utilizzo Risorse</CardTitle>
            <CardDescription>Limiti e utilizzo del tuo piano attuale</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(usage.usage || {}).map(([key, value]: [string, any]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">
                    {key === 'users' && 'Utenti'}
                    {key === 'clients' && 'Clienti'}
                    {key === 'jobsThisMonth' && 'Interventi (mese corrente)'}
                    {key === 'quotesThisMonth' && 'Preventivi (mese corrente)'}
                  </span>
                  <span>
                    {value.current} / {value.limit}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      value.percentage >= 90
                        ? 'bg-destructive'
                        : value.percentage >= 70
                        ? 'bg-warning'
                        : 'bg-success'
                    }`}
                    style={{ width: `${Math.min(value.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{value.percentage}% utilizzato</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Storico Pagamenti */}
      <Card>
        <CardHeader>
          <CardTitle>Storico Pagamenti</CardTitle>
          <CardDescription>Visualizza tutti i pagamenti effettuati</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPayments ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : payments?.payments && payments.payments.length > 0 ? (
            <div className="space-y-3">
              {payments.payments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {new Date(payment.createdAt).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.paymentMethod} • {payment.provider || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold">€{Number(payment.amount).toFixed(2)}</p>
                    <StatusBadge status={payment.status} type="payment" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CreditCard className="h-12 w-12" />}
              title="Nessun pagamento trovato"
              description="I tuoi pagamenti appariranno qui"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

