'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
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
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Panoramica sistema IdroDesk</p>
          </div>
        </header>

        <main className="p-6">
          {/* Stats Cards */}
          {loadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-700">Totale Aziende</h3>
                    <p className="text-3xl font-bold mt-2 text-blue-900">{stats.companies.total}</p>
                    <p className="text-sm text-blue-600 mt-1">
                      {stats.companies.active} attive • {stats.companies.inactive} inattive
                    </p>
                  </div>
                  <div className="text-4xl">🏢</div>
                </div>
              </div>
              
              <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-green-700">Nuove Questo Mese</h3>
                    <p className="text-3xl font-bold mt-2 text-green-900">{stats.companies.newThisMonth}</p>
                    <p className="text-sm text-green-600 mt-1">Registrazioni recenti</p>
                  </div>
                  <div className="text-4xl">📈</div>
                </div>
              </div>
              
              <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-purple-700">Totale Utenti</h3>
                    <p className="text-3xl font-bold mt-2 text-purple-900">{stats.users.total}</p>
                    <p className="text-sm text-purple-600 mt-1">Utenti attivi</p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>
              
              <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-orange-700">Totale Lavori</h3>
                    <p className="text-3xl font-bold mt-2 text-orange-900">{stats.data.jobs}</p>
                    <p className="text-sm text-orange-600 mt-1">
                      {stats.data.quotes} preventivi • {stats.data.clients} clienti
                    </p>
                  </div>
                  <div className="text-4xl">🔧</div>
                </div>
              </div>
            </div>
          )}

        {/* Companies by Plan */}
        {stats && (
          <div className="card mb-8">
            <h2 className="text-lg font-semibold mb-4">Aziende per Piano</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">BASIC</p>
                <p className="text-2xl font-bold">{stats.companies.byPlan.BASIC || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">PRO</p>
                <p className="text-2xl font-bold">{stats.companies.byPlan.PRO || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ELITE</p>
                <p className="text-2xl font-bold">{stats.companies.byPlan.ELITE || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Companies List */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Aziende</h2>
            <Link
              href="/admin/companies"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Vedi tutte →
            </Link>
          </div>
          {loadingCompanies ? (
            <p className="text-gray-500">Caricamento...</p>
          ) : companies && companies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Azienda</th>
                    <th className="border p-2 text-left">P.IVA</th>
                    <th className="border p-2 text-left">Piano</th>
                    <th className="border p-2 text-left">Stato</th>
                    <th className="border p-2 text-left">Utenti</th>
                    <th className="border p-2 text-left">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.slice(0, 10).map((company: any) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="border p-2">{company.ragioneSociale}</td>
                      <td className="border p-2">{company.piva}</td>
                      <td className="border p-2">{company.pianoAbbonamento}</td>
                      <td className="border p-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          company.abbonamentoAttivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {company.abbonamentoAttivo ? 'Attivo' : 'Inattivo'}
                        </span>
                      </td>
                      <td className="border p-2">{company._count.users}</td>
                    <td className="border p-2">
                      <Link
                        href={`/admin/companies/${company.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Gestisci →
                      </Link>
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">Nessuna azienda trovata</p>
          )}
        </div>
        </main>
      </div>
    </AdminLayout>
  );
}

