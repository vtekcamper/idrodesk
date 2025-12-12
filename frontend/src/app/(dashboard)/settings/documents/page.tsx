'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '@/lib/api';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { AlertCircle, Loader2, CheckCircle2, Info } from 'lucide-react';

const useToast = () => ({
  toast: ({ title, description, variant }: any) => {
    if (variant === 'destructive') {
      alert(`Errore: ${title}\n${description}`);
    } else {
      alert(`${title}\n${description}`);
    }
  },
});

export default function DocumentsSettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [error, setError] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['company', 'settings', 'documents'],
    queryFn: async () => {
      const response = await companyApi.getDocumentSettings();
      return response.data;
    },
  });

  const [formData, setFormData] = useState({
    quotePrefix: 'PREV',
    quoteNextNumber: 1,
    jobPrefix: 'INT',
    jobNextNumber: 1,
    docFooterText: '',
    docHeaderText: '',
    defaultQuoteValidityDays: 30,
    defaultWarrantyText: '',
    defaultTermsText: '',
    defaultPrivacyText: '',
    defaultEmailTemplateQuoteSubject: '',
    defaultEmailTemplateQuoteBody: '',
    defaultEmailTemplateReportSubject: '',
    defaultEmailTemplateReportBody: '',
    defaultTaxRate: 22,
    showTax: true,
    currency: 'EUR',
    locale: 'it-IT',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        quotePrefix: settings.quotePrefix || 'PREV',
        quoteNextNumber: settings.quoteNextNumber || 1,
        jobPrefix: settings.jobPrefix || 'INT',
        jobNextNumber: settings.jobNextNumber || 1,
        docFooterText: settings.docFooterText || '',
        docHeaderText: settings.docHeaderText || '',
        defaultQuoteValidityDays: settings.defaultQuoteValidityDays || 30,
        defaultWarrantyText: settings.defaultWarrantyText || '',
        defaultTermsText: settings.defaultTermsText || '',
        defaultPrivacyText: settings.defaultPrivacyText || '',
        defaultEmailTemplateQuoteSubject: settings.defaultEmailTemplateQuoteSubject || '',
        defaultEmailTemplateQuoteBody: settings.defaultEmailTemplateQuoteBody || '',
        defaultEmailTemplateReportSubject: settings.defaultEmailTemplateReportSubject || '',
        defaultEmailTemplateReportBody: settings.defaultEmailTemplateReportBody || '',
        defaultTaxRate: settings.defaultTaxRate ? Number(settings.defaultTaxRate) : 22,
        showTax: settings.showTax !== undefined ? settings.showTax : true,
        currency: settings.currency || 'EUR',
        locale: settings.locale || 'it-IT',
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => companyApi.updateDocumentSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'settings'] });
      toast({
        title: 'Impostazioni salvate',
        description: 'Le impostazioni documenti sono state aggiornate con successo.',
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

    if (formData.quoteNextNumber < 1) {
      setError('Il numero preventivo deve essere positivo');
      return;
    }
    if (formData.jobNextNumber < 1) {
      setError('Il numero intervento deve essere positivo');
      return;
    }
    if (formData.defaultTaxRate < 0 || formData.defaultTaxRate > 100) {
      setError('L\'aliquota IVA deve essere tra 0 e 100');
      return;
    }

    updateMutation.mutate(formData);
  };

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
        title="Impostazioni Documenti"
        description="Configura template, numerazione e formattazione per preventivi e rapporti"
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
        {/* Numerazione */}
        <Card>
          <CardHeader>
            <CardTitle>Numerazione Documenti</CardTitle>
            <CardDescription>Configura prefissi e numeri progressivi per preventivi e interventi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Prefisso Preventivi</label>
                <Input
                  value={formData.quotePrefix}
                  onChange={(e) => setFormData({ ...formData, quotePrefix: e.target.value })}
                  placeholder="PREV"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Prossimo Numero Preventivo</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quoteNextNumber}
                  onChange={(e) => setFormData({ ...formData, quoteNextNumber: parseInt(e.target.value) || 1 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Il prossimo preventivo sarà: {formData.quotePrefix}-{String(formData.quoteNextNumber).padStart(4, '0')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Prefisso Interventi</label>
                <Input
                  value={formData.jobPrefix}
                  onChange={(e) => setFormData({ ...formData, jobPrefix: e.target.value })}
                  placeholder="INT"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Prossimo Numero Intervento</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.jobNextNumber}
                  onChange={(e) => setFormData({ ...formData, jobNextNumber: parseInt(e.target.value) || 1 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Il prossimo intervento sarà: {formData.jobPrefix}-{String(formData.jobNextNumber).padStart(4, '0')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preventivi */}
        <Card>
          <CardHeader>
            <CardTitle>Preventivi</CardTitle>
            <CardDescription>Impostazioni specifiche per i preventivi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Validità Default (giorni)</label>
              <Input
                type="number"
                min="1"
                value={formData.defaultQuoteValidityDays}
                onChange={(e) => setFormData({ ...formData, defaultQuoteValidityDays: parseInt(e.target.value) || 30 })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Aliquota IVA Default (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.defaultTaxRate}
                  onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 22 })}
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  checked={formData.showTax}
                  onChange={(e) => setFormData({ ...formData, showTax: e.target.checked })}
                  className="h-4 w-4"
                />
                <label className="text-sm font-medium">Mostra IVA nei preventivi</label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Testo Garanzia</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                value={formData.defaultWarrantyText}
                onChange={(e) => setFormData({ ...formData, defaultWarrantyText: e.target.value })}
                placeholder="Es. Garanzia 2 anni su materiali e manodopera..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Condizioni Generali</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                value={formData.defaultTermsText}
                onChange={(e) => setFormData({ ...formData, defaultTermsText: e.target.value })}
                placeholder="Es. Il preventivo è valido per 30 giorni..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Privacy</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                value={formData.defaultPrivacyText}
                onChange={(e) => setFormData({ ...formData, defaultPrivacyText: e.target.value })}
                placeholder="Es. I dati sono trattati secondo il GDPR..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Template Email Preventivi */}
        <Card>
          <CardHeader>
            <CardTitle>Template Email Preventivo</CardTitle>
            <CardDescription>Template per l'invio automatico dei preventivi via email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Variabili disponibili: {'{'}companyName{'}'}, {'{'}clientName{'}'}, {'{'}quoteNumber{'}'}, {'{'}link{'}'}, {'{'}total{'}'}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Oggetto Email</label>
              <Input
                value={formData.defaultEmailTemplateQuoteSubject}
                onChange={(e) => setFormData({ ...formData, defaultEmailTemplateQuoteSubject: e.target.value })}
                placeholder="Preventivo {quoteNumber} - {companyName}"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Corpo Email</label>
              <textarea
                className="flex min-h-[150px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono"
                value={formData.defaultEmailTemplateQuoteBody}
                onChange={(e) => setFormData({ ...formData, defaultEmailTemplateQuoteBody: e.target.value })}
                placeholder="Gentile {clientName},&#10;&#10;In allegato il preventivo {quoteNumber} per un importo totale di {total}€.&#10;&#10;Cordiali saluti,&#10;{companyName}"
              />
            </div>
          </CardContent>
        </Card>

        {/* Template Email Rapporti */}
        <Card>
          <CardHeader>
            <CardTitle>Template Email Rapporto</CardTitle>
            <CardDescription>Template per l'invio automatico dei rapporti intervento via email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Variabili disponibili: {'{'}companyName{'}'}, {'{'}clientName{'}'}, {'{'}jobNumber{'}'}, {'{'}link{'}'}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Oggetto Email</label>
              <Input
                value={formData.defaultEmailTemplateReportSubject}
                onChange={(e) => setFormData({ ...formData, defaultEmailTemplateReportSubject: e.target.value })}
                placeholder="Rapporto Intervento {jobNumber} - {companyName}"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Corpo Email</label>
              <textarea
                className="flex min-h-[150px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono"
                value={formData.defaultEmailTemplateReportBody}
                onChange={(e) => setFormData({ ...formData, defaultEmailTemplateReportBody: e.target.value })}
                placeholder="Gentile {clientName},&#10;&#10;In allegato il rapporto dell'intervento {jobNumber}.&#10;&#10;Cordiali saluti,&#10;{companyName}"
              />
            </div>
          </CardContent>
        </Card>

        {/* Header e Footer Documenti */}
        <Card>
          <CardHeader>
            <CardTitle>Header e Footer Documenti</CardTitle>
            <CardDescription>Testi da mostrare in tutti i documenti (preventivi e rapporti)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Header (in alto)</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                value={formData.docHeaderText}
                onChange={(e) => setFormData({ ...formData, docHeaderText: e.target.value })}
                placeholder="Es. Grazie per aver scelto i nostri servizi..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Footer (in basso)</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                value={formData.docFooterText}
                onChange={(e) => setFormData({ ...formData, docFooterText: e.target.value })}
                placeholder="Es. Per informazioni: info@azienda.it - Tel. 123 456 7890"
              />
            </div>
          </CardContent>
        </Card>

        {/* Valuta e Locale */}
        <Card>
          <CardHeader>
            <CardTitle>Formattazione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Valuta</label>
                <Input
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  placeholder="EUR"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Locale</label>
                <Input
                  value={formData.locale}
                  onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                  placeholder="it-IT"
                />
              </div>
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
                Salva Impostazioni
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

