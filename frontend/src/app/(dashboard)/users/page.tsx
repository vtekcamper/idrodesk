'use client';

import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { auth } from '@/lib/auth';

export default function UsersPage() {
  const user = auth.getUser();

  // Solo owner può vedere questa pagina
  if (user?.ruolo !== 'OWNER') {
    return (
      <DashboardLayout>
        <div className="card">
          <p className="text-red-600">Accesso negato. Solo il proprietario può gestire gli utenti.</p>
        </div>
      </DashboardLayout>
    );
  }

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Utenti</h1>
            <p className="text-gray-600">Gestisci gli utenti della tua azienda</p>
          </div>
          <button className="btn btn-primary">+ Nuovo Utente</button>
        </div>

        {isLoading ? (
          <p className="text-gray-500">Caricamento...</p>
        ) : users && users.length > 0 ? (
          <div className="card overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Nome</th>
                  <th className="border p-2 text-left">Email</th>
                  <th className="border p-2 text-left">Ruolo</th>
                  <th className="border p-2 text-left">Stato</th>
                  <th className="border p-2 text-left">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="border p-2">
                      {u.nome} {u.cognome}
                    </td>
                    <td className="border p-2">{u.email}</td>
                    <td className="border p-2">{u.ruolo}</td>
                    <td className="border p-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        u.attivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.attivo ? 'Attivo' : 'Disattivo'}
                      </span>
                    </td>
                    <td className="border p-2">
                      <button className="text-primary-600 hover:text-primary-700 text-sm">
                        Modifica
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500">Nessun utente trovato</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

