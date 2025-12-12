'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent } from '@/components/ui-kit/card';
import { Input } from '@/components/ui-kit/input';
import { Button } from '@/components/ui-kit/button';
import { StatusBadge } from '@/components/ui-kit/status-badge';
import { Badge } from '@/components/ui-kit/badge';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { Wrench, Plus, Calendar, User, X } from 'lucide-react';

export default function JobsPage() {
  const [filters, setFilters] = useState({
    stato: '',
    data: '',
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const response = await jobsApi.getAll(filters);
      return response.data;
    },
  });

  const hasActiveFilters = filters.stato || filters.data;

  const clearFilters = () => {
    setFilters({ stato: '', data: '' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Interventi"
          description="Gestisci i tuoi interventi"
          action={{
            label: 'Nuovo Intervento',
            onClick: () => (window.location.href = '/jobs/new'),
          }}
        />

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <select
                className="flex h-10 w-full md:w-auto md:min-w-[200px] rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filters.stato}
                onChange={(e) => setFilters({ ...filters, stato: e.target.value })}
              >
                <option value="">Tutti gli stati</option>
                <option value="BOZZA">Bozza</option>
                <option value="PIANIFICATO">Pianificato</option>
                <option value="IN_CORSO">In Corso</option>
                <option value="COMPLETATO">Completato</option>
                <option value="FATTURATO">Fatturato</option>
              </select>
              <Input
                type="date"
                className="w-full md:w-auto"
                value={filters.data}
                onChange={(e) => setFilters({ ...filters, data: e.target.value })}
              />
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
        ) : jobs && jobs.length > 0 ? (
          <div className="space-y-3">
            {jobs.map((job: any) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="hover:shadow-medium transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{job.titolo}</h3>
                        <p className="text-sm text-muted-foreground mb-1">
                          {job.client.nome} {job.client.cognome}
                          {job.site && <> • {job.site.descrizione}</>}
                        </p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                          {job.dataProgrammata && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(job.dataProgrammata).toLocaleDateString('it-IT')}
                              {job.oraProgrammata && ` alle ${job.oraProgrammata}`}
                            </div>
                          )}
                          {job.tecnico && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {job.tecnico.nome} {job.tecnico.cognome}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <StatusBadge status={job.stato} type="job" />
                        {job.priorita === 'URGENTE' && (
                          <Badge variant="danger">URGENTE</Badge>
                        )}
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
                icon={<Wrench className="h-12 w-12" />}
                title="Nessun lavoro trovato"
                description={hasActiveFilters ? 'Prova a modificare i filtri' : 'Inizia creando il tuo primo lavoro'}
                action={{
                  label: 'Crea Lavoro',
                  onClick: () => (window.location.href = '/jobs/new'),
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
