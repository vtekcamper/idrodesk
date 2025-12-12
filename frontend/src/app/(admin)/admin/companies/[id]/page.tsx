'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';
import { useState } from 'react';

export const dynamic = 'force-dynamic';

export default function AdminCompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const companyId = params.id as string;
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planData, setPlanData] = useState({
    pianoAbbonamento: '',
    abbonamentoAttivo: true,
    dataScadenza: '',
    motivo: '',
  });

  const { data: company, isLoading } = useQuery({
    queryKey: ['admin', 'company', companyId],
    queryFn: async () => {
      const response = await adminApi.getCompany(companyId);
      return response.data;
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateCompanyPlan(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
      setShowPlanModal(false);
    },
  });

  const toggleSubscriptionMutation = useMutation({
    mutationFn: (data: any) => adminApi.toggleSubscription(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">Caricamento...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!company) {
    return (
      <AdminLayout>
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">Azienda non trovata</div>
        </div>
      </AdminLayout>
    );
  }

  const handleUpdatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlanMutation.mutate(planData);
  };

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <button
              onClick={() => router.back()}
              className="text-primary-600 hover:text-primary-700 mb-2 inline-block"
            >
              ← Indietro
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{company.ragioneSociale}</h1>
          </div>
        </header>

        <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Info Azienda */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Informazioni Azienda</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Ragione Sociale</p>
                <p className="font-medium">{company.ragioneSociale}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">P.IVA</p>
                <p className="font-medium">{company.piva}</p>
              </div>
              {company.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{company.email}</p>
                </div>
              )}
              {company.telefono && (
                <div>
                  <p className="text-sm text-gray-500">Telefono</p>
                  <p className="font-medium">{company.telefono}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Data Registrazione</p>
                <p className="font-medium">
                  {new Date(company.createdAt).toLocaleDateString('it-IT')}
                </p>
              </div>
            </div>
          </div>

          {/* Abbonamento */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Abbonamento</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Piano Attuale</p>
                <p className="font-medium text-lg">{company.pianoAbbonamento}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Stato</p>
                <span className={`px-3 py-1 text-sm rounded ${
                  company.abbonamentoAttivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {company.abbonamentoAttivo ? 'Attivo' : 'Inattivo'}
                </span>
              </div>
              {company.dataScadenza && (
                <div>
                  <p className="text-sm text-gray-500">Scadenza</p>
                  <p className="font-medium">
                    {new Date(company.dataScadenza).toLocaleDateString('it-IT')}
                  </p>
                </div>
              )}
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => {
                    setPlanData({
                      pianoAbbonamento: company.pianoAbbonamento,
                      abbonamentoAttivo: company.abbonamentoAttivo,
                      dataScadenza: company.dataScadenza ? new Date(company.dataScadenza).toISOString().split('T')[0] : '',
                      motivo: '',
                    });
                    setShowPlanModal(true);
                  }}
                  className="w-full btn btn-primary"
                >
                  Modifica Piano
                </button>
                <button
                  onClick={() => {
                    toggleSubscriptionMutation.mutate({
                      attivo: !company.abbonamentoAttivo,
                      motivo: 'Modifica da admin',
                    });
                  }}
                  className={`w-full btn ${company.abbonamentoAttivo ? 'btn-danger' : 'btn-primary'}`}
                >
                  {company.abbonamentoAttivo ? 'Disattiva Abbonamento' : 'Attiva Abbonamento'}
                </button>
              </div>
            </div>
          </div>

          {/* Statistiche */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Statistiche</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Utenti</p>
                <p className="font-medium">{company._count.users}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Clienti</p>
                <p className="font-medium">{company._count.clients}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Lavori</p>
                <p className="font-medium">{company._count.jobs}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Preventivi</p>
                <p className="font-medium">{company._count.quotes}</p>
              </div>
            </div>
          </div>

          {/* Limiti Piano */}
          {company.limits && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Limiti Piano {company.pianoAbbonamento}</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Utenti:</span>{' '}
                  {company.limits.maxUsers === -1 ? 'Illimitati' : company.limits.maxUsers}
                </div>
                <div>
                  <span className="text-gray-600">Clienti:</span>{' '}
                  {company.limits.maxClients === -1 ? 'Illimitati' : company.limits.maxClients}
                </div>
                <div>
                  <span className="text-gray-600">Lavori/mese:</span>{' '}
                  {company.limits.maxJobsPerMonth === -1 ? 'Illimitati' : company.limits.maxJobsPerMonth}
                </div>
                <div>
                  <span className="text-gray-600">Storage:</span>{' '}
                  {company.limits.maxStorageGB === -1 ? 'Illimitato' : `${company.limits.maxStorageGB}GB`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* History */}
        {company.subscriptionHistory && company.subscriptionHistory.length > 0 && (
          <div className="card mt-6">
            <h2 className="text-lg font-semibold mb-4">Storico Abbonamenti</h2>
            <div className="space-y-2">
              {company.subscriptionHistory.map((history: any) => (
                <div key={history.id} className="border-b pb-2">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">
                        {history.pianoPrecedente} → {history.pianoNuovo}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(history.dataCambio).toLocaleString('it-IT')}
                      </p>
                    </div>
                    {history.motivo && (
                      <p className="text-sm text-gray-500">{history.motivo}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Cambio Piano */}
        {showPlanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Modifica Piano Abbonamento</h3>
              <form onSubmit={handleUpdatePlan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nuovo Piano
                  </label>
                  <select
                    className="input"
                    value={planData.pianoAbbonamento}
                    onChange={(e) => setPlanData({ ...planData, pianoAbbonamento: e.target.value })}
                    required
                  >
                    <option value="">Seleziona piano</option>
                    <option value="BASIC">BASIC</option>
                    <option value="PRO">PRO</option>
                    <option value="ELITE">ELITE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Scadenza (opzionale)
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={planData.dataScadenza}
                    onChange={(e) => setPlanData({ ...planData, dataScadenza: e.target.value })}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={planData.abbonamentoAttivo}
                      onChange={(e) => setPlanData({ ...planData, abbonamentoAttivo: e.target.checked })}
                    />
                    <span className="text-sm">Abbonamento attivo</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo (opzionale)
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    value={planData.motivo}
                    onChange={(e) => setPlanData({ ...planData, motivo: e.target.value })}
                    placeholder="Motivo del cambio piano..."
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary flex-1">
                    Salva
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPlanModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Annulla
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </main>
      </div>
    </AdminLayout>
  );
}

