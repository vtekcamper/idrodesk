'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/adminApi';
import { apiClient } from '@/lib/api';

export default function ImpersonationBanner() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Verifica se siamo in modalità impersonation
  // (dovresti leggere dal token JWT, per ora usiamo localStorage)
  const isImpersonated = typeof window !== 'undefined' && 
    localStorage.getItem('isImpersonated') === 'true';

  if (!isImpersonated) {
    return null;
  }

  const handleStopImpersonation = async () => {
    setLoading(true);
    try {
      const response = await adminApi.stopImpersonation();
      const { accessToken, user } = response.data;

      // Aggiorna token e user
      apiClient.setToken(accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isSuperAdmin', 'true');
        localStorage.removeItem('isImpersonated');
      }

      // Ricarica la pagina
      router.refresh();
    } catch (error: any) {
      console.error('Error stopping impersonation:', error);
      alert('Errore nella terminazione impersonation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-500 text-yellow-900 px-4 py-3 border-b-2 border-yellow-600">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold">Modalità Impersonation Attiva</p>
            <p className="text-sm">Stai visualizzando il sistema come utente tenant</p>
          </div>
        </div>
        <button
          onClick={handleStopImpersonation}
          disabled={loading}
          className="btn btn-secondary text-sm px-4 py-2"
        >
          {loading ? 'Terminazione...' : 'Termina Impersonation'}
        </button>
      </div>
    </div>
  );
}

