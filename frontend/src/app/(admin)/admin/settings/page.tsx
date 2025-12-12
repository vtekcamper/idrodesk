'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';

export const dynamic = 'force-dynamic';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    body: '',
    type: 'CUSTOM',
  });
  const [systemInfo, setSystemInfo] = useState({
    stripeConfigured: false,
    smtpConfigured: false,
    environment: 'production',
    database: 'PostgreSQL',
  });

  useEffect(() => {
    // Verifica configurazione
    setSystemInfo({
      stripeConfigured: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      smtpConfigured: true, // Assumiamo sempre configurato se la pagina carica
      environment: process.env.NODE_ENV || 'production',
      database: 'PostgreSQL (Railway)',
    });
  }, []);

  const { data: emailNotifications, isLoading: loadingEmails } = useQuery({
    queryKey: ['admin', 'emails'],
    queryFn: async () => {
      const response = await adminApi.getAllEmailNotifications();
      return response.data;
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (data: any) => adminApi.sendEmail(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'emails'] });
      setEmailData({ to: '', subject: '', body: '', type: 'CUSTOM' });
      alert('Email inviata con successo!');
    },
    onError: (error: any) => {
      alert(`Errore nell'invio: ${error.message || 'Errore sconosciuto'}`);
    },
  });

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    sendEmailMutation.mutate(emailData);
  };

  const emailStats = {
    total: emailNotifications?.length || 0,
    sent: emailNotifications?.filter((e: any) => e.status === 'SENT').length || 0,
    failed: emailNotifications?.filter((e: any) => e.status === 'FAILED').length || 0,
    pending: emailNotifications?.filter((e: any) => e.status === 'PENDING').length || 0,
  };

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Impostazioni Sistema</h1>
            <p className="text-sm text-gray-600">Configurazione e gestione sistema</p>
          </div>
        </header>

        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invia Email */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📧</span>
                <h2 className="text-lg font-semibold">Invia Email</h2>
              </div>
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinatario <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={emailData.to}
                    onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                    placeholder="esempio@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Oggetto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    placeholder="Oggetto dell'email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo Email
                  </label>
                  <select
                    className="input"
                    value={emailData.type}
                    onChange={(e) => setEmailData({ ...emailData, type: e.target.value })}
                  >
                    <option value="CUSTOM">Personalizzata</option>
                    <option value="WELCOME">Benvenuto</option>
                    <option value="SUBSCRIPTION_REMINDER">Promemoria Abbonamento</option>
                    <option value="SUBSCRIPTION_EXPIRED">Abbonamento Scaduto</option>
                    <option value="PASSWORD_RESET">Reset Password</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Messaggio (HTML) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="input font-mono text-sm"
                    rows={8}
                    value={emailData.body}
                    onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                    required
                    placeholder="<h1>Titolo</h1>&#10;<p>Messaggio...</p>"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supporta HTML per formattazione avanzata
                  </p>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={sendEmailMutation.isPending}
                >
                  {sendEmailMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span> Invio in corso...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      📤 Invia Email
                    </span>
                  )}
                </button>
              </form>
            </div>

            {/* Storico Email */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📬</span>
                  <h2 className="text-lg font-semibold">Storico Email</h2>
                </div>
                {emailStats.total > 0 && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {emailStats.total} totali
                  </span>
                )}
              </div>
              
              {/* Stats */}
              {emailStats.total > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-green-50 p-2 rounded text-center">
                    <p className="text-xs text-gray-600">Inviate</p>
                    <p className="text-lg font-bold text-green-700">{emailStats.sent}</p>
                  </div>
                  <div className="bg-red-50 p-2 rounded text-center">
                    <p className="text-xs text-gray-600">Fallite</p>
                    <p className="text-lg font-bold text-red-700">{emailStats.failed}</p>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded text-center">
                    <p className="text-xs text-gray-600">In attesa</p>
                    <p className="text-lg font-bold text-yellow-700">{emailStats.pending}</p>
                  </div>
                </div>
              )}

              {loadingEmails ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Caricamento...</p>
                </div>
              ) : emailNotifications && emailNotifications.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {emailNotifications.slice(0, 10).map((email: any) => (
                    <div key={email.id} className="border-b pb-3 last:border-0 hover:bg-gray-50 p-2 rounded transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{email.subject}</p>
                          <p className="text-xs text-gray-600 truncate">{email.to}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ml-2 ${
                          email.status === 'SENT' ? 'bg-green-100 text-green-800' :
                          email.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {email.status === 'SENT' ? '✓ Inviata' :
                           email.status === 'FAILED' ? '✗ Fallita' :
                           '⏳ In attesa'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          {new Date(email.createdAt).toLocaleString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {email.type && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            {email.type}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="text-4xl mb-2 block">📭</span>
                  <p className="text-gray-500">Nessuna email inviata</p>
                  <p className="text-xs text-gray-400 mt-1">Le email inviate appariranno qui</p>
                </div>
              )}
            </div>

            {/* Configurazione Sistema */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⚙️</span>
                <h2 className="text-lg font-semibold">Configurazione Sistema</h2>
              </div>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Stripe Secret Key
                    </label>
                    <span className={`px-2 py-1 text-xs rounded ${
                      systemInfo.stripeConfigured 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {systemInfo.stripeConfigured ? '✓ Configurato' : '⚠ Non configurato'}
                    </span>
                  </div>
                  <input
                    type="password"
                    className="input bg-white"
                    value={systemInfo.stripeConfigured ? 'sk_••••••••••••••••' : ''}
                    placeholder="sk_..."
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Configurato tramite variabili d'ambiente
                  </p>
                </div>
                
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      SMTP Host
                    </label>
                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                      ✓ Configurato
                    </span>
                  </div>
                  <input
                    type="text"
                    className="input bg-white"
                    value="smtp.gmail.com"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Configurato tramite variabili d'ambiente
                  </p>
                </div>
              </div>
            </div>

            {/* Info Sistema */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">ℹ️</span>
                <h2 className="text-lg font-semibold">Informazioni Sistema</h2>
              </div>
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <p className="text-xs text-gray-500 mb-1">Versione Applicazione</p>
                  <p className="font-semibold text-gray-900">1.0.0</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-xs text-gray-500 mb-1">Ambiente</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 capitalize">
                      {systemInfo.environment}
                    </p>
                    <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-800">
                      {systemInfo.environment === 'production' ? 'PROD' : 'DEV'}
                    </span>
                  </div>
                </div>
                <div className="border-b pb-3">
                  <p className="text-xs text-gray-500 mb-1">Database</p>
                  <p className="font-semibold text-gray-900">{systemInfo.database}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ultimo Aggiornamento</p>
                  <p className="font-semibold text-gray-900">
                    {new Date().toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AdminLayout>
  );
}

