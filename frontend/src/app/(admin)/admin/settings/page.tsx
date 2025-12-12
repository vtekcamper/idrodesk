'use client';

import { useState } from 'react';
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

  const { data: emailNotifications } = useQuery({
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
  });

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    sendEmailMutation.mutate(emailData);
  };

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
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
              <h2 className="text-lg font-semibold mb-4">Invia Email</h2>
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinatario
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={emailData.to}
                    onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Oggetto
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
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
                    <option value="SUBSCRIPTION_EXPIRING">Abbonamento in Scadenza</option>
                    <option value="PAYMENT_SUCCESS">Pagamento Riuscito</option>
                    <option value="PAYMENT_FAILED">Pagamento Fallito</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Messaggio (HTML)
                  </label>
                  <textarea
                    className="input"
                    rows={6}
                    value={emailData.body}
                    onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                    required
                    placeholder="<h1>Titolo</h1><p>Messaggio...</p>"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={sendEmailMutation.isPending}
                >
                  {sendEmailMutation.isPending ? 'Invio...' : 'Invia Email'}
                </button>
              </form>
            </div>

            {/* Storico Email */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Storico Email Recenti</h2>
              {emailNotifications && emailNotifications.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {emailNotifications.slice(0, 10).map((email: any) => (
                    <div key={email.id} className="border-b pb-3">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="font-medium text-sm">{email.subject}</p>
                          <p className="text-xs text-gray-600">{email.to}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          email.status === 'SENT' ? 'bg-green-100 text-green-800' :
                          email.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {email.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(email.createdAt).toLocaleString('it-IT')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Nessuna email inviata</p>
              )}
            </div>

            {/* Configurazione Sistema */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Configurazione Sistema</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stripe Secret Key
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="sk_..."
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Configurato tramite variabili d'ambiente
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="smtp.gmail.com"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Configurato tramite variabili d'ambiente
                  </p>
                </div>
              </div>
            </div>

            {/* Info Sistema */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Informazioni Sistema</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Versione</p>
                  <p className="font-medium">1.0.0</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ambiente</p>
                  <p className="font-medium">Production</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Database</p>
                  <p className="font-medium">PostgreSQL (Railway)</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AdminLayout>
  );
}

