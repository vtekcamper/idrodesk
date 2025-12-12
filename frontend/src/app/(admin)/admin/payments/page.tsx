'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    companyId: '',
    status: '',
    paymentProvider: '',
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    companyId: '',
    amount: '',
    currency: 'EUR',
    paymentMethod: 'CREDIT_CARD',
    paymentProvider: 'STRIPE',
  });

  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin', 'payments', filters],
    queryFn: async () => {
      const response = await adminApi.getAllPayments(filters);
      return response.data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: async () => {
      const response = await adminApi.getAllCompanies();
      return response.data;
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: any) => adminApi.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      setShowPaymentModal(false);
      alert('Pagamento creato con successo!');
    },
  });

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    createPaymentMutation.mutate({
      ...paymentData,
      amount: parseFloat(paymentData.amount),
    });
  };

  const totalRevenue = payments?.reduce((sum: number, p: any) => {
    return sum + (p.status === 'COMPLETED' ? Number(p.amount) : 0);
  }, 0) || 0;

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestione Pagamenti</h1>
              <p className="text-sm text-gray-600">Monitora e gestisci tutti i pagamenti</p>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="btn btn-primary"
            >
              + Nuovo Pagamento
            </button>
          </div>
        </header>

        <main className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <h3 className="text-sm font-medium text-green-700 mb-2">Revenue Totale</h3>
              <p className="text-3xl font-bold text-green-900">
                €{totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Totale Pagamenti</h3>
              <p className="text-3xl font-bold">{payments?.length || 0}</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Completati</h3>
              <p className="text-3xl font-bold text-green-600">
                {payments?.filter((p: any) => p.status === 'COMPLETED').length || 0}
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-2">In Attesa</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {payments?.filter((p: any) => p.status === 'PENDING').length || 0}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                className="input"
                value={filters.companyId}
                onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
              >
                <option value="">Tutte le aziende</option>
                {companies?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.ragioneSociale}</option>
                ))}
              </select>
              <select
                className="input"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Tutti gli stati</option>
                <option value="PENDING">In Attesa</option>
                <option value="PROCESSING">In Elaborazione</option>
                <option value="COMPLETED">Completato</option>
                <option value="FAILED">Fallito</option>
                <option value="REFUNDED">Rimborsato</option>
              </select>
              <select
                className="input"
                value={filters.paymentProvider}
                onChange={(e) => setFilters({ ...filters, paymentProvider: e.target.value })}
              >
                <option value="">Tutti i provider</option>
                <option value="STRIPE">Stripe</option>
                <option value="PAYPAL">PayPal</option>
                <option value="MANUAL">Manuale</option>
              </select>
            </div>
          </div>

          {/* Payments Table */}
          {isLoading ? (
            <div className="card">
              <p className="text-gray-500 text-center py-8">Caricamento...</p>
            </div>
          ) : payments && payments.length > 0 ? (
            <div className="card overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 text-left">ID</th>
                    <th className="border p-3 text-left">Azienda</th>
                    <th className="border p-3 text-right">Importo</th>
                    <th className="border p-3 text-left">Metodo</th>
                    <th className="border p-3 text-left">Provider</th>
                    <th className="border p-3 text-left">Stato</th>
                    <th className="border p-3 text-left">Data</th>
                    <th className="border p-3 text-left">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="border p-3 text-sm font-mono">{payment.id.substring(0, 8)}...</td>
                      <td className="border p-3">
                        {payment.company ? (
                          <Link
                            href={`/admin/companies/${payment.company.id}`}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            {payment.company.ragioneSociale}
                          </Link>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="border p-3 text-right font-medium">
                        €{Number(payment.amount).toFixed(2)}
                      </td>
                      <td className="border p-3">
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                          {payment.paymentMethod}
                        </span>
                      </td>
                      <td className="border p-3">
                        <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                          {payment.paymentProvider}
                        </span>
                      </td>
                      <td className="border p-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          payment.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="border p-3 text-sm text-gray-600">
                        {new Date(payment.createdAt).toLocaleDateString('it-IT')}
                      </td>
                      <td className="border p-3">
                        <Link
                          href={`/admin/payments/${payment.id}`}
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
              <p className="text-gray-500">Nessun pagamento trovato</p>
            </div>
          )}

          {/* Modal Nuovo Pagamento */}
          {showPaymentModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Nuovo Pagamento</h3>
                <form onSubmit={handleCreatePayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Azienda
                    </label>
                    <select
                      className="input"
                      value={paymentData.companyId}
                      onChange={(e) => setPaymentData({ ...paymentData, companyId: e.target.value })}
                      required
                    >
                      <option value="">Seleziona azienda</option>
                      {companies?.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.ragioneSociale}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Importo
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valuta
                    </label>
                    <select
                      className="input"
                      value={paymentData.currency}
                      onChange={(e) => setPaymentData({ ...paymentData, currency: e.target.value })}
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metodo Pagamento
                    </label>
                    <select
                      className="input"
                      value={paymentData.paymentMethod}
                      onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                    >
                      <option value="CREDIT_CARD">Carta di Credito</option>
                      <option value="PAYPAL">PayPal</option>
                      <option value="BANK_TRANSFER">Bonifico</option>
                      <option value="MANUAL">Manuale</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provider
                    </label>
                    <select
                      className="input"
                      value={paymentData.paymentProvider}
                      onChange={(e) => setPaymentData({ ...paymentData, paymentProvider: e.target.value })}
                    >
                      <option value="STRIPE">Stripe</option>
                      <option value="PAYPAL">PayPal</option>
                      <option value="MANUAL">Manuale</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary flex-1" disabled={createPaymentMutation.isPending}>
                      {createPaymentMutation.isPending ? 'Creazione...' : 'Crea Pagamento'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
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

