'use client';

import { useQuery } from '@tanstack/react-query';
import { checklistsApi } from '@/lib/api';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

export default function ChecklistsPage() {
  const { data: checklists, isLoading } = useQuery({
    queryKey: ['checklists'],
    queryFn: () => checklistsApi.getAll(),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Checklist</h1>
            <p className="text-gray-600">Gestisci le tue checklist</p>
          </div>
          <button className="btn btn-primary">+ Nuova Checklist</button>
        </div>

        {isLoading ? (
          <p className="text-gray-500">Caricamento...</p>
        ) : checklists && checklists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checklists.map((checklist: any) => (
              <Link
                key={checklist.id}
                href={`/checklists/${checklist.id}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-lg">{checklist.nome}</h3>
                {checklist.descrizione && (
                  <p className="text-sm text-gray-600 mt-1">{checklist.descrizione}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Tipo: {checklist.tipoIntervento}
                </p>
                <p className="text-sm text-gray-500">
                  {checklist._count?.items || 0} voci
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500">Nessuna checklist trovata</p>
            <button className="btn btn-primary mt-4">Crea la prima checklist</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

