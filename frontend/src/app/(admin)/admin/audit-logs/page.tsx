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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui-kit/table';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { ScrollText, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminAuditLogsPage() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    actorType: '',
    action: '',
    entity: '',
    companyId: '',
    startDate: '',
    endDate: '',
    search: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', filters],
    queryFn: async () => {
      const response = await adminApi.getAllAuditLogs(filters);
      return response.data;
    },
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const logs = data?.logs || [];
  const pagination = data?.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <PageHeader
          title="Audit Log"
          description="Traccia tutte le azioni critiche del sistema"
          breadcrumb={[{ label: 'Admin' }, { label: 'Audit Log' }]}
        />

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Azione, entità, ID..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filters.actorType}
                onChange={(e) => handleFilterChange('actorType', e.target.value)}
              >
                <option value="">Tutti i tipi</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="USER">Utente</option>
                <option value="SYSTEM">Sistema</option>
              </select>
              <Input
                type="text"
                placeholder="Azione (LOGIN, IMPERSONATE...)"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              />
              <Input
                type="text"
                placeholder="Entità (Company, User...)"
                value={filters.entity}
                onChange={(e) => handleFilterChange('entity', e.target.value)}
              />
              <Input
                type="date"
                placeholder="Data Inizio"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
              <Input
                type="date"
                placeholder="Data Fine"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {pagination.total > 0 && (
          <div className="text-sm text-muted-foreground">
            Totale: {pagination.total} log • Pagina {pagination.page} di {pagination.totalPages}
          </div>
        )}

        {/* Table */}
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
        ) : logs.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Ora</TableHead>
                      <TableHead>Attore</TableHead>
                      <TableHead>Azione</TableHead>
                      <TableHead>Entità</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Dettagli</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: any) => (
                      <TableRow key={log.id} className="hover:bg-accent">
                        <TableCell className="text-sm">
                          {new Date(log.createdAt).toLocaleString('it-IT')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge
                              variant={
                                log.actorType === 'SUPER_ADMIN'
                                  ? 'default'
                                  : log.actorType === 'USER'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {log.actorType}
                            </Badge>
                            {log.actor && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {log.actor.nome} {log.actor.cognome}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell>
                          {log.entity} {log.entityId && (
                            <span className="text-xs text-muted-foreground font-mono">
                              ({log.entityId.substring(0, 8)}...)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.company ? (
                            <span className="text-primary">{log.company.ragioneSociale}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.ip || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              alert(JSON.stringify(log.metadata, null, 2));
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
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
                icon={<ScrollText className="h-12 w-12" />}
                title="Nessun log trovato"
                description="I log delle azioni appariranno qui"
              />
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => handleFilterChange('page', pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Precedente
            </Button>
            <span className="text-sm text-muted-foreground">
              Pagina {pagination.page} di {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handleFilterChange('page', pagination.page + 1)}
            >
              Successiva
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
