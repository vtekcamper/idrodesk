'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    ragioneSociale: '',
    piva: '',
    indirizzo: '',
    telefono: '',
    email: '',
    nome: '',
    cognome: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }

    if (formData.password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...data } = formData;
      await auth.register(data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Registra la tua azienda
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Crea il tuo account IdroDesk
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="ragioneSociale" className="block text-sm font-medium text-gray-700">
                Ragione Sociale *
              </label>
              <input
                id="ragioneSociale"
                name="ragioneSociale"
                type="text"
                required
                className="input mt-1"
                value={formData.ragioneSociale}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="piva" className="block text-sm font-medium text-gray-700">
                P.IVA *
              </label>
              <input
                id="piva"
                name="piva"
                type="text"
                required
                className="input mt-1"
                value={formData.piva}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="indirizzo" className="block text-sm font-medium text-gray-700">
                Indirizzo
              </label>
              <input
                id="indirizzo"
                name="indirizzo"
                type="text"
                className="input mt-1"
                value={formData.indirizzo}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                Telefono
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                className="input mt-1"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input mt-1"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                  Nome *
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  className="input mt-1"
                  value={formData.nome}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="cognome" className="block text-sm font-medium text-gray-700">
                  Cognome *
                </label>
                <input
                  id="cognome"
                  name="cognome"
                  type="text"
                  required
                  className="input mt-1"
                  value={formData.cognome}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input mt-1"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Conferma Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="input mt-1"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary"
            >
              {loading ? 'Registrazione in corso...' : 'Registrati'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-sm text-primary-600 hover:text-primary-500">
              Hai già un account? Accedi
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

