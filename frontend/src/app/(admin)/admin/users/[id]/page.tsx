'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';
import { useState } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.id as string;
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    ruolo: '',
    attivo: true,
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: async () => {
      const response = await adminApi.getUser(userId);
      return response.data;
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowEditModal(false);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (attivo: boolean) => adminApi.toggleUserStatus(userId, { attivo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">Caricamento...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">Utente non trovato</div>
        </div>
      </AdminLayout>
    );
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserMutation.mutate(editData);
  };

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <button
              onClick={() => router.back()}
              className="text-primary-600 hover:text-primary-700 mb-2 inline-block"
            >
              ← Indietro
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.nome} {user.cognome}
            </h1>
          </div>
        </header>

        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Info Utente */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Informazioni Utente</h2>
                <button
                  onClick={() => {
                    setEditData({
                      nome: user.nome,
                      cognome: user.cognome,
                      email: user.email,
                      telefono: user.telefono || '',
                      ruolo: user.ruolo,
                      attivo: user.attivo,
                    });
                    setShowEditModal(true);
                  }}
                  className="btn btn-secondary text-sm"
                >
                  Modifica
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium">{user.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cognome</p>
                  <p className="font-medium">{user.cognome}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                {user.telefono && (
                  <div>
                    <p className="text-sm text-gray-500">Telefono</p>
                    <p className="font-medium">{user.telefono}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Ruolo</p>
                  <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                    {user.ruolo}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stato</p>
                  <span className={`px-2 py-1 text-xs rounded ${
                    user.attivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.attivo ? 'Attivo' : 'Inattivo'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data Registrazione</p>
                  <p className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString('it-IT')}
                  </p>
                </div>
              </div>
            </div>

            {/* Azienda */}
            {user.company && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Azienda</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Ragione Sociale</p>
                    <Link
                      href={`/admin/companies/${user.company.id}`}
                      className="font-medium text-primary-600 hover:text-primary-700"
                    >
                      {user.company.ragioneSociale}
                    </Link>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Piano</p>
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                      {user.company.pianoAbbonamento}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Stato Abbonamento</p>
                    <span className={`px-2 py-1 text-xs rounded ${
                      user.company.abbonamentoAttivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.company.abbonamentoAttivo ? 'Attivo' : 'Inattivo'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Statistiche */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Statistiche</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Lavori Assegnati</p>
                  <p className="font-medium text-2xl">{user._count?.jobsAssegnati || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Checklist Compilate</p>
                  <p className="font-medium text-2xl">{user._count?.jobChecklists || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">File Caricati</p>
                  <p className="font-medium text-2xl">{user._count?.attachments || 0}</p>
                </div>
              </div>
            </div>

            {/* Azioni */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Azioni</h2>
              <div className="space-y-2">
                {user.companyId && !user.isSuperAdmin && (
                  <button
                    onClick={async () => {
                      if (confirm(`Vuoi impersonare ${user.nome} ${user.cognome}?`)) {
                        try {
                          const response = await adminApi.impersonateUser(user.id);
                          const { accessToken, user: impersonatedUser } = response.data;
                          
                          // Aggiorna token e user
                          const { apiClient } = await import('@/lib/api');
                          apiClient.setToken(accessToken);
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('accessToken', accessToken);
                            localStorage.setItem('user', JSON.stringify(impersonatedUser));
                            localStorage.setItem('isImpersonated', 'true');
                            localStorage.setItem('company', JSON.stringify(impersonatedUser.company));
                            // Redirect alla dashboard tenant
                            router.push('/dashboard');
                          }
                        } catch (error: any) {
                          alert(`Errore: ${error.response?.data?.error || error.message}`);
                        }
                      }
                    }}
                    className="w-full btn btn-primary"
                  >
                    👤 Impersona Utente
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm(`Sei sicuro di ${user.attivo ? 'disattivare' : 'attivare'} questo utente?`)) {
                      toggleStatusMutation.mutate(!user.attivo);
                    }
                  }}
                  className={`w-full btn ${user.attivo ? 'btn-danger' : 'btn-primary'}`}
                >
                  {user.attivo ? 'Disattiva Utente' : 'Attiva Utente'}
                </button>
              </div>
            </div>
          </div>

          {/* Lavori Recenti */}
          {user.jobsAssegnati && user.jobsAssegnati.length > 0 && (
            <div className="card mt-6">
              <h2 className="text-lg font-semibold mb-4">Lavori Recenti</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-3 text-left">Titolo</th>
                      <th className="border p-3 text-left">Stato</th>
                      <th className="border p-3 text-left">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.jobsAssegnati.map((job: any) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="border p-3">{job.titolo}</td>
                        <td className="border p-3">
                          <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                            {job.stato}
                          </span>
                        </td>
                        <td className="border p-3 text-sm text-gray-600">
                          {new Date(job.createdAt).toLocaleDateString('it-IT')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal Modifica */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Modifica Utente</h3>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      className="input"
                      value={editData.nome}
                      onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cognome</label>
                    <input
                      type="text"
                      className="input"
                      value={editData.cognome}
                      onChange={(e) => setEditData({ ...editData, cognome: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="input"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                    <input
                      type="tel"
                      className="input"
                      value={editData.telefono}
                      onChange={(e) => setEditData({ ...editData, telefono: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
                    <select
                      className="input"
                      value={editData.ruolo}
                      onChange={(e) => setEditData({ ...editData, ruolo: e.target.value })}
                      required
                    >
                      <option value="OWNER">Owner</option>
                      <option value="TECNICO">Tecnico</option>
                      <option value="BACKOFFICE">Backoffice</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editData.attivo}
                        onChange={(e) => setEditData({ ...editData, attivo: e.target.checked })}
                      />
                      <span className="text-sm">Utente attivo</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary flex-1">
                      Salva
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="btn btn-secondary flex-1"
                    >
                      Annulla
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </AdminLayout>
  );
}

