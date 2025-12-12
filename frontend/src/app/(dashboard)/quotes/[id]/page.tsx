'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotesApi, jobsApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { StatusBadge } from '@/components/ui-kit/status-badge';
import { Badge } from '@/components/ui-kit/badge';
import { Input } from '@/components/ui-kit/input';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  Wrench,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const quoteId = params.id as string;
  const [error, setError] = useState('');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertData, setConvertData] = useState({
    titolo: '',
    dataProgrammata: '',
    oraProgrammata: '',
  });

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: async () => {
      const response = await quotesApi.getById(quoteId);
      return response.data;
    },
  });

  const updateQuoteMutation = useMutation({
    mutationFn: (data: any) => quotesApi.update(quoteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Errore nell\'aggiornamento preventivo');
    },
  });

  const convertToJobMutation = useMutation({
    mutationFn: (data: any) => quotesApi.convertToJob(quoteId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'dashboard'] });
      setShowConvertModal(false);
      router.push(`/jobs/${response.data.id}`);
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Errore nella conversione in intervento');
    },
  });

  const handleMarkAsSent = () => {
    updateQuoteMutation.mutate({ stato: 'INVIATO' });
  };

  const handleMarkAsAccepted = () => {
    updateQuoteMutation.mutate({ stato: 'ACCETTATO' });
  };

  const handleMarkAsRejected = () => {
    updateQuoteMutation.mutate({ stato: 'RIFIUTATO' });
  };

  const handleConvertToJob = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!convertData.titolo.trim()) {
      setError('Inserisci un titolo per l\'intervento');
      return;
    }

    convertToJobMutation.mutate({
      titolo: convertData.titolo,
      dataProgrammata: convertData.dataProgrammata || null,
      oraProgrammata: convertData.oraProgrammata || null,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!quote) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={<AlertCircle className="h-12 w-12" />}
          title="Preventivo non trovato"
          description="Il preventivo richiesto non esiste o non hai i permessi per visualizzarlo"
          action={{
            label: 'Torna ai preventivi',
            onClick: () => router.push('/quotes'),
          }}
        />
      </DashboardLayout>
    );
  }

  const canMarkAsSent = quote.stato === 'BOZZA';
  const canMarkAsAccepted = quote.stato === 'INVIATO';
  const canConvertToJob = quote.stato === 'ACCETTATO' && !quote.job;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={`Preventivo ${quote.numeroPreventivo}`}
          description={`Cliente: ${quote.client.nome} ${quote.client.cognome}`}
          breadcrumb={[
            { label: 'Preventivi', href: '/quotes' },
            { label: quote.numeroPreventivo },
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

        {/* Azioni Rapide */}
        {(canMarkAsSent || canMarkAsAccepted || canConvertToJob) && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Azioni Rapide</h3>
                  <p className="text-sm text-muted-foreground">
                    {canMarkAsSent
                      ? 'Segna il preventivo come inviato al cliente'
                      : canMarkAsAccepted
                      ? 'Segna il preventivo come accettato dal cliente'
                      : 'Converti il preventivo accettato in un intervento'}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {canMarkAsSent && (
                    <Button
                      onClick={handleMarkAsSent}
                      disabled={updateQuoteMutation.isPending}
                      variant="outline"
                    >
                      {updateQuoteMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Aggiornamento...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Segna come Inviato
                        </>
                      )}
                    </Button>
                  )}
                  {canMarkAsAccepted && (
                    <Button
                      onClick={handleMarkAsAccepted}
                      disabled={updateQuoteMutation.isPending}
                      variant="success"
                    >
                      {updateQuoteMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Aggiornamento...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Segna come Accettato
                        </>
                      )}
                    </Button>
                  )}
                  {canConvertToJob && (
                    <Button
                      onClick={() => {
                        setConvertData({
                          titolo: `Lavoro da preventivo ${quote.numeroPreventivo}`,
                          dataProgrammata: '',
                          oraProgrammata: '',
                        });
                        setShowConvertModal(true);
                      }}
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Crea Intervento
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Già convertito */}
        {quote.job && (
          <Card className="border-success/50 bg-success/10">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div>
                  <p className="font-semibold">Preventivo già convertito in intervento</p>
                  <p className="text-sm text-muted-foreground">
                    L'intervento è stato creato da questo preventivo
                  </p>
                </div>
              </div>
              <Link href={`/jobs/${quote.job.id}`}>
                <Button variant="outline" size="sm">
                  Vedi Intervento
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonna Principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info Cliente */}
            <Card>
              <CardHeader>
                <CardTitle>Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Nome</p>
                    <p className="font-medium">
                      {quote.client.nome} {quote.client.cognome}
                    </p>
                  </div>
                  {quote.client.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${quote.client.telefono}`}
                        className="text-primary hover:underline"
                      >
                        {quote.client.telefono}
                      </a>
                    </div>
                  )}
                  {quote.site && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{quote.site.descrizione}</p>
                        {quote.site.indirizzo && (
                          <p className="text-sm text-muted-foreground">{quote.site.indirizzo}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dettagli Preventivo */}
            <Card>
              <CardHeader>
                <CardTitle>Dettagli Preventivo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Numero</p>
                    <p className="font-medium">{quote.numeroPreventivo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Data</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {new Date(quote.data).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                </div>
                {quote.noteCliente && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Note Cliente</p>
                    <p className="text-sm whitespace-pre-wrap">{quote.noteCliente}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Righe Preventivo */}
            {quote.items && quote.items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Righe Preventivo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {quote.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-xl"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.descrizione}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantita} {item.unita} × €{Number(item.prezzoUnitario).toFixed(2)}
                            {Number(item.scontoPercentuale) > 0 && (
                              <> • Sconto {Number(item.scontoPercentuale).toFixed(0)}%</>
                            )}
                          </p>
                        </div>
                        <p className="font-semibold">€{Number(item.totaleRiga).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Totale</span>
                      <span className="text-2xl font-bold">
                        €{Number(quote.totaleLordo).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stato */}
            <Card>
              <CardHeader>
                <CardTitle>Stato</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusBadge status={quote.stato} type="quote" />
              </CardContent>
            </Card>

            {/* Azioni */}
            <Card>
              <CardHeader>
                <CardTitle>Azioni</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {canMarkAsSent && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleMarkAsSent}
                    disabled={updateQuoteMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Segna come Inviato
                  </Button>
                )}
                {canMarkAsAccepted && (
                  <Button
                    variant="success"
                    className="w-full"
                    onClick={handleMarkAsAccepted}
                    disabled={updateQuoteMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Segna come Accettato
                  </Button>
                )}
                {quote.stato === 'INVIATO' && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleMarkAsRejected}
                    disabled={updateQuoteMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Segna come Rifiutato
                  </Button>
                )}
                <Link href={`/clients/${quote.client.id}`}>
                  <Button variant="outline" className="w-full">
                    Vedi Cliente
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal Converti in Intervento */}
        {showConvertModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Crea Intervento da Preventivo</CardTitle>
                <CardDescription>
                  L'intervento erediterà cliente, note e materiali dal preventivo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleConvertToJob} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Titolo Intervento <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={convertData.titolo}
                      onChange={(e) => setConvertData({ ...convertData, titolo: e.target.value })}
                      placeholder="es. Riparazione perdita rubinetto"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Data programmata</label>
                      <Input
                        type="date"
                        value={convertData.dataProgrammata}
                        onChange={(e) =>
                          setConvertData({ ...convertData, dataProgrammata: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Ora (HH:mm)</label>
                      <Input
                        type="time"
                        value={convertData.oraProgrammata}
                        onChange={(e) =>
                          setConvertData({ ...convertData, oraProgrammata: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={convertToJobMutation.isPending} className="flex-1">
                      {convertToJobMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creazione...
                        </>
                      ) : (
                        <>
                          <Wrench className="h-4 w-4 mr-2" />
                          Crea Intervento
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowConvertModal(false)}
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
    </DashboardLayout>
  );
}

