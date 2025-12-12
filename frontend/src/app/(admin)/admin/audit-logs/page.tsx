'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';

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
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-sm text-gray-600">Traccia tutte le azioni critiche del sistema</p>
          </div>
        </header>

        <main className="p-6">
          {/* Filters */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">Filtri</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cerca</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Azione, entità, ID..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Attore</label>
                <select
                  className="input"
                  value={filters.actorType}
                  onChange={(e) => handleFilterChange('actorType', e.target.value)}
                >
                  <option value="">Tutti</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="USER">Utente</option>
                  <option value="SYSTEM">Sistema</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Azione</label>
                <input
                  type="text"
                  className="input"
                  placeholder="LOGIN, IMPERSONATE..."
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entità</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Company, User..."
                  value={filters.entity}
                  onChange={(e) => handleFilterChange('entity', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Inizio</label>
                <input
                  type="date"
                  className="input"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Fine</label>
                <input
                  type="date"
                  className="input"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          {pagination.total > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              Totale: {pagination.total} log • Pagina {pagination.page} di {pagination.totalPages}
            </div>
          )}

          {/* Table */}
          {isLoading ? (
            <div className="card text-center py-12">
              <p className="text-gray-500">Caricamento...</p>
            </div>
          ) : logs.length > 0 ? (
            <div className="card overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left text-xs">Data/Ora</th>
                    <th className="border p-2 text-left text-xs">Attore</th>
                    <th className="border p-2 text-left text-xs">Azione</th>
                    <th className="border p-2 text-left text-xs">Entità</th>
                    <th className="border p-2 text-left text-xs">Company</th>
                    <th className="border p-2 text-left text-xs">IP</th>
                    <th className="border p-2 text-left text-xs">Dettagli</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="border p-2 text-xs">
                        {new Date(log.createdAt).toLocaleString('it-IT')}
                      </td>
                      <td className="border p-2 text-xs">
                        <div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            log.actorType === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                            log.actorType === 'USER' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.actorType}
                          </span>
                          {log.actor && (
                            <div className="mt-1 text-gray-600">
                              {log.actor.nome} {log.actor.cognome}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="border p-2 text-xs">
                        <span className="font-medium">{log.action}</span>
                      </td>
                      <td className="border p-2 text-xs">
                        {log.entity} {log.entityId && `(${log.entityId.substring(0, 8)}...)`}
                      </td>
                      <td className="border p-2 text-xs">
                        {log.company ? (
                          <span className="text-blue-600">{log.company.ragioneSociale}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="border p-2 text-xs font-mono text-xs">
                        {log.ip || '-'}
                      </td>
                      <td className="border p-2 text-xs">
                        <button
                          className="text-primary-600 hover:text-primary-700 text-xs"
                          onClick={() => {
                            alert(JSON.stringify(log.metadata, null, 2));
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-500">Nessun log trovato</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                className="btn btn-secondary"
                disabled={pagination.page === 1}
                onClick={() => handleFilterChange('page', pagination.page - 1)}
              >
                ← Precedente
              </button>
              <span className="px-4 py-2">
                Pagina {pagination.page} di {pagination.totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handleFilterChange('page', pagination.page + 1)}
              >
                Successiva →
              </button>
            </div>
          )}
        </main>
      </div>
    </AdminLayout>
  );
}

