'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Badge } from '@/components/ui-kit/badge';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import {
  Mail,
  Send,
  Inbox,
  Settings,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    body: '',
    type: 'CUSTOM',
  });

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
      <div className="p-6 space-y-6">
        <PageHeader
          title="Impostazioni Sistema"
          description="Configurazione e gestione sistema"
          breadcrumb={[{ label: 'Admin' }, { label: 'Impostazioni' }]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invia Email */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <CardTitle>Invia Email</CardTitle>
              </div>
              <CardDescription>Invia email personalizzate agli utenti</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Destinatario <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    value={emailData.to}
                    onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                    placeholder="esempio@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Oggetto <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    placeholder="Oggetto dell'email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo Email</label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                  <label className="block text-sm font-medium mb-2">
                    Messaggio (HTML) <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    className="flex min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
                    rows={8}
                    value={emailData.body}
                    onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                    required
                    placeholder="<h1>Titolo</h1>&#10;<p>Messaggio...</p>"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supporta HTML per formattazione avanzata
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={sendEmailMutation.isPending}
                >
                  {sendEmailMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Invia Email
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Storico Email */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Inbox className="h-5 w-5" />
                  <CardTitle>Storico Email</CardTitle>
                </div>
                {emailStats.total > 0 && (
                  <Badge variant="secondary">{emailStats.total} totali</Badge>
                )}
              </div>
              <CardDescription>Ultime email inviate dal sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Stats */}
              {emailStats.total > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-success/10 p-3 rounded-xl text-center">
                    <p className="text-xs text-muted-foreground mb-1">Inviate</p>
                    <p className="text-lg font-bold text-success">{emailStats.sent}</p>
                  </div>
                  <div className="bg-destructive/10 p-3 rounded-xl text-center">
                    <p className="text-xs text-muted-foreground mb-1">Fallite</p>
                    <p className="text-lg font-bold text-destructive">{emailStats.failed}</p>
                  </div>
                  <div className="bg-warning/10 p-3 rounded-xl text-center">
                    <p className="text-xs text-muted-foreground mb-1">In attesa</p>
                    <p className="text-lg font-bold text-warning">{emailStats.pending}</p>
                  </div>
                </div>
              )}

              {loadingEmails ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : emailNotifications && emailNotifications.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {emailNotifications.slice(0, 10).map((email: any) => (
                    <div
                      key={email.id}
                      className="border rounded-xl p-3 hover:bg-accent transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{email.subject}</p>
                          <p className="text-xs text-muted-foreground truncate">{email.to}</p>
                        </div>
                        <Badge
                          variant={
                            email.status === 'SENT'
                              ? 'success'
                              : email.status === 'FAILED'
                              ? 'danger'
                              : 'warning'
                          }
                          className="ml-2 whitespace-nowrap"
                        >
                          {email.status === 'SENT' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Inviata
                            </>
                          ) : email.status === 'FAILED' ? (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Fallita
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              In attesa
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {new Date(email.createdAt).toLocaleString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {email.type && (
                          <Badge variant="outline" className="text-xs">
                            {email.type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Inbox className="h-12 w-12" />}
                  title="Nessuna email inviata"
                  description="Le email inviate appariranno qui"
                />
              )}
            </CardContent>
          </Card>

          {/* Configurazione Sistema */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle>Configurazione Sistema</CardTitle>
              </div>
              <CardDescription>Stato configurazione servizi esterni</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-xl p-4 bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Stripe Secret Key</label>
                    <Badge variant="secondary">Configurato</Badge>
                  </div>
                  <Input
                    type="password"
                    value="sk_••••••••••••••••"
                    placeholder="sk_..."
                    disabled
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Configurato tramite variabili d'ambiente
                  </p>
                </div>

                <div className="border rounded-xl p-4 bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">SMTP Host</label>
                    <Badge variant="success">Configurato</Badge>
                  </div>
                  <Input
                    type="text"
                    value="smtp.gmail.com"
                    disabled
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Configurato tramite variabili d'ambiente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Sistema */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                <CardTitle>Informazioni Sistema</CardTitle>
              </div>
              <CardDescription>Dettagli versione e ambiente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <p className="text-xs text-muted-foreground mb-1">Versione Applicazione</p>
                  <p className="font-semibold">1.0.0</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-xs text-muted-foreground mb-1">Ambiente</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold capitalize">Production</p>
                    <Badge variant="default">PROD</Badge>
                  </div>
                </div>
                <div className="border-b pb-3">
                  <p className="text-xs text-muted-foreground mb-1">Database</p>
                  <p className="font-semibold">PostgreSQL (Railway)</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ultimo Aggiornamento</p>
                  <p className="font-semibold">
                    {new Date().toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
