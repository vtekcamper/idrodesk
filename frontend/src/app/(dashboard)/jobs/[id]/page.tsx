'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { StatusBadge } from '@/components/ui-kit/status-badge';
import { Badge } from '@/components/ui-kit/badge';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Plus,
  Trash2,
  Download,
  Phone,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const jobId = params.id as string;
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [error, setError] = useState('');

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const response = await jobsApi.getById(jobId);
      return response.data;
    },
  });

  const startJobMutation = useMutation({
    mutationFn: () => jobsApi.start(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'dashboard'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Errore nell\'avvio intervento');
    },
  });

  const completeJobMutation = useMutation({
    mutationFn: () => jobsApi.complete(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'dashboard'] });
      // Proponi creazione rapporto
      if (confirm('Intervento completato! Vuoi creare il rapporto?')) {
        router.push(`/jobs/${jobId}/report`);
      }
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Errore nel completamento intervento');
    },
  });

  const addMaterialMutation = useMutation({
    mutationFn: (data: any) => jobsApi.addMaterial(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      setShowMaterialForm(false);
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Errore nell\'aggiunta materiale');
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: (materialId: string) => jobsApi.deleteMaterial(jobId, materialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
  });

  const handleAddMaterial = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    addMaterialMutation.mutate({
      descrizione: formData.get('descrizione'),
      quantita: parseFloat(formData.get('quantita') as string),
      prezzoUnitario: parseFloat(formData.get('prezzoUnitario') as string),
    });
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await jobsApi.getReportPDF(jobId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapporto-${jobId}.pdf`;
      a.click();
    } catch (error) {
      setError('Errore nel download del PDF');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={<AlertCircle className="h-12 w-12" />}
          title="Intervento non trovato"
          description="L'intervento richiesto non esiste o non hai i permessi per visualizzarlo"
          action={{
            label: 'Torna agli interventi',
            onClick: () => router.push('/jobs'),
          }}
        />
      </DashboardLayout>
    );
  }

  const canStart = job.stato === 'PIANIFICATO' || job.stato === 'BOZZA';
  const canComplete = job.stato === 'IN_CORSO' || job.stato === 'PIANIFICATO';
  const hasReport = job.checklists && job.checklists.length > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={job.titolo}
          description={`Intervento ${job.stato.toLowerCase()}`}
          breadcrumb={[
            { label: 'Interventi', href: '/jobs' },
            { label: job.titolo },
          ]}
          action={
            hasReport
              ? {
                  label: 'Scarica PDF',
                  onClick: handleDownloadPDF,
                  variant: 'outline',
                }
              : undefined
          }
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
        {(canStart || canComplete) && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Azioni Rapide</h3>
                  <p className="text-sm text-muted-foreground">
                    {canStart
                      ? 'Avvia l\'intervento quando inizi a lavorare'
                      : 'Completa l\'intervento quando hai finito'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {canStart && (
                    <Button
                      onClick={() => startJobMutation.mutate()}
                      disabled={startJobMutation.isPending}
                    >
                      {startJobMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Avvio...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Inizia
                        </>
                      )}
                    </Button>
                  )}
                  {canComplete && (
                    <Button
                      onClick={() => completeJobMutation.mutate()}
                      disabled={completeJobMutation.isPending}
                      variant="success"
                    >
                      {completeJobMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Completamento...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Completa
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
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
                      {job.client.nome} {job.client.cognome}
                    </p>
                  </div>
                  {job.client.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${job.client.telefono}`}
                        className="text-primary hover:underline"
                      >
                        {job.client.telefono}
                      </a>
                    </div>
                  )}
                  {job.site && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{job.site.descrizione}</p>
                        {job.site.indirizzo && (
                          <p className="text-sm text-muted-foreground">{job.site.indirizzo}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Descrizione */}
            {job.descrizione && (
              <Card>
                <CardHeader>
                  <CardTitle>Descrizione</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{job.descrizione}</p>
                </CardContent>
              </Card>
            )}

            {/* Materiali Usati */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Materiali Usati</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMaterialForm(!showMaterialForm)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showMaterialForm && (
                  <Card className="bg-muted/50 mb-4">
                    <CardContent className="p-4">
                      <form onSubmit={handleAddMaterial} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input
                            name="descrizione"
                            placeholder="Descrizione"
                            required
                            disabled={addMaterialMutation.isPending}
                          />
                          <Input
                            name="quantita"
                            type="number"
                            step="0.01"
                            placeholder="Quantità"
                            required
                            disabled={addMaterialMutation.isPending}
                          />
                          <Input
                            name="prezzoUnitario"
                            type="number"
                            step="0.01"
                            placeholder="Prezzo unitario (€)"
                            required
                            disabled={addMaterialMutation.isPending}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={addMaterialMutation.isPending}
                            size="sm"
                          >
                            {addMaterialMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Salvataggio...
                              </>
                            ) : (
                              'Salva'
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowMaterialForm(false)}
                          >
                            Annulla
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {job.materials && job.materials.length > 0 ? (
                  <div className="space-y-2">
                    {job.materials.map((mat: any) => (
                      <div
                        key={mat.id}
                        className="flex items-center justify-between p-3 border rounded-xl"
                      >
                        <div>
                          <p className="font-medium">{mat.descrizione}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {mat.quantita} • €{Number(mat.prezzoUnitario).toFixed(2)}/unità
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold">€{Number(mat.totale).toFixed(2)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMaterialMutation.mutate(mat.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Plus className="h-8 w-8" />}
                    title="Nessun materiale aggiunto"
                    description="Aggiungi i materiali utilizzati durante l'intervento"
                  />
                )}
              </CardContent>
            </Card>

            {/* Rapporti (ex Checklist) */}
            {hasReport && (
              <Card>
                <CardHeader>
                  <CardTitle>Rapporti</CardTitle>
                </CardHeader>
                <CardContent>
                  {job.checklists.map((jobChecklist: any) => (
                    <div key={jobChecklist.id} className="mb-4 last:mb-0">
                      <h3 className="font-semibold mb-3">{jobChecklist.checklist.nome}</h3>
                      <div className="space-y-2">
                        {jobChecklist.checklist.items.map((item: any) => {
                          const response = jobChecklist.responses.find(
                            (r: any) => r.checklistItemId === item.id
                          );
                          return (
                            <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg">
                              <input
                                type="checkbox"
                                checked={response?.valoreBoolean || false}
                                disabled
                                className="mt-1"
                              />
                              <label className="text-sm flex-1">{item.descrizione}</label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Allegati/Foto */}
            {job.attachments && job.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Foto e Allegati</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {job.attachments.map((att: any) => (
                      <div key={att.id} className="border rounded-xl overflow-hidden">
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${att.fileUrl}`}
                          alt={att.descrizione || 'Allegato'}
                          className="w-full h-32 object-cover"
                        />
                        <p className="text-xs text-muted-foreground p-2 truncate">
                          {att.descrizione || 'Foto'}
                        </p>
                      </div>
                    ))}
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
                <StatusBadge status={job.stato} type="job" />
                {job.completedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Completato: {new Date(job.completedAt).toLocaleString('it-IT')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Informazioni */}
            <Card>
              <CardHeader>
                <CardTitle>Informazioni</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {job.dataProgrammata && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(job.dataProgrammata).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                )}
                {job.oraProgrammata && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{job.oraProgrammata}</span>
                  </div>
                )}
                {job.priorita && (
                  <div>
                    <Badge variant={job.priorita === 'URGENTE' ? 'danger' : 'secondary'}>
                      {job.priorita}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Azioni */}
            <Card>
              <CardHeader>
                <CardTitle>Azioni</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!hasReport && job.stato === 'COMPLETATO' && (
                  <Link href={`/jobs/${jobId}/report`} className="block">
                    <Button variant="default" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Crea Rapporto
                    </Button>
                  </Link>
                )}
                {hasReport && (
                  <Button variant="outline" className="w-full" onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Scarica PDF
                  </Button>
                )}
                <Link href={`/clients/${job.client.id}`}>
                  <Button variant="outline" className="w-full">
                    Vedi Cliente
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
