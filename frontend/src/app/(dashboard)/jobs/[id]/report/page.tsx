'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { AlertCircle, Loader2, Save, Camera, CheckCircle2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function JobReportPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const jobId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    lavoroSvolto: '',
    esito: 'RISOLTO',
    clientePresente: false,
    tempoImpiegato: '',
    note: '',
  });

  // Carica intervento
  const { data: job, isLoading: loadingJob } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const response = await jobsApi.getById(jobId);
      return response.data;
    },
  });

  // Carica rapporto esistente (se presente)
  const { data: existingReport, isLoading: loadingReport } = useQuery({
    queryKey: ['job', jobId, 'report'],
    queryFn: async () => {
      try {
        const response = await jobsApi.getReport(jobId);
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null; // Nessun rapporto esistente
        }
        throw error;
      }
    },
    enabled: !!jobId,
  });

  // Popola form se rapporto esiste
  useEffect(() => {
    if (existingReport && existingReport.responses) {
      const responses = existingReport.responses;
      const lavoroResp = responses.find((r: any) => r.checklistItem.ordine === 1);
      const esitoResp = responses.find((r: any) => r.checklistItem.ordine === 2);
      const clienteResp = responses.find((r: any) => r.checklistItem.ordine === 3);
      const tempoResp = responses.find((r: any) => r.checklistItem.ordine === 4);

      setFormData({
        lavoroSvolto: lavoroResp?.valoreTesto || '',
        esito: esitoResp?.valoreBoolean ? 'RISOLTO' : 'DA_TORNARE',
        clientePresente: clienteResp?.valoreBoolean || false,
        tempoImpiegato: tempoResp?.valoreNumero?.toString() || '',
        note: '',
      });
    }
  }, [existingReport]);

  const createReportMutation = useMutation({
    mutationFn: (data: any) => jobsApi.createReport(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job', jobId, 'report'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'dashboard'] });
      router.push(`/jobs/${jobId}`);
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Errore nella creazione rapporto');
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: (data: any) => jobsApi.updateReport(jobId, existingReport.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job', jobId, 'report'] });
      router.push(`/jobs/${jobId}`);
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Errore nell\'aggiornamento rapporto');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.lavoroSvolto.trim()) {
      setError('Inserisci una descrizione del lavoro svolto');
      return;
    }

    const data = {
      lavoroSvolto: formData.lavoroSvolto,
      esito: formData.esito,
      clientePresente: formData.clientePresente,
      tempoImpiegato: formData.tempoImpiegato || null,
      note: formData.note || null,
    };

    if (existingReport) {
      updateReportMutation.mutate(data);
    } else {
      createReportMutation.mutate(data);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    try {
      // Upload multiplo
      for (const file of Array.from(files)) {
        await jobsApi.addAttachment(jobId, file, 'FOTO', `Foto intervento`);
      }
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Errore nell\'upload foto');
    }
  };

  if (loadingJob || loadingReport) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Intervento non trovato</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const isEditing = !!existingReport;
  const isPending = createReportMutation.isPending || updateReportMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <PageHeader
          title={isEditing ? 'Modifica Rapporto' : 'Crea Rapporto Intervento'}
          description={`Intervento: ${job.titolo}`}
          breadcrumb={[
            { label: 'Interventi', href: '/jobs' },
            { label: job.titolo, href: `/jobs/${jobId}` },
            { label: isEditing ? 'Modifica Rapporto' : 'Nuovo Rapporto' },
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
          {/* Lavoro Svolto */}
          <Card>
            <CardHeader>
              <CardTitle>Lavoro Svolto</CardTitle>
              <CardDescription>Descrivi cosa è stato fatto durante l'intervento</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="flex min-h-[150px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.lavoroSvolto}
                onChange={(e) => setFormData({ ...formData, lavoroSvolto: e.target.value })}
                placeholder="Descrivi dettagliatamente il lavoro svolto..."
                required
              />
            </CardContent>
          </Card>

          {/* Esito */}
          <Card>
            <CardHeader>
              <CardTitle>Esito Intervento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-accent">
                  <input
                    type="radio"
                    name="esito"
                    value="RISOLTO"
                    checked={formData.esito === 'RISOLTO'}
                    onChange={(e) => setFormData({ ...formData, esito: e.target.value })}
                    className="h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <span className="font-medium">Risolto</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Il problema è stato risolto completamente
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-accent">
                  <input
                    type="radio"
                    name="esito"
                    value="DA_TORNARE"
                    checked={formData.esito === 'DA_TORNARE'}
                    onChange={(e) => setFormData({ ...formData, esito: e.target.value })}
                    className="h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-warning" />
                      <span className="font-medium">Da Tornare</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      È necessario un intervento successivo
                    </p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Informazioni Aggiuntive */}
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Aggiuntive</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.clientePresente}
                    onChange={(e) => setFormData({ ...formData, clientePresente: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">Cliente presente durante l'intervento</span>
                </label>
                <p className="text-xs text-muted-foreground ml-6">
                  Se il cliente era presente, puoi richiedere la firma (funzionalità in arrivo)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tempo impiegato (minuti)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.tempoImpiegato}
                  onChange={(e) => setFormData({ ...formData, tempoImpiegato: e.target.value })}
                  placeholder="es. 120"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Note aggiuntive</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Note aggiuntive sul lavoro..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Materiali (già aggiunti) */}
          {job.materials && job.materials.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Materiali Utilizzati</CardTitle>
                <CardDescription>
                  I materiali già aggiunti all'intervento verranno inclusi nel rapporto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {job.materials.map((mat: any) => (
                    <div key={mat.id} className="flex justify-between p-2 border rounded-lg text-sm">
                      <span>
                        {mat.descrizione} (Qty: {mat.quantita})
                      </span>
                      <span className="font-medium">€{Number(mat.totale).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Foto */}
          <Card>
            <CardHeader>
              <CardTitle>Foto</CardTitle>
              <CardDescription>Aggiungi foto prima/dopo dell'intervento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload">
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <span>
                      <Camera className="h-4 w-4 mr-2" />
                      Aggiungi Foto
                    </span>
                  </Button>
                </label>

                {job.attachments && job.attachments.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {job.attachments.map((att: any) => (
                      <div key={att.id} className="border rounded-xl overflow-hidden">
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${att.fileUrl}`}
                          alt={att.descrizione || 'Foto'}
                          className="w-full h-24 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Aggiorna Rapporto' : 'Salva Rapporto'}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/jobs/${jobId}`)}
            >
              Annulla
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

