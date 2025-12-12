'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotesApi, clientsApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { AlertCircle, Loader2, Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';

interface QuoteItem {
  descrizione: string;
  tipo: 'MANODOPERA' | 'MATERIALE' | 'FORFAIT';
  quantita: number;
  unita: string;
  prezzoUnitario: number;
  scontoPercentuale: number;
  ivaPercentuale: number;
}

export default function NewQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const preselectedClientId = searchParams?.get('clientId') || '';

  const [formData, setFormData] = useState({
    clientId: preselectedClientId,
    numeroPreventivo: '',
    data: new Date().toISOString().split('T')[0],
    noteCliente: '',
  });

  const [items, setItems] = useState<QuoteItem[]>([
    {
      descrizione: '',
      tipo: 'MATERIALE',
      quantita: 1,
      unita: 'pz',
      prezzoUnitario: 0,
      scontoPercentuale: 0,
      ivaPercentuale: 22,
    },
  ]);

  // Carica clienti
  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await clientsApi.getAll();
      return response.data;
    },
  });

  // Genera numero preventivo automatico
  useEffect(() => {
    if (!formData.numeroPreventivo && clients && clients.length > 0) {
      const year = new Date().getFullYear();
      const count = (clients as any[]).length;
      setFormData((prev) => ({
        ...prev,
        numeroPreventivo: `PREV-${year}-${String(count + 1).padStart(4, '0')}`,
      }));
    }
  }, [clients, formData.numeroPreventivo]);

  const createQuoteMutation = useMutation({
    mutationFn: (data: any) => quotesApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      router.push(`/quotes/${response.data.id}`);
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Errore nella creazione preventivo');
    },
  });

  const addItem = () => {
    setItems([
      ...items,
      {
        descrizione: '',
        tipo: 'MATERIALE',
        quantita: 1,
        unita: 'pz',
        prezzoUnitario: 0,
        scontoPercentuale: 0,
        ivaPercentuale: 22,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateItemTotal = (item: QuoteItem): number => {
    const subtotale = item.quantita * item.prezzoUnitario;
    const scontato = subtotale * (1 - item.scontoPercentuale / 100);
    return scontato * (1 + item.ivaPercentuale / 100);
  };

  const calculateTotals = () => {
    const totaleNetto = items.reduce((sum, item) => {
      const subtotale = item.quantita * item.prezzoUnitario;
      return sum + subtotale * (1 - item.scontoPercentuale / 100);
    }, 0);
    const totaleIva = items.reduce((sum, item) => {
      const subtotale = item.quantita * item.prezzoUnitario;
      const scontato = subtotale * (1 - item.scontoPercentuale / 100);
      return sum + scontato * (item.ivaPercentuale / 100);
    }, 0);
    return {
      totaleNetto,
      totaleIva,
      totaleLordo: totaleNetto + totaleIva,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.clientId) {
      setError('Seleziona un cliente');
      return;
    }

    if (!formData.numeroPreventivo) {
      setError('Inserisci un numero preventivo');
      return;
    }

    const validItems = items.filter((item) => item.descrizione.trim() !== '');
    if (validItems.length === 0) {
      setError('Aggiungi almeno una riga al preventivo');
      return;
    }

    createQuoteMutation.mutate({
      clientId: formData.clientId,
      numeroPreventivo: formData.numeroPreventivo,
      data: formData.data,
      noteCliente: formData.noteCliente || null,
      items: validItems,
    });
  };

  const totals = calculateTotals();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <PageHeader
          title="Nuovo Preventivo"
          description="Crea un nuovo preventivo per il cliente"
          breadcrumb={[
            { label: 'Preventivi', href: '/quotes' },
            { label: 'Nuovo' },
          ]}
        />

        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-4 flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {error}
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info Base */}
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Preventivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cliente <span className="text-destructive">*</span>
                </label>
                {loadingClients ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <select
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    required
                  >
                    <option value="">Seleziona cliente...</option>
                    {Array.isArray(clients) &&
                      clients.map((client: any) => (
                        <option key={client.id} value={client.id}>
                          {client.nome} {client.cognome || ''}
                          {client.telefono && ` - ${client.telefono}`}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Numero Preventivo <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formData.numeroPreventivo}
                    onChange={(e) => setFormData({ ...formData, numeroPreventivo: e.target.value })}
                    placeholder="PREV-2024-0001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Data</label>
                  <Input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Note per Cliente</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.noteCliente}
                  onChange={(e) => setFormData({ ...formData, noteCliente: e.target.value })}
                  placeholder="Note da mostrare al cliente..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Righe Preventivo */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Righe Preventivo</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Riga
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="p-4 border rounded-xl space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <Input
                            placeholder="Descrizione"
                            value={item.descrizione}
                            onChange={(e) => updateItem(index, 'descrizione', e.target.value)}
                          />
                        </div>
                        <div>
                          <select
                            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                            value={item.tipo}
                            onChange={(e) => updateItem(index, 'tipo', e.target.value)}
                          >
                            <option value="MATERIALE">Materiale</option>
                            <option value="MANODOPERA">Manodopera</option>
                            <option value="FORFAIT">Forfait</option>
                          </select>
                        </div>
                        <div>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Quantità"
                            value={item.quantita}
                            onChange={(e) => updateItem(index, 'quantita', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Input
                            placeholder="Unità"
                            value={item.unita}
                            onChange={(e) => updateItem(index, 'unita', e.target.value)}
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Prezzo unitario (€)"
                            value={item.prezzoUnitario}
                            onChange={(e) => updateItem(index, 'prezzoUnitario', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Sconto %"
                            value={item.scontoPercentuale}
                            onChange={(e) => updateItem(index, 'scontoPercentuale', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="IVA %"
                            value={item.ivaPercentuale}
                            onChange={(e) => updateItem(index, 'ivaPercentuale', parseFloat(e.target.value) || 22)}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="ml-2"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    {item.descrizione && (
                      <div className="text-right text-sm font-semibold">
                        Totale riga: €{calculateItemTotal(item).toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nessuna riga aggiunta</p>
                  <Button type="button" variant="outline" onClick={addItem} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Prima Riga
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totali */}
          {items.some((item) => item.descrizione.trim() !== '') && (
            <Card>
              <CardHeader>
                <CardTitle>Totali</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Totale Netto:</span>
                    <span className="font-semibold">€{totals.totaleNetto.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA:</span>
                    <span className="font-semibold">€{totals.totaleIva.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Totale:</span>
                    <span>€{totals.totaleLordo.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button type="submit" disabled={createQuoteMutation.isPending} className="flex-1">
              {createQuoteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creazione...
                </>
              ) : (
                'Crea Preventivo'
              )}
            </Button>
            <Link href="/quotes">
              <Button type="button" variant="outline">
                Annulla
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

