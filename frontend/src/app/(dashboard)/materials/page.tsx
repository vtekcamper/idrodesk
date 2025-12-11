'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { materialsApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

export default function MaterialsPage() {
  const [search, setSearch] = useState('');

  const { data: materials, isLoading } = useQuery({
    queryKey: ['materials', search],
    queryFn: () => materialsApi.getAll({ search }),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Materiali</h1>
            <p className="text-gray-600">Gestisci il tuo magazzino</p>
          </div>
          <button className="btn btn-primary">+ Nuovo Materiale</button>
        </div>

        <div>
          <input
            type="text"
            placeholder="Cerca materiale..."
            className="input max-w-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <p className="text-gray-500">Caricamento...</p>
        ) : materials && materials.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Codice</th>
                  <th className="border p-2 text-left">Descrizione</th>
                  <th className="border p-2 text-left">Categoria</th>
                  <th className="border p-2 text-right">Prezzo Vendita</th>
                  <th className="border p-2 text-right">Giacenza</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material: any) => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="border p-2 font-mono">{material.codice}</td>
                    <td className="border p-2">{material.descrizione}</td>
                    <td className="border p-2">{material.categoria || '-'}</td>
                    <td className="border p-2 text-right">
                      €{Number(material.prezzoVendita).toFixed(2)}
                    </td>
                    <td className="border p-2 text-right">{material.giacenza}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500">Nessun materiale trovato</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

