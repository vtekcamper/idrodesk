'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { auth } from '@/lib/auth';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { StatusBadge } from '@/components/ui-kit/status-badge';
import { Badge } from '@/components/ui-kit/badge';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { Table } from '@/components/ui-kit/table';
import { AlertCircle, Loader2, Plus, Edit, X, Mail, UserX } from 'lucide-react';

const useToast = () => ({
  toast: ({ title, description, variant }: any) => {
    if (variant === 'destructive') {
      alert(`Errore: ${title}\n${description}`);
    } else {
      alert(`${title}\n${description}`);
    }
  },
});

export default function UsersSettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const user = auth.getUser();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [error, setError] = useState('');

  // Solo owner può vedere questa pagina
  if (user?.ruolo !== 'OWNER') {
    return (
      <div className="space-y-6 max-w-4xl">
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4 flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Accesso negato. Solo il proprietario può gestire gli utenti.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await usersApi.getAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      toast({
        title: 'Utente creato',
        description: 'L\'utente è stato creato con successo.',
      });
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Errore nella creazione utente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setEditingUser(null);
      toast({
        title: 'Utente aggiornato',
        description: 'L\'utente è stato aggiornato con successo.',
      });
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Errore nell\'aggiornamento utente');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => usersApi.resetPassword(id),
    onSuccess: () => {
      toast({
        title: 'Email inviata',
        description: 'Email di reset password inviata (funzionalità in arrivo)',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore nell\'invio email',
        variant: 'destructive',
      });
    },
  });

  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    ruolo: 'BACKOFFICE',
    password: '',
  });

  const handleOpenModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nome: user.nome || '',
        cognome: user.cognome || '',
        email: user.email || '',
        telefono: user.telefono || '',
        ruolo: user.ruolo || 'BACKOFFICE',
        password: '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        nome: '',
        cognome: '',
        email: '',
        telefono: '',
        ruolo: 'BACKOFFICE',
        password: '',
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nome.trim()) {
      setError('Inserisci il nome');
      return;
    }
    if (!formData.email.trim()) {
      setError('Inserisci l\'email');
      return;
    }
    if (!editingUser && !formData.password) {
      setError('Inserisci una password per il nuovo utente');
      return;
    }

    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        data: {
          ...formData,
          ...(formData.password ? { password: formData.password } : {}),
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Utenti & Ruoli"
        description="Gestisci gli utenti della tua azienda e i loro ruoli"
        action={{
          label: 'Nuovo Utente',
          onClick: () => handleOpenModal(),
          variant: 'default',
        }}
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : users && users.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium">Nome</th>
                    <th className="p-4 text-left text-sm font-medium">Email</th>
                    <th className="p-4 text-left text-sm font-medium">Ruolo</th>
                    <th className="p-4 text-left text-sm font-medium">Stato</th>
                    <th className="p-4 text-left text-sm font-medium">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} className="border-t hover:bg-muted/50">
                      <td className="p-4">
                        {u.nome} {u.cognome}
                      </td>
                      <td className="p-4">{u.email}</td>
                      <td className="p-4">
                        <StatusBadge status={u.ruolo} type="role" />
                      </td>
                      <td className="p-4">
                        <Badge variant={u.attivo ? 'success' : 'secondary'}>
                          {u.attivo ? 'Attivo' : 'Disattivo'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(u)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifica
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resetPasswordMutation.mutate(u.id)}
                            disabled={resetPasswordMutation.isPending}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          {u.id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Vuoi disattivare questo utente?')) {
                                  updateMutation.mutate({
                                    id: u.id,
                                    data: { attivo: !u.attivo },
                                  });
                                }
                              }}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={<UserX className="h-12 w-12" />}
              title="Nessun utente trovato"
              description="Aggiungi il primo utente alla tua azienda"
              action={{
                label: 'Nuovo Utente',
                onClick: () => handleOpenModal(),
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingUser ? 'Modifica Utente' : 'Nuovo Utente'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nome <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Cognome</label>
                    <Input
                      value={formData.cognome}
                      onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!!editingUser}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Telefono</label>
                  <Input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ruolo</label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    value={formData.ruolo}
                    onChange={(e) => setFormData({ ...formData, ruolo: e.target.value })}
                  >
                    <option value="BACKOFFICE">Backoffice</option>
                    <option value="TECNICO">Tecnico</option>
                    <option value="OWNER">Proprietario</option>
                  </select>
                </div>
                {(!editingUser || formData.password) && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {editingUser ? 'Nuova Password (lascia vuoto per non cambiare)' : 'Password'} <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                      minLength={8}
                    />
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvataggio...
                      </>
                    ) : (
                      'Salva'
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Annulla
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

