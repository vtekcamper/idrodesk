'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { quotesApi } from '@/lib/api';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { StatusBadge } from '@/components/ui-kit/status-badge';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { FileText, Plus, Calendar, X } from 'lucide-react';

export default function QuotesPage() {
  const [filters, setFilters] = useState({
    stato: '',
  });

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes', filters],
    queryFn: async () => {
      const response = await quotesApi.getAll(filters);
      return response.data;
    },
  });

  const hasActiveFilters = filters.stato;

  const clearFilters = () => {
    setFilters({ stato: '' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Preventivi"
          description="Gestisci i tuoi preventivi"
          action={{
            label: 'Nuovo Preventivo',
            onClick: () => (window.location.href = '/quotes/new'),
          }}
        />

        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <select
                className="flex h-10 w-full md:w-auto md:min-w-[200px] rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filters.stato}
                onChange={(e) => setFilters({ ...filters, stato: e.target.value })}
              >
                <option value="">Tutti gli stati</option>
                <option value="BOZZA">Bozza</option>
                <option value="INVIATO">Inviato</option>
                <option value="ACCETTATO">Accettato</option>
                <option value="RIFIUTATO">Rifiutato</option>
                <option value="SCADUTO">Scaduto</option>
              </select>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : quotes && quotes.length > 0 ? (
          <div className="space-y-3">
            {quotes.map((quote: any) => (
              <Link key={quote.id} href={`/quotes/${quote.id}`}>
                <Card className="hover:shadow-medium transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">
                          Preventivo {quote.numeroPreventivo}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-1">
                          {quote.client.nome} {quote.client.cognome}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(quote.data).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <span className="text-lg font-bold">
                          €{Number(quote.totaleLordo).toFixed(2)}
                        </span>
                        <StatusBadge status={quote.stato} type="quote" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                icon={<FileText className="h-12 w-12" />}
                title="Nessun preventivo trovato"
                description={hasActiveFilters ? 'Prova a modificare i filtri' : 'Inizia creando il tuo primo preventivo'}
                action={{
                  label: 'Crea Preventivo',
                  onClick: () => (window.location.href = '/quotes/new'),
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
