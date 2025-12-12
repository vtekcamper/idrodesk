'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { AlertCircle, Loader2, CheckCircle2, Shield, Eye, EyeOff } from 'lucide-react';

const useToast = () => ({
  toast: ({ title, description, variant }: any) => {
    if (variant === 'destructive') {
      alert(`Errore: ${title}\n${description}`);
    } else {
      alert(`${title}\n${description}`);
    }
  },
});

export default function SecurityPage() {
  const { toast } = useToast();
  const [error, setError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(data),
    onSuccess: () => {
      toast({
        title: 'Password aggiornata',
        description: 'La tua password è stata cambiata con successo.',
      });
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setError('');
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || 'Errore nel cambio password';
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

    if (!formData.currentPassword) {
      setError('Inserisci la password corrente');
      return;
    }

    if (!formData.newPassword) {
      setError('Inserisci la nuova password');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('La nuova password deve essere di almeno 8 caratteri');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Sicurezza"
        description="Gestisci la sicurezza del tuo account"
      />

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4 flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* Cambio Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Cambia Password</CardTitle>
          </div>
          <CardDescription>
            Aggiorna la password del tuo account per mantenere la sicurezza
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Password Corrente <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  placeholder="Inserisci la password corrente"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Nuova Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Minimo 8 caratteri"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                La password deve contenere almeno 8 caratteri
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Conferma Nuova Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Ripeti la nuova password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="w-full"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aggiornamento...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Cambia Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Gestione Sessioni (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Gestione Sessioni</CardTitle>
          <CardDescription>Gestisci le sessioni attive del tuo account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-4 rounded-xl">
            <p className="text-sm text-muted-foreground">
              La gestione delle sessioni attive sarà disponibile in una versione futura.
              Per ora, puoi disconnetterti da tutti i dispositivi effettuando il logout.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2FA (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Autenticazione a Due Fattori (2FA)</CardTitle>
          <CardDescription>Aggiungi un livello extra di sicurezza al tuo account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-4 rounded-xl">
            <p className="text-sm text-muted-foreground">
              L'autenticazione a due fattori sarà disponibile in una versione futura.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

