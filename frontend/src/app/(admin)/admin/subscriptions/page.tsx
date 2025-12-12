'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { Badge } from '@/components/ui-kit/badge';
import { StatusBadge } from '@/components/ui-kit/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui-kit/table';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { AlertTriangle, CreditCard, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AdminSubscriptionsPage() {
  const queryClient = useQueryClient();
  const [daysFilter, setDaysFilter] = useState(30);

  const { data: expiring, isLoading: loadingExpiring } = useQuery({
    queryKey: ['admin', 'subscriptions', 'expiring', daysFilter],
    queryFn: async () => {
      const response = await adminApi.getExpiringSubscriptions({ days: daysFilter });
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

  const toggleSubscriptionMutation = useMutation({
    mutationFn: ({ id, attivo }: { id: string; attivo: boolean }) =>
      adminApi.toggleSubscription(id, { attivo, motivo: 'Modifica da admin' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
    },
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <PageHeader
          title="Gestione Abbonamenti"
          description="Monitora e gestisci gli abbonamenti delle aziende"
          breadcrumb={[{ label: 'Admin' }, { label: 'Abbonamenti' }]}
        />

        {/* Alert Abbonamenti in Scadenza */}
        {expiring && expiring.length > 0 && (
          <Card className="border-warning bg-warning/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <CardTitle>Abbonamenti in Scadenza</CardTitle>
                </div>
                <select
                  className="flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={daysFilter}
                  onChange={(e) => setDaysFilter(Number(e.target.value))}
                >
                  <option value={7}>7 giorni</option>
                  <option value={15}>15 giorni</option>
                  <option value={30}>30 giorni</option>
                  <option value={60}>60 giorni</option>
                </select>
              </div>
              <CardDescription>
                {expiring.length} abbonamenti scadono nei prossimi {daysFilter} giorni
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Lista Abbonamenti in Scadenza */}
        {expiring && expiring.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Prossime Scadenze</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Azienda</TableHead>
                      <TableHead>Piano</TableHead>
                      <TableHead>Scadenza</TableHead>
                      <TableHead>Giorni Rimanenti</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiring.map((company: any) => {
                      const daysLeft = Math.ceil(
                        (new Date(company.dataScadenza).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <TableRow key={company.id}>
                          <TableCell>
                            <Link
                              href={`/admin/companies/${company.id}`}
                              className="text-primary hover:underline font-medium"
                            >
                              {company.ragioneSociale}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{company.pianoAbbonamento}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(company.dataScadenza).toLocaleDateString('it-IT')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                daysLeft <= 7
                                  ? 'danger'
                                  : daysLeft <= 15
                                  ? 'warning'
                                  : 'success'
                              }
                            >
                              {daysLeft} giorni
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/companies/${company.id}`}>
                              <Button variant="ghost" size="sm">
                                Gestisci
                                <ArrowRight className="h-4 w-4 ml-1" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tutte le Aziende con Abbonamenti */}
        <Card>
          <CardHeader>
            <CardTitle>Tutti gli Abbonamenti</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingCompanies ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : companies && companies.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Azienda</TableHead>
                      <TableHead>Piano</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Scadenza</TableHead>
                      <TableHead>Utenti</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company: any) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.ragioneSociale}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{company.pianoAbbonamento}</Badge>
                        </TableCell>
                        <TableCell>
                          {company.subscriptionStatus ? (
                            <StatusBadge status={company.subscriptionStatus} type="subscription" />
                          ) : (
                            <Badge variant={company.abbonamentoAttivo ? 'success' : 'danger'}>
                              {company.abbonamentoAttivo ? 'Attivo' : 'Inattivo'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {company.dataScadenza ? (
                            new Date(company.dataScadenza).toLocaleDateString('it-IT')
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{company._count?.users || 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/admin/companies/${company.id}`}>
                              <Button variant="ghost" size="sm">
                                Gestisci
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Sei sicuro di ${company.abbonamentoAttivo ? 'disattivare' : 'attivare'} l'abbonamento?`
                                  )
                                ) {
                                  toggleSubscriptionMutation.mutate({
                                    id: company.id,
                                    attivo: !company.abbonamentoAttivo,
                                  });
                                }
                              }}
                            >
                              {company.abbonamentoAttivo ? 'Disattiva' : 'Attiva'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={<CreditCard className="h-12 w-12" />}
                  title="Nessuna azienda trovata"
                  description="Le aziende con abbonamenti appariranno qui"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
