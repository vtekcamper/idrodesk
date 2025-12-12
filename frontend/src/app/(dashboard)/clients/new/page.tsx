'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewClientPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    indirizzo: '',
    citta: '',
    cap: '',
    telefono: '',
    email: '',
    note: '',
  });

  const createClientMutation = useMutation({
    mutationFn: (data: any) => clientsApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      router.push(`/clients/${response.data.id}`);
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Errore nella creazione cliente');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nome.trim()) {
      setError('Inserisci almeno il nome del cliente');
      return;
    }

    createClientMutation.mutate({
      nome: formData.nome,
      cognome: formData.cognome || null,
      indirizzo: formData.indirizzo || null,
      citta: formData.citta || null,
      cap: formData.cap || null,
      telefono: formData.telefono || null,
      email: formData.email || null,
      note: formData.note || null,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <PageHeader
          title="Nuovo Cliente"
          description="Aggiungi un nuovo cliente al database"
          breadcrumb={[
            { label: 'Clienti', href: '/clients' },
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
            <CardTitle>Informazioni Cliente</CardTitle>
            <CardDescription>Compila i campi per creare un nuovo cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nome <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Mario"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cognome</label>
                  <Input
                    value={formData.cognome}
                    onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                    placeholder="Rossi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Telefono</label>
                <Input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+39 123 456 7890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="mario.rossi@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Indirizzo</label>
                <Input
                  value={formData.indirizzo}
                  onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                  placeholder="Via Roma 123"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Città</label>
                  <Input
                    value={formData.citta}
                    onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                    placeholder="Milano"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CAP</label>
                  <Input
                    value={formData.cap}
                    onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                    placeholder="20100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Note</label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Note aggiuntive sul cliente..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createClientMutation.isPending} className="flex-1">
                  {createClientMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creazione...
                    </>
                  ) : (
                    'Crea Cliente'
                  )}
                </Button>
                <Link href="/clients">
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

