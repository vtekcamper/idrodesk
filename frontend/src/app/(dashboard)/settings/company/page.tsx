'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '@/lib/api';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { AlertCircle, Loader2, Upload, X, CheckCircle2 } from 'lucide-react';
// Toast semplice (placeholder)
const useToast = () => ({
  toast: ({ title, description, variant }: any) => {
    if (variant === 'destructive') {
      alert(`Errore: ${title}\n${description}`);
    } else {
      alert(`${title}\n${description}`);
    }
  },
});

export default function CompanySettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['company', 'settings'],
    queryFn: async () => {
      const response = await companyApi.getAllSettings();
      return response.data;
    },
  });

  const [formData, setFormData] = useState({
    ragioneSociale: '',
    nomeCommerciale: '',
    piva: '',
    codiceFiscale: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    paese: 'IT',
    telefono: '',
    email: '',
    sitoWeb: '',
    pecEmail: '',
    sdiCode: '',
    iban: '',
    defaultPaymentTermsDays: 30,
    notePublic: '',
    logoUrl: '',
  });

  useEffect(() => {
    if (settings?.company) {
      const company = settings.company;
      setFormData({
        ragioneSociale: company.ragioneSociale || '',
        nomeCommerciale: company.nomeCommerciale || '',
        piva: company.piva || '',
        codiceFiscale: company.codiceFiscale || '',
        indirizzo: company.indirizzo || '',
        citta: company.citta || '',
        cap: company.cap || '',
        provincia: company.provincia || '',
        paese: company.paese || 'IT',
        telefono: company.telefono || '',
        email: company.email || '',
        sitoWeb: company.sitoWeb || '',
        pecEmail: company.pecEmail || '',
        sdiCode: company.sdiCode || '',
        iban: company.iban || '',
        defaultPaymentTermsDays: company.defaultPaymentTermsDays || 30,
        notePublic: company.notePublic || '',
        logoUrl: company.logoUrl || '',
      });
      if (company.logoUrl) {
        setLogoPreview(company.logoUrl);
      }
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => companyApi.updateCompanySettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'settings'] });
      toast({
        title: 'Impostazioni salvate',
        description: 'Le impostazioni aziendali sono state aggiornate con successo.',
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validazione
      if (file.size > 2 * 1024 * 1024) {
        setError('Il logo deve essere inferiore a 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Il file deve essere un\'immagine');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData({ ...formData, logoUrl: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.ragioneSociale.trim() && !formData.nomeCommerciale.trim()) {
      setError('Inserisci almeno la ragione sociale o il nome commerciale');
      return;
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Inserisci un\'email valida');
      return;
    }

    // TODO: Upload logo se logoFile è presente
    // Per ora salva solo logoUrl se già presente
    updateMutation.mutate({
      ...formData,
      logoUrl: logoPreview || formData.logoUrl,
    });
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
        title="Impostazioni Azienda"
        description="Configura i dati aziendali e il branding"
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
        {/* Dati Legali */}
        <Card>
          <CardHeader>
            <CardTitle>Dati Legali</CardTitle>
            <CardDescription>Informazioni fiscali e legali dell'azienda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Ragione Sociale <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.ragioneSociale}
                onChange={(e) => setFormData({ ...formData, ragioneSociale: e.target.value })}
                placeholder="Es. Idraulici Rossi S.r.l."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nome Commerciale</label>
              <Input
                value={formData.nomeCommerciale}
                onChange={(e) => setFormData({ ...formData, nomeCommerciale: e.target.value })}
                placeholder="Es. Idraulici Rossi"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  P.IVA <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.piva}
                  onChange={(e) => setFormData({ ...formData, piva: e.target.value })}
                  placeholder="IT12345678901"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Codice Fiscale</label>
                <Input
                  value={formData.codiceFiscale}
                  onChange={(e) => setFormData({ ...formData, codiceFiscale: e.target.value })}
                  placeholder="RSSMRA80A01H501U"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Indirizzo */}
        <Card>
          <CardHeader>
            <CardTitle>Indirizzo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Indirizzo</label>
              <Input
                value={formData.indirizzo}
                onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                placeholder="Via Roma 123"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
                <label className="block text-sm font-medium mb-2">Provincia</label>
                <Input
                  value={formData.provincia}
                  onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                  placeholder="MI"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Paese</label>
              <Input
                value={formData.paese}
                onChange={(e) => setFormData({ ...formData, paese: e.target.value })}
                placeholder="IT"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contatti */}
        <Card>
          <CardHeader>
            <CardTitle>Contatti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@azienda.it"
                required
              />
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
              <label className="block text-sm font-medium mb-2">Sito Web</label>
              <Input
                type="url"
                value={formData.sitoWeb}
                onChange={(e) => setFormData({ ...formData, sitoWeb: e.target.value })}
                placeholder="https://www.azienda.it"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">PEC</label>
                <Input
                  type="email"
                  value={formData.pecEmail}
                  onChange={(e) => setFormData({ ...formData, pecEmail: e.target.value })}
                  placeholder="azienda@pec.it"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Codice SDI</label>
                <Input
                  value={formData.sdiCode}
                  onChange={(e) => setFormData({ ...formData, sdiCode: e.target.value })}
                  placeholder="XXXXXXX"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">IBAN</label>
              <Input
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                placeholder="IT60 X054 2811 1010 0000 0123 456"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Logo Azienda</CardTitle>
            <CardDescription>Carica il logo della tua azienda (max 2MB, PNG/JPG/WEBP)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {logoPreview && (
              <div className="relative inline-block">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-32 w-auto border rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!logoPreview && (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Nessun logo caricato
                </p>
                <label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" asChild>
                    <span>Carica Logo</span>
                  </Button>
                </label>
              </div>
            )}
            {logoPreview && !logoFile && (
              <label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <Button type="button" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Cambia Logo
                </Button>
              </label>
            )}
          </CardContent>
        </Card>

        {/* Note Pubbliche */}
        <Card>
          <CardHeader>
            <CardTitle>Note Pubbliche</CardTitle>
            <CardDescription>Testo breve da includere nei documenti (preventivi, rapporti)</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={formData.notePublic}
              onChange={(e) => setFormData({ ...formData, notePublic: e.target.value })}
              placeholder="Es. Grazie per la fiducia accordataci..."
            />
          </CardContent>
        </Card>

        {/* Payment Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Termini di Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium mb-2">Giorni di Scadenza Default</label>
              <Input
                type="number"
                min="0"
                value={formData.defaultPaymentTermsDays}
                onChange={(e) => setFormData({ ...formData, defaultPaymentTermsDays: parseInt(e.target.value) || 30 })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Giorni di scadenza predefiniti per i preventivi (0 = immediato, 30 = 30 giorni)
              </p>
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

