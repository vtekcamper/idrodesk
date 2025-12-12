'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '@/lib/api';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { AlertCircle, Loader2, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react';

const useToast = () => ({
  toast: ({ title, description, variant }: any) => {
    if (variant === 'destructive') {
      alert(`Errore: ${title}\n${description}`);
    } else {
      alert(`${title}\n${description}`);
    }
  },
});

export default function PreferencesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [error, setError] = useState('');

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['company', 'settings', 'preferences'],
    queryFn: async () => {
      const response = await companyApi.getAppPreferences();
      return response.data;
    },
  });

  const [formData, setFormData] = useState({
    workflowEnabled: true,
    requireReportOnComplete: false,
    enableMaterialsPricing: true,
    defaultUnit: 'pz',
    dateFormat: 'DD/MM/YYYY',
    timeTrackingEnabled: false,
    attachmentsEnabled: true,
    maxUploadSizeMB: 10,
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        workflowEnabled: preferences.workflowEnabled !== undefined ? preferences.workflowEnabled : true,
        requireReportOnComplete: preferences.requireReportOnComplete !== undefined ? preferences.requireReportOnComplete : false,
        enableMaterialsPricing: preferences.enableMaterialsPricing !== undefined ? preferences.enableMaterialsPricing : true,
        defaultUnit: preferences.defaultUnit || 'pz',
        dateFormat: preferences.dateFormat || 'DD/MM/YYYY',
        timeTrackingEnabled: preferences.timeTrackingEnabled !== undefined ? preferences.timeTrackingEnabled : false,
        attachmentsEnabled: preferences.attachmentsEnabled !== undefined ? preferences.attachmentsEnabled : true,
        maxUploadSizeMB: preferences.maxUploadSizeMB || 10,
      });
    }
  }, [preferences]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => companyApi.updateAppPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'settings'] });
      toast({
        title: 'Preferenze salvate',
        description: 'Le preferenze app sono state aggiornate con successo.',
      });
      setError('');
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || 'Errore nel salvataggio';
      setError(errorMsg);
      toast({
        title: 'Errore',
        description: errorMsg,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.maxUploadSizeMB < 1 || formData.maxUploadSizeMB > 100) {
      setError('Dimensione massima upload deve essere tra 1 e 100 MB');
      return;
    }

    updateMutation.mutate(formData);
  };

  const Toggle = ({ checked, onChange, label, description }: any) => (
    <div className="flex items-start justify-between p-4 border rounded-xl">
      <div className="flex-1">
        <label className="text-sm font-medium cursor-pointer" onClick={() => onChange(!checked)}>
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Preferenze App"
        description="Configura il comportamento dell'applicazione"
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
        {/* Workflow */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Interventi</CardTitle>
            <CardDescription>Configura il flusso di lavoro per gli interventi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Toggle
              checked={formData.workflowEnabled}
              onChange={(val: boolean) => setFormData({ ...formData, workflowEnabled: val })}
              label="Abilita Workflow"
              description="Permetti di avviare e completare interventi (Inizia/Completa)"
            />
            <Toggle
              checked={formData.requireReportOnComplete}
              onChange={(val: boolean) => setFormData({ ...formData, requireReportOnComplete: val })}
              label="Richiedi Rapporto alla Chiusura"
              description="Chiedi di compilare il rapporto quando un intervento viene completato"
            />
          </CardContent>
        </Card>

        {/* Materiali */}
        <Card>
          <CardHeader>
            <CardTitle>Materiali</CardTitle>
            <CardDescription>Gestione materiali e prezzi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle
              checked={formData.enableMaterialsPricing}
              onChange={(val: boolean) => setFormData({ ...formData, enableMaterialsPricing: val })}
              label="Abilita Gestione Prezzi Materiali"
              description="Permetti di impostare prezzi per i materiali utilizzati"
            />
            <div>
              <label className="block text-sm font-medium mb-2">Unità Default</label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                value={formData.defaultUnit}
                onChange={(e) => setFormData({ ...formData, defaultUnit: e.target.value })}
              >
                <option value="pz">Pezzi (pz)</option>
                <option value="mt">Metri (mt)</option>
                <option value="h">Ore (h)</option>
                <option value="kg">Chilogrammi (kg)</option>
                <option value="l">Litri (l)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tracking e Allegati */}
        <Card>
          <CardHeader>
            <CardTitle>Tracking e Allegati</CardTitle>
            <CardDescription>Configurazione per tracciamento tempo e file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle
              checked={formData.timeTrackingEnabled}
              onChange={(val: boolean) => setFormData({ ...formData, timeTrackingEnabled: val })}
              label="Abilita Tracking Tempo"
              description="Permetti di tracciare il tempo impiegato per ogni intervento"
            />
            <Toggle
              checked={formData.attachmentsEnabled}
              onChange={(val: boolean) => setFormData({ ...formData, attachmentsEnabled: val })}
              label="Abilita Allegati"
              description="Permetti di caricare foto e documenti per gli interventi"
            />
            {formData.attachmentsEnabled && (
              <div>
                <label className="block text-sm font-medium mb-2">Dimensione Massima Upload (MB)</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxUploadSizeMB}
                  onChange={(e) => setFormData({ ...formData, maxUploadSizeMB: parseInt(e.target.value) || 10 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Limite hard configurato nel backend. Questo valore è solo informativo.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formato Data */}
        <Card>
          <CardHeader>
            <CardTitle>Formato Data</CardTitle>
            <CardDescription>Come visualizzare le date nell'applicazione</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium mb-2">Formato</label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                value={formData.dateFormat}
                onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (es. 25/12/2024)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (es. 12/25/2024)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (es. 2024-12-25)</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY (es. 25-12-2024)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2 sticky bottom-0 bg-background p-4 border-t -mx-6 -mb-6">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex-1"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Salva Preferenze
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

