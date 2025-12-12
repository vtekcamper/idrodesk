'use client';

import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardPage() {
  const today = new Date().toISOString().split('T')[0];

  const { data: jobsToday, isLoading: loadingToday } = useQuery({
    queryKey: ['jobs', 'today', today],
    queryFn: async () => {
      const response = await jobsApi.getAll({ data: today });
      return response.data;
    },
  });

  const { data: jobsUpcoming, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['jobs', 'upcoming'],
    queryFn: async () => {
      const response = await jobsApi.getAll({ stato: 'PIANIFICATO' });
      return response.data;
    },
  });

  const { data: jobsInProgress, isLoading: loadingInProgress } = useQuery({
    queryKey: ['jobs', 'in-progress'],
    queryFn: async () => {
      const response = await jobsApi.getAll({ stato: 'IN_CORSO' });
      return response.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Panoramica dei tuoi lavori</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Oggi</h3>
            <p className="text-2xl font-bold mt-2">
              {loadingToday ? '...' : jobsToday?.length || 0}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">In Corso</h3>
            <p className="text-2xl font-bold mt-2">
              {loadingInProgress ? '...' : jobsInProgress?.length || 0}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Pianificati</h3>
            <p className="text-2xl font-bold mt-2">
              {loadingUpcoming ? '...' : jobsUpcoming?.length || 0}
            </p>
          </div>
        </div>

        {/* Lavori di oggi */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Lavori di Oggi</h2>
            <Link href="/jobs" className="text-sm text-primary-600 hover:text-primary-700">
              Vedi tutti →
            </Link>
          </div>
          {loadingToday ? (
            <p className="text-gray-500">Caricamento...</p>
          ) : jobsToday && jobsToday.length > 0 ? (
            <div className="space-y-3">
              {jobsToday.slice(0, 5).map((job: any) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{job.titolo}</p>
                      <p className="text-sm text-gray-600">
                        {job.client.nome} {job.client.cognome}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      job.stato === 'IN_CORSO' ? 'bg-blue-100 text-blue-800' :
                      job.stato === 'COMPLETATO' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job.stato}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nessun lavoro programmato per oggi</p>
          )}
        </div>

        {/* Prossimi lavori */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Prossimi Lavori</h2>
            <Link href="/jobs" className="text-sm text-primary-600 hover:text-primary-700">
              Vedi tutti →
            </Link>
          </div>
          {loadingUpcoming ? (
            <p className="text-gray-500">Caricamento...</p>
          ) : jobsUpcoming && jobsUpcoming.length > 0 ? (
            <div className="space-y-3">
              {jobsUpcoming.slice(0, 5).map((job: any) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{job.titolo}</p>
                      <p className="text-sm text-gray-600">
                        {job.client.nome} {job.client.cognome}
                        {job.dataProgrammata && (
                          <> • {new Date(job.dataProgrammata).toLocaleDateString('it-IT')}</>
                        )}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                      {job.stato}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nessun lavoro pianificato</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

