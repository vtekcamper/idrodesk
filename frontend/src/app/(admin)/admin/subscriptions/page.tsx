'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';
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
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Gestione Abbonamenti</h1>
            <p className="text-sm text-gray-600">Monitora e gestisci gli abbonamenti delle aziende</p>
          </div>
        </header>

        <main className="p-6">
          {/* Alert Abbonamenti in Scadenza */}
          <div className="card bg-yellow-50 border-yellow-200 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-yellow-900 mb-2">
                  ⚠️ Abbonamenti in Scadenza
                </h2>
                <p className="text-sm text-yellow-700">
                  {loadingExpiring ? 'Caricamento...' : `${expiring?.length || 0} abbonamenti scadono nei prossimi ${daysFilter} giorni`}
                </p>
              </div>
              <select
                className="input bg-white"
                value={daysFilter}
                onChange={(e) => setDaysFilter(Number(e.target.value))}
              >
                <option value={7}>7 giorni</option>
                <option value={15}>15 giorni</option>
                <option value={30}>30 giorni</option>
                <option value={60}>60 giorni</option>
              </select>
            </div>
          </div>

          {/* Lista Abbonamenti in Scadenza */}
          {expiring && expiring.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-lg font-semibold mb-4">Prossime Scadenze</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-3 text-left">Azienda</th>
                      <th className="border p-3 text-left">Piano</th>
                      <th className="border p-3 text-left">Scadenza</th>
                      <th className="border p-3 text-left">Giorni Rimanenti</th>
                      <th className="border p-3 text-left">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiring.map((company: any) => {
                      const daysLeft = Math.ceil(
                        (new Date(company.dataScadenza).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <tr key={company.id} className="hover:bg-gray-50">
                          <td className="border p-3">
                            <Link
                              href={`/admin/companies/${company.id}`}
                              className="text-primary-600 hover:text-primary-700 font-medium"
                            >
                              {company.ragioneSociale}
                            </Link>
                          </td>
                          <td className="border p-3">
                            <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                              {company.pianoAbbonamento}
                            </span>
                          </td>
                          <td className="border p-3">
                            {new Date(company.dataScadenza).toLocaleDateString('it-IT')}
                          </td>
                          <td className="border p-3">
                            <span className={`px-2 py-1 text-xs rounded font-medium ${
                              daysLeft <= 7 ? 'bg-red-100 text-red-800' :
                              daysLeft <= 15 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {daysLeft} giorni
                            </span>
                          </td>
                          <td className="border p-3">
                            <Link
                              href={`/admin/companies/${company.id}`}
                              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                              Gestisci →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tutte le Aziende con Abbonamenti */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Tutti gli Abbonamenti</h2>
            {loadingCompanies ? (
              <p className="text-gray-500 text-center py-8">Caricamento...</p>
            ) : companies && companies.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-3 text-left">Azienda</th>
                      <th className="border p-3 text-left">Piano</th>
                      <th className="border p-3 text-left">Stato</th>
                      <th className="border p-3 text-left">Scadenza</th>
                      <th className="border p-3 text-left">Utenti</th>
                      <th className="border p-3 text-left">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company: any) => (
                      <tr key={company.id} className="hover:bg-gray-50">
                        <td className="border p-3">{company.ragioneSociale}</td>
                        <td className="border p-3">
                          <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                            {company.pianoAbbonamento}
                          </span>
                        </td>
                        <td className="border p-3">
                          <span className={`px-2 py-1 text-xs rounded ${
                            company.abbonamentoAttivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {company.abbonamentoAttivo ? 'Attivo' : 'Inattivo'}
                          </span>
                        </td>
                        <td className="border p-3">
                          {company.dataScadenza ? (
                            new Date(company.dataScadenza).toLocaleDateString('it-IT')
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="border p-3">{company._count?.users || 0}</td>
                        <td className="border p-3">
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/companies/${company.id}`}
                              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                              Gestisci
                            </Link>
                            <button
                              onClick={() => {
                                if (confirm(`Sei sicuro di ${company.abbonamentoAttivo ? 'disattivare' : 'attivare'} l'abbonamento?`)) {
                                  toggleSubscriptionMutation.mutate({
                                    id: company.id,
                                    attivo: !company.abbonamentoAttivo,
                                  });
                                }
                              }}
                              className={`text-sm font-medium ${
                                company.abbonamentoAttivo
                                  ? 'text-red-600 hover:text-red-700'
                                  : 'text-green-600 hover:text-green-700'
                              }`}
                            >
                              {company.abbonamentoAttivo ? 'Disattiva' : 'Attiva'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Nessuna azienda trovata</p>
            )}
          </div>
        </main>
      </div>
    </AdminLayout>
  );
}

