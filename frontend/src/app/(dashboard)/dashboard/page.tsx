'use client';

import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { StatCard } from '@/components/ui-kit/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { StatusBadge } from '@/components/ui-kit/status-badge';
import { Badge } from '@/components/ui-kit/badge';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import {
  Calendar,
  PlayCircle,
  Clock,
  ArrowRight,
  Wrench,
  Plus,
  AlertCircle,
  FileText,
  CheckCircle2,
} from 'lucide-react';

export default function DashboardPage() {
  // Statistiche dashboard
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['jobs', 'dashboard', 'stats'],
    queryFn: async () => {
      const response = await jobsApi.getDashboardStats();
      return response.data;
    },
  });

  // Interventi oggi
  const { data: jobsToday, isLoading: loadingToday } = useQuery({
    queryKey: ['jobs', 'dashboard', 'today'],
    queryFn: async () => {
      const response = await jobsApi.getToday();
      return response.data;
    },
  });

  // Prossimi 7 giorni
  const { data: jobsUpcoming, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['jobs', 'dashboard', 'upcoming'],
    queryFn: async () => {
      const response = await jobsApi.getUpcoming();
      return response.data;
    },
  });

  // Da chiudere
  const { data: toClose, isLoading: loadingToClose } = useQuery({
    queryKey: ['jobs', 'dashboard', 'to-close'],
    queryFn: async () => {
      const response = await jobsApi.getToClose();
      return response.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Panoramica operativa dei tuoi interventi"
          action={{
            label: 'Nuovo Intervento',
            onClick: () => (window.location.href = '/jobs/new'),
          }}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Oggi"
            value={loadingStats ? '...' : stats?.today || 0}
            icon={<Calendar className="h-8 w-8 text-primary" />}
          />
          <StatCard
            title="In Corso"
            value={loadingStats ? '...' : stats?.inProgress || 0}
            icon={<PlayCircle className="h-8 w-8 text-success" />}
          />
          <StatCard
            title="Pianificati"
            value={loadingStats ? '...' : stats?.planned || 0}
            icon={<Clock className="h-8 w-8 text-warning" />}
          />
          <StatCard
            title="Prossimi 7 giorni"
            value={loadingStats ? '...' : stats?.upcoming || 0}
            icon={<Calendar className="h-8 w-8 text-primary" />}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/jobs/new">
            <Card className="hover:shadow-medium transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Nuovo Intervento</h3>
                  <p className="text-sm text-muted-foreground">Crea un nuovo intervento</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/clients/new">
            <Card className="hover:shadow-medium transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Nuovo Cliente</h3>
                  <p className="text-sm text-muted-foreground">Aggiungi un nuovo cliente</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/quotes/new">
            <Card className="hover:shadow-medium transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Nuovo Preventivo</h3>
                  <p className="text-sm text-muted-foreground">Crea un nuovo preventivo</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interventi di oggi */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Oggi</CardTitle>
                  <CardDescription>Interventi programmati per oggi</CardDescription>
                </div>
                <Link href="/jobs">
                  <Button variant="ghost" size="sm">
                    Vedi tutti
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loadingToday ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : jobsToday && jobsToday.length > 0 ? (
                <div className="space-y-3">
                  {jobsToday.slice(0, 6).map((job: any) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="block p-4 border rounded-xl hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{job.titolo}</p>
                            {job.oraProgrammata && (
                              <Badge variant="outline" className="text-xs">
                                {job.oraProgrammata}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {job.client.nome} {job.client.cognome}
                          </p>
                          {job.site?.indirizzo && (
                            <p className="text-xs text-muted-foreground mt-1">
                              📍 {job.site.indirizzo}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <StatusBadge status={job.stato} type="job" />
                          {job.stato === 'PIANIFICATO' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // TODO: implementare start
                              }}
                            >
                              Inizia
                            </Button>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Calendar className="h-12 w-12" />}
                  title="Nessun intervento programmato per oggi"
                  description="I tuoi interventi di oggi appariranno qui"
                  action={{
                    label: 'Crea nuovo intervento',
                    onClick: () => (window.location.href = '/jobs/new'),
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Prossimi 7 giorni */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Prossimi 7 giorni</CardTitle>
                  <CardDescription>Interventi pianificati questa settimana</CardDescription>
                </div>
                <Link href="/jobs">
                  <Button variant="ghost" size="sm">
                    Vedi tutti
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUpcoming ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : jobsUpcoming && jobsUpcoming.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {jobsUpcoming.slice(0, 10).map((job: any) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="block p-3 border rounded-xl hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{job.titolo}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {job.client.nome} {job.client.cognome}
                            {job.dataProgrammata && (
                              <> • {new Date(job.dataProgrammata).toLocaleDateString('it-IT')}</>
                            )}
                            {job.oraProgrammata && <> • {job.oraProgrammata}</>}
                          </p>
                        </div>
                        <StatusBadge status={job.stato} type="job" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Wrench className="h-12 w-12" />}
                  title="Nessun intervento pianificato"
                  description="I tuoi prossimi interventi appariranno qui"
                  action={{
                    label: 'Crea nuovo intervento',
                    onClick: () => (window.location.href = '/jobs/new'),
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Da chiudere */}
        {(toClose?.withoutReport?.length > 0 ||
          toClose?.pendingQuotes?.length > 0 ||
          toClose?.notInvoiced?.length > 0) && (
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                <CardTitle>Da chiudere</CardTitle>
              </div>
              <CardDescription>Interventi e preventivi che richiedono attenzione</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {toClose?.withoutReport?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Interventi completati senza rapporto ({toClose.withoutReport.length})
                    </h4>
                    <div className="space-y-2">
                      {toClose.withoutReport.slice(0, 3).map((job: any) => (
                        <Link
                          key={job.id}
                          href={`/jobs/${job.id}`}
                          className="block p-2 border rounded-lg hover:bg-accent text-sm"
                        >
                          {job.titolo} - {job.client.nome} {job.client.cognome}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {toClose?.pendingQuotes?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Preventivi in attesa ({toClose.pendingQuotes.length})
                    </h4>
                    <div className="space-y-2">
                      {toClose.pendingQuotes.slice(0, 3).map((quote: any) => (
                        <Link
                          key={quote.id}
                          href={`/quotes/${quote.id}`}
                          className="block p-2 border rounded-lg hover:bg-accent text-sm"
                        >
                          Preventivo {quote.numeroPreventivo} - {quote.client.nome}{' '}
                          {quote.client.cognome}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {toClose?.notInvoiced?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Interventi completati non fatturati ({toClose.notInvoiced.length})
                    </h4>
                    <div className="space-y-2">
                      {toClose.notInvoiced.slice(0, 3).map((job: any) => (
                        <Link
                          key={job.id}
                          href={`/jobs/${job.id}`}
                          className="block p-2 border rounded-lg hover:bg-accent text-sm"
                        >
                          {job.titolo} - {job.client.nome} {job.client.cognome}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
