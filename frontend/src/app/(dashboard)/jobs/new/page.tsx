'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi, clientsApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';

export default function NewJobPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '',
    titolo: '',
    descrizione: '',
    dataProgrammata: '',
    oraProgrammata: '',
    priorita: 'NORMALE',
  });

  // Carica clienti
  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await clientsApi.getAll();
      return response.data;
    },
  });

  // Crea nuovo cliente (quick create)
  const createClientMutation = useMutation({
    mutationFn: (data: any) => clientsApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setFormData({ ...formData, clientId: response.data.id });
      setShowNewClientForm(false);
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Errore nella creazione cliente');
    },
  });

  // Crea intervento
  const createJobMutation = useMutation({
    mutationFn: (data: any) => jobsApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'dashboard'] });
      router.push(`/jobs/${response.data.id}`);
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Errore nella creazione intervento');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.clientId) {
      setError('Seleziona un cliente');
      return;
    }

    if (!formData.titolo) {
      setError('Inserisci un titolo');
      return;
    }

    createJobMutation.mutate({
      clientId: formData.clientId,
      titolo: formData.titolo,
      descrizione: formData.descrizione || null,
      dataProgrammata: formData.dataProgrammata || null,
      oraProgrammata: formData.oraProgrammata || null,
      priorita: formData.priorita,
      stato: formData.dataProgrammata ? 'PIANIFICATO' : 'BOZZA',
    });
  };

  const handleQuickCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    createClientMutation.mutate({
      nome: formData.get('nome'),
      cognome: formData.get('cognome'),
      telefono: formData.get('telefono') || null,
      email: formData.get('email') || null,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <PageHeader
          title="Nuovo Intervento"
          description="Crea un nuovo intervento in pochi secondi"
          breadcrumb={[
            { label: 'Interventi', href: '/jobs' },
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

        <Card>
          <CardHeader>
            <CardTitle>Dettagli Intervento</CardTitle>
            <CardDescription>Compila i campi essenziali per creare l'intervento</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cliente <span className="text-destructive">*</span>
                </label>
                {showNewClientForm ? (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <form onSubmit={handleQuickCreateClient} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            name="nome"
                            placeholder="Nome"
                            required
                            disabled={createClientMutation.isPending}
                          />
                          <Input
                            name="cognome"
                            placeholder="Cognome"
                            required
                            disabled={createClientMutation.isPending}
                          />
                        </div>
                        <Input
                          name="telefono"
                          type="tel"
                          placeholder="Telefono (opzionale)"
                          disabled={createClientMutation.isPending}
                        />
                        <Input
                          name="email"
                          type="email"
                          placeholder="Email (opzionale)"
                          disabled={createClientMutation.isPending}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={createClientMutation.isPending}
                            size="sm"
                          >
                            {createClientMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creazione...
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Crea Cliente
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowNewClientForm(false)}
                          >
                            Annulla
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewClientForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crea cliente al volo
                    </Button>
                  </div>
                )}
              </div>

              {/* Titolo */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Titolo/Problema <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.titolo}
                  onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                  placeholder="es. Riparazione perdita rubinetto"
                  required
                />
              </div>

              {/* Descrizione */}
              <div>
                <label className="block text-sm font-medium mb-2">Note</label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.descrizione}
                  onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                  placeholder="Note aggiuntive sul problema o intervento..."
                />
              </div>

              {/* Data e Ora */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Data programmata</label>
                  <Input
                    type="date"
                    value={formData.dataProgrammata}
                    onChange={(e) => setFormData({ ...formData, dataProgrammata: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ora (HH:mm)</label>
                  <Input
                    type="time"
                    value={formData.oraProgrammata}
                    onChange={(e) => setFormData({ ...formData, oraProgrammata: e.target.value })}
                  />
                </div>
              </div>

              {/* Priorità */}
              <div>
                <label className="block text-sm font-medium mb-2">Priorità</label>
                <select
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.priorita}
                  onChange={(e) => setFormData({ ...formData, priorita: e.target.value })}
                >
                  <option value="NORMALE">Normale</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createJobMutation.isPending} className="flex-1">
                  {createJobMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creazione...
                    </>
                  ) : (
                    'Crea Intervento'
                  )}
                </Button>
                <Link href="/jobs">
                  <Button type="button" variant="outline">
                    Annulla
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

