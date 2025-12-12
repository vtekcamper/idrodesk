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
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import {
  Calendar,
  PlayCircle,
  Clock,
  ArrowRight,
  Wrench,
  Inbox,
} from 'lucide-react';

export default function DashboardPage() {
  const today = new Date().toISOString().split('T')[0];

  const { data: jobsToday, isLoading: loadingToday } = useQuery({
    queryKey: ['jobs', 'today', today],
    queryFn: async () => {
      const response = await jobsApi.getAll({ data: today });
      return response.data;
    },
  });

  const { data: jobsUpcoming, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['jobs', 'upcoming'],
    queryFn: async () => {
      const response = await jobsApi.getAll({ stato: 'PIANIFICATO' });
      return response.data;
    },
  });

  const { data: jobsInProgress, isLoading: loadingInProgress } = useQuery({
    queryKey: ['jobs', 'in-progress'],
    queryFn: async () => {
      const response = await jobsApi.getAll({ stato: 'IN_CORSO' });
      return response.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Panoramica dei tuoi lavori"
          action={{
            label: 'Nuovo Lavoro',
            onClick: () => (window.location.href = '/jobs/new'),
          }}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Oggi"
            value={loadingToday ? '...' : jobsToday?.length || 0}
            icon={<Calendar className="h-8 w-8 text-primary" />}
          />
          <StatCard
            title="In Corso"
            value={loadingInProgress ? '...' : jobsInProgress?.length || 0}
            icon={<PlayCircle className="h-8 w-8 text-success" />}
          />
          <StatCard
            title="Pianificati"
            value={loadingUpcoming ? '...' : jobsUpcoming?.length || 0}
            icon={<Clock className="h-8 w-8 text-warning" />}
          />
        </div>

        {/* Lavori di oggi */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lavori di Oggi</CardTitle>
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
                {jobsToday.slice(0, 5).map((job: any) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block p-4 border rounded-xl hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{job.titolo}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.client.nome} {job.client.cognome}
                        </p>
                      </div>
                      <StatusBadge status={job.stato} type="job" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Calendar className="h-12 w-12" />}
                title="Nessun lavoro programmato per oggi"
                description="I lavori di oggi appariranno qui"
                action={{
                  label: 'Crea nuovo lavoro',
                  onClick: () => (window.location.href = '/jobs/new'),
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Prossimi lavori */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Prossimi Lavori</CardTitle>
                <CardDescription>Lavori pianificati in futuro</CardDescription>
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
              <div className="space-y-3">
                {jobsUpcoming.slice(0, 5).map((job: any) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block p-4 border rounded-xl hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{job.titolo}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.client.nome} {job.client.cognome}
                          {job.dataProgrammata && (
                            <> • {new Date(job.dataProgrammata).toLocaleDateString('it-IT')}</>
                          )}
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
                title="Nessun lavoro pianificato"
                description="I lavori pianificati appariranno qui"
                action={{
                  label: 'Crea nuovo lavoro',
                  onClick: () => (window.location.href = '/jobs/new'),
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
