'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { StatCard } from '@/components/ui-kit/stat-card';
import { Input } from '@/components/ui-kit/input';
import { Button } from '@/components/ui-kit/button';
import { Badge } from '@/components/ui-kit/badge';
import { StatusBadge } from '@/components/ui-kit/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui-kit/table';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import {
  DollarSign,
  Plus,
  CreditCard,
  CheckCircle2,
  Clock,
  X,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

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
      setPaymentData({
        companyId: '',
        amount: '',
        currency: 'EUR',
        paymentMethod: 'CREDIT_CARD',
        paymentProvider: 'STRIPE',
      });
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

  const completedCount = payments?.filter((p: any) => p.status === 'COMPLETED').length || 0;
  const pendingCount = payments?.filter((p: any) => p.status === 'PENDING').length || 0;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <PageHeader
          title="Gestione Pagamenti"
          description="Monitora e gestisci tutti i pagamenti"
          breadcrumb={[{ label: 'Admin' }, { label: 'Pagamenti' }]}
          action={{
            label: 'Nuovo Pagamento',
            onClick: () => setShowPaymentModal(true),
            variant: 'default',
          }}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Revenue Totale"
            value={`€${totalRevenue.toFixed(2)}`}
            icon={<DollarSign className="h-8 w-8 text-success" />}
          />
          <StatCard
            title="Totale Pagamenti"
            value={payments?.length || 0}
            icon={<CreditCard className="h-8 w-8 text-primary" />}
          />
          <StatCard
            title="Completati"
            value={completedCount}
            icon={<CheckCircle2 className="h-8 w-8 text-success" />}
          />
          <StatCard
            title="In Attesa"
            value={pendingCount}
            icon={<Clock className="h-8 w-8 text-warning" />}
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filters.companyId}
                onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
              >
                <option value="">Tutte le aziende</option>
                {companies?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.ragioneSociale}
                  </option>
                ))}
              </select>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filters.paymentProvider}
                onChange={(e) => setFilters({ ...filters, paymentProvider: e.target.value })}
              >
                <option value="">Tutti i provider</option>
                <option value="STRIPE">Stripe</option>
                <option value="PAYPAL">PayPal</option>
                <option value="MANUAL">Manuale</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : payments && payments.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Azienda</TableHead>
                      <TableHead className="text-right">Importo</TableHead>
                      <TableHead>Metodo</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment: any) => (
                      <TableRow key={payment.id} className="cursor-pointer hover:bg-accent">
                        <TableCell className="font-mono text-sm">
                          {payment.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {payment.company ? (
                            <Link
                              href={`/admin/companies/${payment.company.id}`}
                              className="text-primary hover:underline"
                            >
                              {payment.company.ragioneSociale}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          €{Number(payment.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{payment.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.paymentProvider}</Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={payment.status} type="payment" />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleDateString('it-IT')}
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/payments/${payment.id}`}>
                            <Button variant="ghost" size="sm">
                              Dettagli
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                icon={<CreditCard className="h-12 w-12" />}
                title="Nessun pagamento trovato"
                description="I pagamenti appariranno qui"
              />
            </CardContent>
          </Card>
        )}

        {/* Modal Nuovo Pagamento */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Nuovo Pagamento</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>Crea un nuovo pagamento manuale</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Azienda</label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={paymentData.companyId}
                      onChange={(e) => setPaymentData({ ...paymentData, companyId: e.target.value })}
                      required
                    >
                      <option value="">Seleziona azienda</option>
                      {companies?.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.ragioneSociale}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Importo</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Valuta</label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={paymentData.currency}
                      onChange={(e) => setPaymentData({ ...paymentData, currency: e.target.value })}
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Metodo Pagamento</label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                    <label className="block text-sm font-medium mb-2">Provider</label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={paymentData.paymentProvider}
                      onChange={(e) => setPaymentData({ ...paymentData, paymentProvider: e.target.value })}
                    >
                      <option value="STRIPE">Stripe</option>
                      <option value="PAYPAL">PayPal</option>
                      <option value="MANUAL">Manuale</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1" disabled={createPaymentMutation.isPending}>
                      {createPaymentMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creazione...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Crea Pagamento
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPaymentModal(false)}
                      className="flex-1"
                    >
                      Annulla
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
