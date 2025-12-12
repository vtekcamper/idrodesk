'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent } from '@/components/ui-kit/card';
import { Input } from '@/components/ui-kit/input';
import { Button } from '@/components/ui-kit/button';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { Search, Users, Plus } from 'lucide-react';

export default function ClientsPage() {
  const [search, setSearch] = useState('');

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: async () => {
      const response = await clientsApi.getAll({ search });
      return response.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Clienti"
          description="Gestisci i tuoi clienti"
          action={{
            label: 'Nuovo Cliente',
            onClick: () => (window.location.href = '/clients/new'),
          }}
        />

        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cerca cliente..."
                className="pl-10 max-w-md"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : clients && clients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client: any) => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <Card className="hover:shadow-medium transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2">
                      {client.nome} {client.cognome || ''}
                    </h3>
                    {client.email && (
                      <p className="text-sm text-muted-foreground mb-1">{client.email}</p>
                    )}
                    {client.telefono && (
                      <p className="text-sm text-muted-foreground mb-3">{client.telefono}</p>
                    )}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{client._count?.quotes || 0} preventivi</span>
                      <span>•</span>
                      <span>{client._count?.jobs || 0} lavori</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="Nessun cliente trovato"
                description={search ? 'Prova a modificare la ricerca' : 'Inizia aggiungendo il tuo primo cliente'}
                action={{
                  label: 'Aggiungi Cliente',
                  onClick: () => (window.location.href = '/clients/new'),
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
