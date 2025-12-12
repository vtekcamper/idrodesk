'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '@/lib/api';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { AlertCircle, Loader2, CheckCircle2, Bell } from 'lucide-react';

const useToast = () => ({
  toast: ({ title, description, variant }: any) => {
    if (variant === 'destructive') {
      alert(`Errore: ${title}\n${description}`);
    } else {
      alert(`${title}\n${description}`);
    }
  },
});

export default function NotificationsPage() {
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
    notifyQuoteExpiring: true,
    notifyJobsTomorrow: true,
    notifyMissingReports: true,
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        notifyQuoteExpiring: preferences.notifyQuoteExpiring !== undefined ? preferences.notifyQuoteExpiring : true,
        notifyJobsTomorrow: preferences.notifyJobsTomorrow !== undefined ? preferences.notifyJobsTomorrow : true,
        notifyMissingReports: preferences.notifyMissingReports !== undefined ? preferences.notifyMissingReports : true,
      });
    }
  }, [preferences]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => companyApi.updateNotifications(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'settings'] });
      toast({
        title: 'Notifiche salvate',
        description: 'Le impostazioni notifiche sono state aggiornate con successo.',
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
        title="Notifiche"
        description="Configura le notifiche email automatiche"
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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifiche Email</CardTitle>
            </div>
            <CardDescription>
              Ricevi email automatiche per eventi importanti (funzionalità in arrivo)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Toggle
              checked={formData.notifyQuoteExpiring}
              onChange={(val: boolean) => setFormData({ ...formData, notifyQuoteExpiring: val })}
              label="Preventivi in Scadenza"
              description="Ricevi un avviso quando un preventivo sta per scadere"
            />
            <Toggle
              checked={formData.notifyJobsTomorrow}
              onChange={(val: boolean) => setFormData({ ...formData, notifyJobsTomorrow: val })}
              label="Interventi di Domani"
              description="Ricevi un promemoria la sera prima degli interventi programmati"
            />
            <Toggle
              checked={formData.notifyMissingReports}
              onChange={(val: boolean) => setFormData({ ...formData, notifyMissingReports: val })}
              label="Rapporti Mancanti"
              description="Ricevi un avviso per interventi completati senza rapporto"
            />
          </CardContent>
        </Card>

        <div className="bg-muted/50 p-4 rounded-xl">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Le notifiche email automatiche sono attualmente in fase di sviluppo.
            Le impostazioni vengono salvate e saranno utilizzate quando la funzionalità sarà disponibile.
          </p>
        </div>

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
                Salva Notifiche
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

