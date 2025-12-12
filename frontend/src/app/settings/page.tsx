'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'settings' | 'usage' | 'billing' | 'payments' | 'gdpr'>('settings');

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['company', 'settings'],
    queryFn: async () => {
      const response = await companyApi.getSettings();
      return response.data;
    },
  });

  const { data: usage } = useQuery({
    queryKey: ['company', 'usage'],
    queryFn: async () => {
      const response = await companyApi.getUsage();
      return response.data;
    },
    enabled: activeTab === 'usage',
  });

  const { data: billing } = useQuery({
    queryKey: ['company', 'billing'],
    queryFn: async () => {
      const response = await companyApi.getBilling();
      return response.data;
    },
    enabled: activeTab === 'billing',
  });

  const { data: payments } = useQuery({
    queryKey: ['company', 'payments'],
    queryFn: async () => {
      const response = await companyApi.getPayments();
      return response.data;
    },
    enabled: activeTab === 'payments',
  });

  const { data: exports } = useQuery({
    queryKey: ['company', 'exports'],
    queryFn: async () => {
      const response = await companyApi.getDataExports();
      return response.data;
    },
    enabled: activeTab === 'gdpr',
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => companyApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'settings'] });
      alert('Impostazioni aggiornate con successo');
    },
  });

  const exportMutation = useMutation({
    mutationFn: (data: any) => companyApi.requestDataExport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'exports'] });
      alert('Export richiesto. Riceverai una notifica quando sarà pronto.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => companyApi.softDeleteCompany(),
    onSuccess: () => {
      alert('Account eliminato. I dati saranno eliminati definitivamente dopo 30 giorni.');
      router.push('/login');
    },
  });

  const [formData, setFormData] = useState({
    ragioneSociale: '',
    indirizzo: '',
    telefono: '',
    email: '',
  });

  if (loadingSettings) {
    return <div className="p-8">Caricamento...</div>;
  }

  if (settings && !formData.ragioneSociale) {
    setFormData({
      ragioneSociale: settings.ragioneSociale || '',
      indirizzo: settings.indirizzo || '',
      telefono: settings.telefono || '',
      email: settings.email || '',
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Impostazioni</h1>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'settings', label: 'Impostazioni Azienda' },
                { id: 'usage', label: 'Utilizzo' },
                { id: 'billing', label: 'Fatturazione' },
                { id: 'payments', label: 'Pagamenti' },
                { id: 'gdpr', label: 'GDPR & Privacy' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 font-medium text-sm border-b-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Informazioni Azienda</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateSettingsMutation.mutate(formData);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ragione Sociale
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={formData.ragioneSociale}
                      onChange={(e) =>
                        setFormData({ ...formData, ragioneSociale: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Indirizzo
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={formData.indirizzo}
                      onChange={(e) =>
                        setFormData({ ...formData, indirizzo: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefono
                    </label>
                    <input
                      type="tel"
                      className="input"
                      value={formData.telefono}
                      onChange={(e) =>
                        setFormData({ ...formData, telefono: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="input"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Salva Modifiche
                  </button>
                </form>
              </div>
            )}

            {/* Usage Tab */}
            {activeTab === 'usage' && usage && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Utilizzo Risorse</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(usage.usage).map(([key, value]: [string, any]) => (
                    <div key={key} className="card">
                      <h3 className="font-semibold mb-2 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      <div className="text-2xl font-bold">
                        {value.current} / {value.limit}
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${Math.min(value.percentage, 100)}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {value.percentage}% utilizzato
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && billing && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Fatturazione</h2>
                <div className="card">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Piano Attuale</p>
                      <p className="text-lg font-semibold">{billing.plan}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Stato</p>
                      <p className="text-lg font-semibold">{billing.status}</p>
                    </div>
                    {billing.expiryDate && (
                      <div>
                        <p className="text-sm text-gray-600">Scadenza</p>
                        <p className="text-lg font-semibold">
                          {new Date(billing.expiryDate).toLocaleDateString('it-IT')}
                        </p>
                        {billing.daysRemaining !== null && (
                          <p className="text-sm text-gray-500">
                            {billing.daysRemaining > 0
                              ? `${billing.daysRemaining} giorni rimanenti`
                              : 'Scaduto'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && payments && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Storico Pagamenti</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-3 text-left">Data</th>
                        <th className="border p-3 text-left">Importo</th>
                        <th className="border p-3 text-left">Stato</th>
                        <th className="border p-3 text-left">Metodo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.payments?.map((payment: any) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="border p-3">
                            {new Date(payment.createdAt).toLocaleDateString('it-IT')}
                          </td>
                          <td className="border p-3">
                            €{Number(payment.amount).toFixed(2)}
                          </td>
                          <td className="border p-3">
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                payment.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-800'
                                  : payment.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="border p-3">{payment.paymentMethod}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* GDPR Tab */}
            {activeTab === 'gdpr' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">GDPR & Privacy</h2>
                <div className="card">
                  <h3 className="font-semibold mb-4">Export Dati</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Richiedi un export completo dei tuoi dati in formato CSV, JSON o ZIP.
                  </p>
                  <button
                    onClick={() => exportMutation.mutate({ format: 'ZIP' })}
                    className="btn btn-primary"
                    disabled={exportMutation.isPending}
                  >
                    {exportMutation.isPending ? 'Richiesta in corso...' : 'Richiedi Export ZIP'}
                  </button>
                </div>

                {exports && exports.length > 0 && (
                  <div className="card">
                    <h3 className="font-semibold mb-4">Export Richiesti</h3>
                    <div className="space-y-2">
                      {exports.map((exp: any) => (
                        <div
                          key={exp.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium">
                              Export {exp.format} - {new Date(exp.createdAt).toLocaleDateString('it-IT')}
                            </p>
                            <p className="text-sm text-gray-600">Stato: {exp.status}</p>
                          </div>
                          {exp.status === 'COMPLETED' && exp.fileUrl && (
                            <button
                              onClick={() => {
                                companyApi.downloadDataExport(exp.id).then((response) => {
                                  const url = window.URL.createObjectURL(new Blob([response.data]));
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.setAttribute('download', `export-${exp.id}.${exp.format.toLowerCase()}`);
                                  document.body.appendChild(link);
                                  link.click();
                                });
                              }}
                              className="btn btn-secondary text-sm"
                            >
                              Download
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="card border-red-200 bg-red-50">
                  <h3 className="font-semibold text-red-800 mb-4">Elimina Account</h3>
                  <p className="text-sm text-red-700 mb-4">
                    Eliminando il tuo account, tutti i dati saranno eliminati definitivamente dopo 30 giorni.
                    Questa azione non può essere annullata.
                  </p>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          'Sei sicuro di voler eliminare il tuo account? Questa azione non può essere annullata.'
                        )
                      ) {
                        deleteMutation.mutate();
                      }
                    }}
                    className="btn btn-danger"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? 'Eliminazione...' : 'Elimina Account'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

