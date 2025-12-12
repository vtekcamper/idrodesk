'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { materialsApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent } from '@/components/ui-kit/card';
import { Input } from '@/components/ui-kit/input';
import { Button } from '@/components/ui-kit/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui-kit/table';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { Search, Package, Plus } from 'lucide-react';

export default function MaterialsPage() {
  const [search, setSearch] = useState('');

  const { data: materials, isLoading } = useQuery({
    queryKey: ['materials', search],
    queryFn: async () => {
      const response = await materialsApi.getAll({ search });
      return response.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Materiali"
          description="Gestisci il tuo magazzino"
          action={{
            label: 'Nuovo Materiale',
            onClick: () => (window.location.href = '/materials/new'),
          }}
        />

        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cerca materiale..."
                className="pl-10 max-w-md"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : materials && materials.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codice</TableHead>
                      <TableHead>Descrizione</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Prezzo Vendita</TableHead>
                      <TableHead className="text-right">Giacenza</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.map((material: any) => (
                      <TableRow key={material.id} className="hover:bg-accent">
                        <TableCell className="font-mono">{material.codice}</TableCell>
                        <TableCell className="font-medium">{material.descrizione}</TableCell>
                        <TableCell>{material.categoria || '-'}</TableCell>
                        <TableCell className="text-right font-medium">
                          €{Number(material.prezzoVendita).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">{material.giacenza}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                icon={<Package className="h-12 w-12" />}
                title="Nessun materiale trovato"
                description={search ? 'Prova a modificare la ricerca' : 'Inizia aggiungendo il tuo primo materiale'}
                action={{
                  label: 'Aggiungi Materiale',
                  onClick: () => (window.location.href = '/materials/new'),
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
