'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent } from '@/components/ui-kit/card';
import { Input } from '@/components/ui-kit/input';
import { Button } from '@/components/ui-kit/button';
import { Badge } from '@/components/ui-kit/badge';
import { StatusBadge } from '@/components/ui-kit/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui-kit/table';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { Search, Users, X } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AdminUsersPage() {
  const [filters, setFilters] = useState({
    search: '',
    ruolo: '',
    attivo: '',
    companyId: '',
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: async () => {
      const response = await adminApi.getAllUsers(filters);
      return response.data;
    },
  });

  const hasActiveFilters = filters.search || filters.ruolo || filters.attivo || filters.companyId;

  const clearFilters = () => {
    setFilters({ search: '', ruolo: '', attivo: '', companyId: '' });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <PageHeader
          title="Gestione Utenti"
          description="Visualizza e gestisci tutti gli utenti del sistema"
          breadcrumb={[{ label: 'Admin' }, { label: 'Utenti' }]}
        />

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cerca utente..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filters.ruolo}
                onChange={(e) => setFilters({ ...filters, ruolo: e.target.value })}
              >
                <option value="">Tutti i ruoli</option>
                <option value="OWNER">Owner</option>
                <option value="TECNICO">Tecnico</option>
                <option value="BACKOFFICE">Backoffice</option>
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
              <Input
                type="text"
                placeholder="ID Azienda (opzionale)"
                value={filters.companyId}
                onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
              />
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
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
        ) : users && users.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ruolo</TableHead>
                      <TableHead>Azienda</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Lavori</TableHead>
                      <TableHead>Registrato</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: any) => (
                      <TableRow key={user.id} className="cursor-pointer hover:bg-accent">
                        <TableCell className="font-medium">
                          {user.nome} {user.cognome}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <StatusBadge status={user.ruolo} type="role" />
                        </TableCell>
                        <TableCell>
                          {user.company ? (
                            <Link
                              href={`/admin/companies/${user.company.id}`}
                              className="text-primary hover:underline"
                            >
                              {user.company.ragioneSociale}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.attivo ? 'success' : 'danger'}>
                            {user.attivo ? 'Attivo' : 'Inattivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>{user._count?.jobsAssegnati || 0}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('it-IT')}
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/users/${user.id}`}>
                            <Button variant="ghost" size="sm">
                              Dettagli
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
                icon={<Users className="h-12 w-12" />}
                title="Nessun utente trovato"
                description={hasActiveFilters ? 'Prova a modificare i filtri di ricerca' : 'Gli utenti registrati appariranno qui'}
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
