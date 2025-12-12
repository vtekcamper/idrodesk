'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import { adminAuth } from '@/lib/adminAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (!adminAuth.isSuperAdmin()) {
      router.push('/admin/login');
    }
  }, [router]);

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

  if (!adminAuth.isSuperAdmin()) {
    return null;
  }

  const admin = adminAuth.getAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Gestione sistema IdroDesk</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {admin?.nome} {admin?.cognome}
              </span>
              <button
                onClick={() => {
                  adminAuth.logout();
                  router.push('/admin/login');
                }}
                className="btn btn-secondary"
              >
                Esci
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {loadingStats ? (
          <p>Caricamento statistiche...</p>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500">Totale Aziende</h3>
              <p className="text-3xl font-bold mt-2">{stats.companies.total}</p>
              <p className="text-sm text-gray-600 mt-1">
                {stats.companies.active} attive
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500">Nuove Questo Mese</h3>
              <p className="text-3xl font-bold mt-2">{stats.companies.newThisMonth}</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500">Totale Utenti</h3>
              <p className="text-3xl font-bold mt-2">{stats.users.total}</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500">Totale Lavori</h3>
              <p className="text-3xl font-bold mt-2">{stats.data.jobs}</p>
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
            <a
              href="/admin/companies"
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              Vedi tutte →
            </a>
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
                        <a
                          href={`/admin/companies/${company.id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          Gestisci
                        </a>
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
  );
}

