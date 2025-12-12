'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';
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

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Gestione Utenti</h1>
            <p className="text-sm text-gray-600">Visualizza e gestisci tutti gli utenti del sistema</p>
          </div>
        </header>

        <main className="p-6">
          {/* Filters */}
          <div className="card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Cerca utente..."
                className="input"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              <select
                className="input"
                value={filters.ruolo}
                onChange={(e) => setFilters({ ...filters, ruolo: e.target.value })}
              >
                <option value="">Tutti i ruoli</option>
                <option value="OWNER">Owner</option>
                <option value="TECNICO">Tecnico</option>
                <option value="BACKOFFICE">Backoffice</option>
              </select>
              <select
                className="input"
                value={filters.attivo}
                onChange={(e) => setFilters({ ...filters, attivo: e.target.value })}
              >
                <option value="">Tutti gli stati</option>
                <option value="true">Attivo</option>
                <option value="false">Inattivo</option>
              </select>
              <input
                type="text"
                placeholder="ID Azienda (opzionale)"
                className="input"
                value={filters.companyId}
                onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
              />
            </div>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div className="card">
              <p className="text-gray-500 text-center py-8">Caricamento...</p>
            </div>
          ) : users && users.length > 0 ? (
            <div className="card overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 text-left">Nome</th>
                    <th className="border p-3 text-left">Email</th>
                    <th className="border p-3 text-left">Ruolo</th>
                    <th className="border p-3 text-left">Azienda</th>
                    <th className="border p-3 text-left">Stato</th>
                    <th className="border p-3 text-left">Lavori</th>
                    <th className="border p-3 text-left">Registrato</th>
                    <th className="border p-3 text-left">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="border p-3">
                        {user.nome} {user.cognome}
                      </td>
                      <td className="border p-3">{user.email}</td>
                      <td className="border p-3">
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                          {user.ruolo}
                        </span>
                      </td>
                      <td className="border p-3">
                        {user.company ? (
                          <Link
                            href={`/admin/companies/${user.company.id}`}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            {user.company.ragioneSociale}
                          </Link>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="border p-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          user.attivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.attivo ? 'Attivo' : 'Inattivo'}
                        </span>
                      </td>
                      <td className="border p-3">{user._count?.jobsAssegnati || 0}</td>
                      <td className="border p-3 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('it-IT')}
                      </td>
                      <td className="border p-3">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Dettagli →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-500">Nessun utente trovato</p>
            </div>
          )}
        </main>
      </div>
    </AdminLayout>
  );
}

