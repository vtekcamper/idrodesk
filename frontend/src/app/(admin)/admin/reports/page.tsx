'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { StatCard } from '@/components/ui-kit/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Input } from '@/components/ui-kit/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui-kit/table';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { Badge } from '@/components/ui-kit/badge';
import {
  DollarSign,
  Building2,
  Users,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminReportsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'advanced', dateRange],
    queryFn: async () => {
      const response = await adminApi.getAdvancedReports({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      return response.data;
    },
  });

  const { data: topCompanies } = useQuery({
    queryKey: ['admin', 'reports', 'companies', 'top'],
    queryFn: async () => {
      const response = await adminApi.getTopCompanies({ limit: 10, metric: 'revenue' });
      return response.data;
    },
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <PageHeader
          title="Report e Analytics"
          description="Analisi dettagliate del sistema"
          breadcrumb={[{ label: 'Admin' }, { label: 'Report' }]}
        />

        {/* Date Range Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Data Inizio</label>
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Data Fine</label>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
        ) : reports && (
          <>
            {/* Revenue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Revenue Totale"
                value={`€${Number(reports.revenue.total).toFixed(2)}`}
                description={`${reports.revenue.payments} pagamenti completati`}
                icon={<DollarSign className="h-8 w-8 text-success" />}
              />
              <StatCard
                title="Nuove Aziende"
                value={reports.growth.newCompanies}
                description="Nel periodo selezionato"
                icon={<Building2 className="h-8 w-8 text-primary" />}
              />
              <StatCard
                title="Nuovi Utenti"
                value={reports.growth.newUsers}
                description="Nel periodo selezionato"
                icon={<Users className="h-8 w-8 text-primary" />}
              />
            </div>

            {/* Subscriptions Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Abbonamenti</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Attivi</span>
                      <span className="font-bold text-success">{reports.subscriptions.active}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">In Scadenza</span>
                      <span className="font-bold text-warning">{reports.subscriptions.expiring}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Per Piano</p>
                      {reports.subscriptions.byPlan && Array.isArray(reports.subscriptions.byPlan) ? (
                        reports.subscriptions.byPlan.map((plan: any) => (
                          <div key={plan.pianoAbbonamento} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{plan.pianoAbbonamento}</span>
                            <span className="font-medium">{plan._count.id}</span>
                          </div>
                        ))
                      ) : (
                        Object.entries(reports.subscriptions.byPlan || {}).map(([plan, count]: [string, any]) => (
                          <div key={plan} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{plan}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attività</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Totale Lavori</span>
                      <span className="font-bold">{reports.activity.jobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Totale Preventivi</span>
                      <span className="font-bold">{reports.activity.quotes}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Stats */}
            {reports.monthly && reports.monthly.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Statistiche Mensili (Ultimi 12 Mesi)</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mese</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Nuove Aziende</TableHead>
                          <TableHead className="text-right">Nuovi Utenti</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.monthly.map((month: any) => (
                          <TableRow key={month.month}>
                            <TableCell>{month.month}</TableCell>
                            <TableCell className="text-right font-medium">
                              €{Number(month.revenue).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">{month.companies}</TableCell>
                            <TableCell className="text-right">{month.users}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Companies */}
            {topCompanies && topCompanies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Aziende per Revenue</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Azienda</TableHead>
                          <TableHead>Piano</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Lavori</TableHead>
                          <TableHead className="text-right">Clienti</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topCompanies.map((company: any) => (
                          <TableRow key={company.id}>
                            <TableCell className="font-medium">{company.ragioneSociale}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{company.pianoAbbonamento}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              €{Number(company.totalRevenue || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">{company._count.jobs}</TableCell>
                            <TableCell className="text-right">{company._count.clients}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
