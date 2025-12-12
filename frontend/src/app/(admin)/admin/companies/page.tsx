'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';
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

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Gestione Aziende</h1>
            <p className="text-sm text-gray-600">Visualizza e gestisci tutte le aziende registrate</p>
          </div>
        </header>

        <main className="p-6">
        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Cerca azienda..."
              className="input"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <select
              className="input"
              value={filters.piano}
              onChange={(e) => setFilters({ ...filters, piano: e.target.value })}
            >
              <option value="">Tutti i piani</option>
              <option value="BASIC">BASIC</option>
              <option value="PRO">PRO</option>
              <option value="ELITE">ELITE</option>
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
          </div>
        </div>

        {/* Companies Table */}
        {isLoading ? (
          <p className="text-gray-500">Caricamento...</p>
        ) : companies && companies.length > 0 ? (
          <div className="card overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Azienda</th>
                  <th className="border p-2 text-left">P.IVA</th>
                  <th className="border p-2 text-left">Piano</th>
                  <th className="border p-2 text-left">Stato</th>
                  <th className="border p-2 text-left">Utenti</th>
                  <th className="border p-2 text-left">Clienti</th>
                  <th className="border p-2 text-left">Lavori</th>
                  <th className="border p-2 text-left">Uso</th>
                  <th className="border p-2 text-left">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company: any) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="border p-2">{company.ragioneSociale}</td>
                    <td className="border p-2">{company.piva}</td>
                    <td className="border p-2">
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                        {company.pianoAbbonamento}
                      </span>
                    </td>
                    <td className="border p-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        company.abbonamentoAttivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {company.abbonamentoAttivo ? 'Attivo' : 'Inattivo'}
                      </span>
                    </td>
                    <td className="border p-2">{company._count.users}</td>
                    <td className="border p-2">{company._count.clients}</td>
                    <td className="border p-2">{company._count.jobs}</td>
                    <td className="border p-2">
                      <div className="text-xs">
                        <div>Utenti: {company.usage?.users.current}/{company.usage?.users.limit === -1 ? '∞' : company.usage?.users.limit}</div>
                        <div>Clienti: {company.usage?.clients.current}/{company.usage?.clients.limit === -1 ? '∞' : company.usage?.clients.limit}</div>
                      </div>
                    </td>
                    <td className="border p-2">
                      <Link
                        href={`/admin/companies/${company.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        Gestisci
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500">Nessuna azienda trovata</p>
          </div>
        )}
        </main>
      </div>
    </AdminLayout>
  );
}

