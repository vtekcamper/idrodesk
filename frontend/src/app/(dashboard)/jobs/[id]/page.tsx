'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { useState } from 'react';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const jobId = params.id as string;
  const [showMaterialForm, setShowMaterialForm] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.getById(jobId),
  });

  const updateJobMutation = useMutation({
    mutationFn: (data: any) => jobsApi.update(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
  });

  const addMaterialMutation = useMutation({
    mutationFn: (data: any) => jobsApi.addMaterial(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      setShowMaterialForm(false);
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: (materialId: string) => jobsApi.deleteMaterial(jobId, materialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateJobMutation.mutate({ stato: newStatus });
  };

  const handleAddMaterial = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addMaterialMutation.mutate({
      descrizione: formData.get('descrizione'),
      quantita: formData.get('quantita'),
      prezzoUnitario: formData.get('prezzoUnitario'),
    });
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await jobsApi.getReportPDF(jobId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapportino-${jobId}.pdf`;
      a.click();
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <p className="text-gray-500">Caricamento...</p>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <p className="text-gray-500">Lavoro non trovato</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="text-primary-600 hover:text-primary-700 mb-2"
            >
              ← Indietro
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{job.titolo}</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPDF}
              className="btn btn-secondary"
            >
              📄 Scarica PDF
            </button>
          </div>
        </div>

        {/* Info Cliente */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-medium">{job.client.nome} {job.client.cognome}</p>
            </div>
            {job.client.telefono && (
              <div>
                <p className="text-sm text-gray-500">Telefono</p>
                <p className="font-medium">{job.client.telefono}</p>
              </div>
            )}
            {job.site && (
              <div>
                <p className="text-sm text-gray-500">Sito</p>
                <p className="font-medium">{job.site.descrizione}</p>
                {job.site.indirizzo && (
                  <p className="text-sm text-gray-600">{job.site.indirizzo}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stato e Azioni */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Stato</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusChange('PIANIFICATO')}
              className={`btn ${job.stato === 'PIANIFICATO' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Pianificato
            </button>
            <button
              onClick={() => handleStatusChange('IN_CORSO')}
              className={`btn ${job.stato === 'IN_CORSO' ? 'btn-primary' : 'btn-secondary'}`}
            >
              In Corso
            </button>
            <button
              onClick={() => handleStatusChange('COMPLETATO')}
              className={`btn ${job.stato === 'COMPLETATO' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Completato
            </button>
          </div>
        </div>

        {/* Descrizione */}
        {job.descrizione && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">Descrizione</h2>
            <p className="text-gray-700">{job.descrizione}</p>
          </div>
        )}

        {/* Materiali Usati */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Materiali Usati</h2>
            <button
              onClick={() => setShowMaterialForm(!showMaterialForm)}
              className="btn btn-primary text-sm"
            >
              + Aggiungi
            </button>
          </div>

          {showMaterialForm && (
            <form onSubmit={handleAddMaterial} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  name="descrizione"
                  type="text"
                  placeholder="Descrizione"
                  className="input"
                  required
                />
                <input
                  name="quantita"
                  type="number"
                  placeholder="Quantità"
                  className="input"
                  step="0.01"
                  required
                />
                <input
                  name="prezzoUnitario"
                  type="number"
                  placeholder="Prezzo unitario"
                  className="input"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary">
                  Salva
                </button>
                <button
                  type="button"
                  onClick={() => setShowMaterialForm(false)}
                  className="btn btn-secondary"
                >
                  Annulla
                </button>
              </div>
            </form>
          )}

          {job.materials && job.materials.length > 0 ? (
            <div className="space-y-2">
              {job.materials.map((mat: any) => (
                <div
                  key={mat.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{mat.descrizione}</p>
                    <p className="text-sm text-gray-600">
                      Qty: {mat.quantita} • €{Number(mat.prezzoUnitario).toFixed(2)}/unità
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">€{Number(mat.totale).toFixed(2)}</span>
                    <button
                      onClick={() => deleteMaterialMutation.mutate(mat.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nessun materiale aggiunto</p>
          )}
        </div>

        {/* Checklist */}
        {job.checklists && job.checklists.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Checklist</h2>
            {job.checklists.map((jobChecklist: any) => (
              <div key={jobChecklist.id} className="mb-4">
                <h3 className="font-medium mb-2">{jobChecklist.checklist.nome}</h3>
                <div className="space-y-2">
                  {jobChecklist.checklist.items.map((item: any) => {
                    const response = jobChecklist.responses.find(
                      (r: any) => r.checklistItemId === item.id
                    );
                    return (
                      <div key={item.id} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={response?.valoreBoolean || false}
                          disabled
                          className="mt-1"
                        />
                        <label className="text-sm">{item.descrizione}</label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Allegati */}
        {job.attachments && job.attachments.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Allegati</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {job.attachments.map((att: any) => (
                <div key={att.id} className="border rounded-lg p-2">
                  <img
                    src={`http://localhost:3001${att.fileUrl}`}
                    alt={att.descrizione || 'Allegato'}
                    className="w-full h-32 object-cover rounded"
                  />
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {att.descrizione || 'Foto'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

