'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';

export const dynamic = 'force-dynamic';

export default function AdminReportsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'advanced', dateRange],
    queryFn: async () => {
      const response = await adminApi.getAdvancedReports({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      return response.data;
    },
  });

  const { data: topCompanies } = useQuery({
    queryKey: ['admin', 'reports', 'companies', 'top'],
    queryFn: async () => {
      const response = await adminApi.getTopCompanies({ limit: 10, metric: 'revenue' });
      return response.data;
    },
  });

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Report e Analytics</h1>
            <p className="text-sm text-gray-600">Analisi dettagliate del sistema</p>
          </div>
        </header>

        <main className="p-6">
          {/* Date Range Filter */}
          <div className="card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Inizio
                </label>
                <input
                  type="date"
                  className="input"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fine
                </label>
                <input
                  type="date"
                  className="input"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="card">
              <p className="text-gray-500 text-center py-8">Caricamento report...</p>
            </div>
          ) : reports && (
            <>
              {/* Revenue Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <h3 className="text-sm font-medium text-green-700 mb-2">Revenue Totale</h3>
                  <p className="text-3xl font-bold text-green-900">
                    €{Number(reports.revenue.total).toFixed(2)}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {reports.revenue.payments} pagamenti completati
                  </p>
                </div>

                <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <h3 className="text-sm font-medium text-blue-700 mb-2">Nuove Aziende</h3>
                  <p className="text-3xl font-bold text-blue-900">{reports.growth.newCompanies}</p>
                  <p className="text-sm text-blue-600 mt-1">Nel periodo selezionato</p>
                </div>

                <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <h3 className="text-sm font-medium text-purple-700 mb-2">Nuovi Utenti</h3>
                  <p className="text-3xl font-bold text-purple-900">{reports.growth.newUsers}</p>
                  <p className="text-sm text-purple-600 mt-1">Nel periodo selezionato</p>
                </div>
              </div>

              {/* Subscriptions Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="card">
                  <h2 className="text-lg font-semibold mb-4">Abbonamenti</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Attivi</span>
                      <span className="font-bold text-green-600">{reports.subscriptions.active}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">In Scadenza</span>
                      <span className="font-bold text-yellow-600">{reports.subscriptions.expiring}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-2">Per Piano</p>
                      {reports.subscriptions.byPlan && Array.isArray(reports.subscriptions.byPlan) ? (
                        reports.subscriptions.byPlan.map((plan: any) => (
                          <div key={plan.pianoAbbonamento} className="flex justify-between text-sm">
                            <span className="text-gray-600">{plan.pianoAbbonamento}</span>
                            <span className="font-medium">{plan._count.id}</span>
                          </div>
                        ))
                      ) : (
                        Object.entries(reports.subscriptions.byPlan || {}).map(([plan, count]: [string, any]) => (
                          <div key={plan} className="flex justify-between text-sm">
                            <span className="text-gray-600">{plan}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h2 className="text-lg font-semibold mb-4">Attività</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Totale Lavori</span>
                      <span className="font-bold">{reports.activity.jobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Totale Preventivi</span>
                      <span className="font-bold">{reports.activity.quotes}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Stats */}
              {reports.monthly && reports.monthly.length > 0 && (
                <div className="card mb-6">
                  <h2 className="text-lg font-semibold mb-4">Statistiche Mensili (Ultimi 12 Mesi)</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-3 text-left">Mese</th>
                          <th className="border p-3 text-right">Revenue</th>
                          <th className="border p-3 text-right">Nuove Aziende</th>
                          <th className="border p-3 text-right">Nuovi Utenti</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.monthly.map((month: any) => (
                          <tr key={month.month} className="hover:bg-gray-50">
                            <td className="border p-3">{month.month}</td>
                            <td className="border p-3 text-right font-medium">
                              €{Number(month.revenue).toFixed(2)}
                            </td>
                            <td className="border p-3 text-right">{month.companies}</td>
                            <td className="border p-3 text-right">{month.users}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top Companies */}
              {topCompanies && topCompanies.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-semibold mb-4">Top Aziende per Revenue</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-3 text-left">Azienda</th>
                          <th className="border p-3 text-left">Piano</th>
                          <th className="border p-3 text-right">Revenue</th>
                          <th className="border p-3 text-right">Lavori</th>
                          <th className="border p-3 text-right">Clienti</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCompanies.map((company: any) => (
                          <tr key={company.id} className="hover:bg-gray-50">
                            <td className="border p-3">{company.ragioneSociale}</td>
                            <td className="border p-3">
                              <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                                {company.pianoAbbonamento}
                              </span>
                            </td>
                            <td className="border p-3 text-right font-medium">
                              €{Number(company.totalRevenue || 0).toFixed(2)}
                            </td>
                            <td className="border p-3 text-right">{company._count.jobs}</td>
                            <td className="border p-3 text-right">{company._count.clients}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </AdminLayout>
  );
}

