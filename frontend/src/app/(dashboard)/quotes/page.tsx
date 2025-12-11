'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { quotesApi } from '@/lib/api';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

export default function QuotesPage() {
  const [filters, setFilters] = useState({
    stato: '',
  });

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes', filters],
    queryFn: () => quotesApi.getAll(filters),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Preventivi</h1>
            <p className="text-gray-600">Gestisci i tuoi preventivi</p>
          </div>
          <Link href="/quotes/new" className="btn btn-primary">
            + Nuovo Preventivo
          </Link>
        </div>

        <div>
          <select
            className="input max-w-xs"
            value={filters.stato}
            onChange={(e) => setFilters({ ...filters, stato: e.target.value })}
          >
            <option value="">Tutti gli stati</option>
            <option value="BOZZA">Bozza</option>
            <option value="INVIATO">Inviato</option>
            <option value="ACCETTATO">Accettato</option>
            <option value="RIFIUTATO">Rifiutato</option>
            <option value="SCADUTO">Scaduto</option>
          </select>
        </div>

        {isLoading ? (
          <p className="text-gray-500">Caricamento...</p>
        ) : quotes && quotes.length > 0 ? (
          <div className="space-y-3">
            {quotes.map((quote: any) => (
              <Link
                key={quote.id}
                href={`/quotes/${quote.id}`}
                className="block card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      Preventivo {quote.numeroPreventivo}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {quote.client.nome} {quote.client.cognome}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      📅 {new Date(quote.data).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-lg font-bold">
                      €{Number(quote.totaleLordo).toFixed(2)}
                    </span>
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      quote.stato === 'ACCETTATO' ? 'bg-green-100 text-green-800' :
                      quote.stato === 'RIFIUTATO' ? 'bg-red-100 text-red-800' :
                      quote.stato === 'INVIATO' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {quote.stato}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500">Nessun preventivo trovato</p>
            <Link href="/quotes/new" className="btn btn-primary mt-4 inline-block">
              Crea il primo preventivo
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

