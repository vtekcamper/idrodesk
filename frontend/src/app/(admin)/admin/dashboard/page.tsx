'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { StatCard } from '@/components/ui-kit/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { Button } from '@/components/ui-kit/button';
import {
  Building2,
  TrendingUp,
  Users,
  Wrench,
  ArrowRight,
  Inbox,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await adminApi.getSystemStats();
      return response.data;
    },
  });

  const { data: companies, isLoading: loadingCompanies } = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: async () => {
      const response = await adminApi.getAllCompanies();
      return response.data;
    },
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <PageHeader
          title="Dashboard"
          description="Panoramica sistema IdroDesk"
          breadcrumb={[{ label: 'Admin' }, { label: 'Dashboard' }]}
        />

        {/* Stats Cards */}
        {loadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Totale Aziende"
                value={stats.companies.total}
                description={`${stats.companies.active} attive • ${stats.companies.inactive} inattive`}
                icon={<Building2 className="h-8 w-8 text-primary" />}
              />
              <StatCard
                title="Nuove Questo Mese"
                value={stats.companies.newThisMonth}
                description="Registrazioni recenti"
                icon={<TrendingUp className="h-8 w-8 text-success" />}
              />
              <StatCard
                title="Totale Utenti"
                value={stats.users.total}
                description="Utenti attivi"
                icon={<Users className="h-8 w-8 text-primary" />}
              />
              <StatCard
                title="Totale Lavori"
                value={stats.data.jobs}
                description={`${stats.data.quotes} preventivi • ${stats.data.clients} clienti`}
                icon={<Wrench className="h-8 w-8 text-warning" />}
              />
            </div>
          )
        )}

        {/* Companies by Plan */}
        {stats && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Aziende per Piano</CardTitle>
                  <CardDescription>Distribuzione abbonamenti</CardDescription>
                </div>
                <Link href="/admin/companies">
                  <Button variant="ghost" size="sm">
                    Vedi tutte
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-xl bg-muted">
                  <p className="text-sm font-medium text-muted-foreground mb-2">BASIC</p>
                  <p className="text-3xl font-bold">{stats.companies.byPlan.BASIC || 0}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted">
                  <p className="text-sm font-medium text-muted-foreground mb-2">PRO</p>
                  <p className="text-3xl font-bold">{stats.companies.byPlan.PRO || 0}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted">
                  <p className="text-sm font-medium text-muted-foreground mb-2">ELITE</p>
                  <p className="text-3xl font-bold">{stats.companies.byPlan.ELITE || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Companies List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Aziende</CardTitle>
                <CardDescription>Ultime aziende registrate</CardDescription>
              </div>
              <Link href="/admin/companies">
                <Button variant="ghost" size="sm">
                  Vedi tutte
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loadingCompanies ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : companies && companies.length > 0 ? (
              <div className="space-y-4">
                {companies.slice(0, 5).map((company: any) => (
                  <Link
                    key={company.id}
                    href={`/admin/companies/${company.id}`}
                    className="flex items-center justify-between p-4 rounded-xl border hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{company.ragioneSociale}</p>
                      <p className="text-sm text-muted-foreground">{company.piva}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {company.pianoAbbonamento}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          company.abbonamentoAttivo
                            ? 'bg-success/10 text-success'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {company.abbonamentoAttivo ? 'Attivo' : 'Inattivo'}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Inbox className="h-12 w-12" />}
                title="Nessuna azienda trovata"
                description="Le aziende registrate appariranno qui"
                action={{
                  label: 'Vedi tutte le aziende',
                  onClick: () => router.push('/admin/companies'),
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
