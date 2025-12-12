'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';

export const dynamic = 'force-dynamic';

export default function SetupAdminPage() {
  const [step, setStep] = useState<'checking' | 'form' | 'success' | 'exists'>('checking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nome: 'Alessandro',
    cognome: 'Terazzan',
    email: 'hellonomoslab@gmail.com',
    password: '',
  });

  useEffect(() => {
    // Controlla se esiste già un super admin
    checkSuperAdmin();
  }, []);

  const checkSuperAdmin = async () => {
    try {
      // Usa il proxy Netlify /api che reindirizza al backend Railway
      const apiUrl = '/api';
      const response = await fetch(`${apiUrl}/admin/super-admins/check`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        // Se la richiesta fallisce, mostra il form (permetti la creazione)
        setStep('form');
        return;
      }

      const data = await response.json();
      
      // Se esiste già un super admin, mostra il messaggio
      if (data.exists && data.count > 0) {
        setStep('exists');
      } else {
        setStep('form');
      }
    } catch (err) {
      // Se fallisce, probabilmente non ci sono super admin, mostra il form
      console.error('Error checking super admin:', err);
      setStep('form');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Usa il proxy Netlify /api che reindirizza al backend Railway
      const apiUrl = '/api';
      const endpoint = `${apiUrl}/admin/super-admins`;
      console.log('Calling API:', endpoint);
      console.log('Form data:', { ...formData, password: '***' });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Controlla se la risposta è HTML (errore)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Response is not JSON:', text.substring(0, 200));
        throw new Error('Il server ha restituito una risposta non valida. Verifica che NEXT_PUBLIC_API_URL sia configurato correttamente.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore nella creazione super admin');
      }

      setStep('success');
    } catch (err: any) {
      console.error('Setup admin error:', err);
      if (err.message) {
        setError(err.message);
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Impossibile connettersi al server. Verifica che il backend sia online e che Netlify abbia configurato correttamente il redirect a Railway.');
      } else {
        setError('Errore nella creazione super admin: ' + String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifica in corso...</p>
        </div>
      </div>
    );
  }

  if (step === 'exists') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Super Admin Già Configurato
          </h1>
          <p className="text-gray-600 mb-6">
            Il super admin è già stato creato. Puoi accedere al pannello admin.
          </p>
          <a
            href="/admin/login"
            className="btn btn-primary w-full"
          >
            Vai al Login Admin
          </a>
          <p className="text-sm text-gray-500 mt-4">
            Questa pagina può essere rimossa in sicurezza.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Super Admin Creato con Successo!
          </h1>
          <p className="text-gray-600 mb-6">
            Il super admin è stato creato correttamente. Puoi ora accedere al pannello amministrativo.
          </p>
          <a
            href="/admin/login"
            className="btn btn-primary w-full mb-4"
          >
            Vai al Login Admin
          </a>
          <p className="text-sm text-gray-500">
            <strong>IMPORTANTE:</strong> Questa pagina può essere rimossa in sicurezza dal codice.
            Il super admin è stato creato e l'endpoint API è ora protetto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Setup Super Admin
          </h1>
          <p className="text-gray-600">
            Crea il primo super admin per IdroDesk
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              id="nome"
              type="text"
              required
              className="input w-full"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="cognome" className="block text-sm font-medium text-gray-700 mb-1">
              Cognome
            </label>
            <input
              id="cognome"
              type="text"
              required
              className="input w-full"
              value={formData.cognome}
              onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="input w-full"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="input w-full"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Inserisci una password sicura"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Creazione in corso...' : 'Crea Super Admin'}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-6 text-center">
          Questa pagina è accessibile solo se non esiste ancora un super admin.
          Dopo la creazione, questa pagina si disabiliterà automaticamente.
        </p>
      </div>
    </div>
  );
}

