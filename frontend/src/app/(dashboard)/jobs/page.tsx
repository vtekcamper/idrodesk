'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

export default function JobsPage() {
  const [filters, setFilters] = useState({
    stato: '',
    data: '',
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const response = await jobsApi.getAll(filters);
      return response.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lavori</h1>
            <p className="text-gray-600">Gestisci i tuoi interventi</p>
          </div>
          <Link href="/jobs/new" className="btn btn-primary">
            + Nuovo Lavoro
          </Link>
        </div>

        <div className="flex flex-wrap gap-4">
          <select
            className="input"
            value={filters.stato}
            onChange={(e) => setFilters({ ...filters, stato: e.target.value })}
          >
            <option value="">Tutti gli stati</option>
            <option value="BOZZA">Bozza</option>
            <option value="PIANIFICATO">Pianificato</option>
            <option value="IN_CORSO">In Corso</option>
            <option value="COMPLETATO">Completato</option>
            <option value="FATTURATO">Fatturato</option>
          </select>
          <input
            type="date"
            className="input"
            value={filters.data}
            onChange={(e) => setFilters({ ...filters, data: e.target.value })}
          />
        </div>

        {isLoading ? (
          <p className="text-gray-500">Caricamento...</p>
        ) : jobs && jobs.length > 0 ? (
          <div className="space-y-3">
            {jobs.map((job: any) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{job.titolo}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {job.client.nome} {job.client.cognome}
                      {job.site && <> • {job.site.descrizione}</>}
                    </p>
                    {job.dataProgrammata && (
                      <p className="text-sm text-gray-500 mt-1">
                        📅 {new Date(job.dataProgrammata).toLocaleDateString('it-IT')}
                        {job.oraProgrammata && ` alle ${job.oraProgrammata}`}
                      </p>
                    )}
                    {job.tecnico && (
                      <p className="text-sm text-gray-500 mt-1">
                        👤 {job.tecnico.nome} {job.tecnico.cognome}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      job.stato === 'IN_CORSO' ? 'bg-blue-100 text-blue-800' :
                      job.stato === 'COMPLETATO' ? 'bg-green-100 text-green-800' :
                      job.stato === 'PIANIFICATO' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job.stato}
                    </span>
                    {job.priorita === 'URGENTE' && (
                      <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        URGENTE
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500">Nessun lavoro trovato</p>
            <Link href="/jobs/new" className="btn btn-primary mt-4 inline-block">
              Crea il primo lavoro
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

