'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent } from '@/components/ui-kit/card';
import { Input } from '@/components/ui-kit/input';
import { Button } from '@/components/ui-kit/button';
import { StatusBadge } from '@/components/ui-kit/status-badge';
import { Badge } from '@/components/ui-kit/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui-kit/table';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { Search, Building2, X } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AdminCompaniesPage() {
  const [filters, setFilters] = useState({
    search: '',
    piano: '',
    attivo: '',
  });

  const { data: companies, isLoading } = useQuery({
    queryKey: ['admin', 'companies', filters],
    queryFn: async () => {
      const response = await adminApi.getAllCompanies(filters);
      return response.data;
    },
  });

  const hasActiveFilters = filters.search || filters.piano || filters.attivo;

  const clearFilters = () => {
    setFilters({ search: '', piano: '', attivo: '' });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <PageHeader
          title="Gestione Aziende"
          description="Visualizza e gestisci tutte le aziende registrate"
          breadcrumb={[{ label: 'Admin' }, { label: 'Aziende' }]}
        />

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cerca azienda..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filters.piano}
                onChange={(e) => setFilters({ ...filters, piano: e.target.value })}
              >
                <option value="">Tutti i piani</option>
                <option value="BASIC">BASIC</option>
                <option value="PRO">PRO</option>
                <option value="ELITE">ELITE</option>
              </select>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filters.attivo}
                onChange={(e) => setFilters({ ...filters, attivo: e.target.value })}
              >
                <option value="">Tutti gli stati</option>
                <option value="true">Attivo</option>
                <option value="false">Inattivo</option>
              </select>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Companies Table */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : companies && companies.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Azienda</TableHead>
                      <TableHead>P.IVA</TableHead>
                      <TableHead>Piano</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Utenti</TableHead>
                      <TableHead>Clienti</TableHead>
                      <TableHead>Lavori</TableHead>
                      <TableHead>Uso</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company: any) => (
                      <TableRow key={company.id} className="cursor-pointer hover:bg-accent">
                        <TableCell className="font-medium">{company.ragioneSociale}</TableCell>
                        <TableCell className="font-mono text-sm">{company.piva}</TableCell>
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
                        <TableCell>{company._count?.users || 0}</TableCell>
                        <TableCell>{company._count?.clients || 0}</TableCell>
                        <TableCell>{company._count?.jobs || 0}</TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            <div>
                              Utenti: {company.usage?.users.current || 0}/
                              {company.usage?.users.limit === -1 ? '∞' : company.usage?.users.limit || 0}
                            </div>
                            <div>
                              Clienti: {company.usage?.clients.current || 0}/
                              {company.usage?.clients.limit === -1 ? '∞' : company.usage?.clients.limit || 0}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/companies/${company.id}`}>
                            <Button variant="ghost" size="sm">
                              Gestisci
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                icon={<Building2 className="h-12 w-12" />}
                title="Nessuna azienda trovata"
                description={hasActiveFilters ? 'Prova a modificare i filtri di ricerca' : 'Le aziende registrate appariranno qui'}
                action={
                  hasActiveFilters
                    ? {
                        label: 'Rimuovi filtri',
                        onClick: clearFilters,
                      }
                    : undefined
                }
              />
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
