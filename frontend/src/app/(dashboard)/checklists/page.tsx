'use client';

import { useQuery } from '@tanstack/react-query';
import { checklistsApi } from '@/lib/api';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { Badge } from '@/components/ui-kit/badge';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { CheckSquare, Plus } from 'lucide-react';

export default function ChecklistsPage() {
  const { data: checklists, isLoading } = useQuery({
    queryKey: ['checklists'],
    queryFn: async () => {
      const response = await checklistsApi.getAll();
      return response.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Checklist"
          description="Gestisci le tue checklist"
          action={{
            label: 'Nuova Checklist',
            onClick: () => (window.location.href = '/checklists/new'),
          }}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : checklists && checklists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checklists.map((checklist: any) => (
              <Link key={checklist.id} href={`/checklists/${checklist.id}`}>
                <Card className="hover:shadow-medium transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2">{checklist.nome}</h3>
                    {checklist.descrizione && (
                      <p className="text-sm text-muted-foreground mb-3">{checklist.descrizione}</p>
                    )}
                    <div className="flex items-center gap-2 mt-4">
                      <Badge variant="secondary">{checklist.tipoIntervento}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {checklist._count?.items || 0} voci
                      </span>
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
                icon={<CheckSquare className="h-12 w-12" />}
                title="Nessuna checklist trovata"
                description="Inizia creando la tua prima checklist"
                action={{
                  label: 'Crea Checklist',
                  onClick: () => (window.location.href = '/checklists/new'),
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
