'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

export default function ClientsPage() {
  const [search, setSearch] = useState('');

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => clientsApi.getAll({ search }),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clienti</h1>
            <p className="text-gray-600">Gestisci i tuoi clienti</p>
          </div>
          <Link href="/clients/new" className="btn btn-primary">
            + Nuovo Cliente
          </Link>
        </div>

        <div>
          <input
            type="text"
            placeholder="Cerca cliente..."
            className="input max-w-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <p className="text-gray-500">Caricamento...</p>
        ) : clients && clients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client: any) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-lg">
                  {client.nome} {client.cognome || ''}
                </h3>
                {client.email && (
                  <p className="text-sm text-gray-600 mt-1">{client.email}</p>
                )}
                {client.telefono && (
                  <p className="text-sm text-gray-600">{client.telefono}</p>
                )}
                <div className="mt-3 flex gap-2 text-xs text-gray-500">
                  <span>{client._count?.quotes || 0} preventivi</span>
                  <span>•</span>
                  <span>{client._count?.jobs || 0} lavori</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500">Nessun cliente trovato</p>
            <Link href="/clients/new" className="btn btn-primary mt-4 inline-block">
              Aggiungi il primo cliente
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

