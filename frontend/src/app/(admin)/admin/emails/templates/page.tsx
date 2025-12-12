'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';

export const dynamic = 'force-dynamic';

export default function AdminEmailTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [previewHtml, setPreviewHtml] = useState<string>('');

  const { data: templates, isLoading } = useQuery({
    queryKey: ['admin', 'email-templates'],
    queryFn: async () => {
      const response = await adminApi.getEmailTemplates();
      return response.data;
    },
  });

  const handlePreview = async (templateType: string) => {
    try {
      // Dati di esempio per preview
      const sampleData: Record<string, any> = {
        companyName: previewData.companyName || 'Esempio Azienda S.r.l.',
        ragioneSociale: previewData.companyName || 'Esempio Azienda S.r.l.',
        daysUntilExpiry: previewData.daysUntilExpiry || 7,
        expiryDate: previewData.expiryDate || new Date().toLocaleDateString('it-IT'),
        dataScadenza: previewData.dataScadenza || new Date(),
        amount: previewData.amount || 29.99,
        errorMessage: previewData.errorMessage || 'Carta scaduta',
        newPlan: previewData.newPlan || 'PRO',
        oldPlan: previewData.oldPlan || 'BASIC',
      };

      const response = await adminApi.previewEmailTemplate({
        type: templateType,
        templateData: sampleData,
      });

      setPreviewHtml(response.data.html);
      setSelectedTemplate(templateType);
    } catch (error: any) {
      console.error('Preview error:', error);
      alert(`Errore: ${error.response?.data?.error || error.message}`);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">Caricamento...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Template Email</h1>
            <p className="text-sm text-gray-600">Gestisci e visualizza i template email del sistema</p>
          </div>
        </header>

        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista Template */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Template Disponibili</h2>
              <div className="space-y-2">
                {templates?.map((template: any) => (
                  <div
                    key={template.type}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate === template.type
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handlePreview(template.type)}
                  >
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Variabili:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.variables.map((varName: string) => (
                          <span
                            key={varName}
                            className="px-2 py-1 text-xs bg-gray-100 rounded"
                          >
                            {varName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Preview</h2>
              {selectedTemplate ? (
                <div>
                  {/* Dati di esempio personalizzabili */}
                  <div className="mb-4 p-4 bg-gray-50 rounded">
                    <h3 className="text-sm font-semibold mb-2">Dati di Esempio</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Nome Azienda</label>
                        <input
                          type="text"
                          className="input text-sm"
                          value={previewData.companyName || 'Esempio Azienda S.r.l.'}
                          onChange={(e) =>
                            setPreviewData({ ...previewData, companyName: e.target.value })
                          }
                        />
                      </div>
                      {selectedTemplate === 'SUBSCRIPTION_EXPIRING' && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Giorni alla Scadenza</label>
                          <input
                            type="number"
                            className="input text-sm"
                            value={previewData.daysUntilExpiry || 7}
                            onChange={(e) =>
                              setPreviewData({
                                ...previewData,
                                daysUntilExpiry: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                      )}
                      {(selectedTemplate === 'PAYMENT_SUCCESS' ||
                        selectedTemplate === 'PAYMENT_FAILED') && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Importo</label>
                          <input
                            type="number"
                            step="0.01"
                            className="input text-sm"
                            value={previewData.amount || 29.99}
                            onChange={(e) =>
                              setPreviewData({
                                ...previewData,
                                amount: parseFloat(e.target.value),
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handlePreview(selectedTemplate)}
                      className="btn btn-primary text-sm mt-2"
                    >
                      Aggiorna Preview
                    </button>
                  </div>

                  {/* HTML Preview */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 text-xs font-semibold">
                      Anteprima Email
                    </div>
                    <div
                      className="p-4 bg-white"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Seleziona un template per visualizzare l'anteprima</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AdminLayout>
  );
}

