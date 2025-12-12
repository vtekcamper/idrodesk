'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import AdminLayout from '@/components/AdminLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Badge } from '@/components/ui-kit/badge';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import { Mail, Eye, RefreshCw, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminEmailTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['admin', 'email-templates'],
    queryFn: async () => {
      const response = await adminApi.getEmailTemplates();
      return response.data;
    },
  });

  const handlePreview = async (templateType: string) => {
    setLoadingPreview(true);
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
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <PageHeader
          title="Template Email"
          description="Gestisci e visualizza i template email del sistema"
          breadcrumb={[{ label: 'Admin' }, { label: 'Template Email' }]}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista Template */}
            <Card>
              <CardHeader>
                <CardTitle>Template Disponibili</CardTitle>
                <CardDescription>Seleziona un template per visualizzare l'anteprima</CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(templates) && templates.length > 0 ? (
                  <div className="space-y-3">
                    {templates.map((template: any) => (
                      <div
                        key={template.type}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${
                          selectedTemplate === template.type
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/50 hover:bg-accent/50'
                        }`}
                        onClick={() => handlePreview(template.type)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-base">{template.name}</h3>
                          {selectedTemplate === template.type && (
                            <Badge variant="default">Selezionato</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                        {Array.isArray(template.variables) && template.variables.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Variabili disponibili:</p>
                            <div className="flex flex-wrap gap-1">
                              {template.variables.map((varName: string) => (
                                <Badge key={varName} variant="outline" className="text-xs">
                                  {varName}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<FileText className="h-12 w-12" />}
                    title="Nessun template disponibile"
                    description="I template email appariranno qui"
                  />
                )}
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Anteprima</CardTitle>
                <CardDescription>
                  {selectedTemplate
                    ? 'Visualizza e personalizza l\'anteprima del template'
                    : 'Seleziona un template per visualizzare l\'anteprima'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedTemplate ? (
                  <div className="space-y-4">
                    {/* Dati di esempio personalizzabili */}
                    <Card className="bg-muted/50">
                      <CardHeader>
                            <CardTitle className="text-base">Dati di Esempio</CardTitle>
                          </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-2">Nome Azienda</label>
                          <Input
                            type="text"
                            value={previewData.companyName || 'Esempio Azienda S.r.l.'}
                            onChange={(e) =>
                              setPreviewData({ ...previewData, companyName: e.target.value })
                            }
                          />
                        </div>
                        {selectedTemplate === 'SUBSCRIPTION_EXPIRING' && (
                          <div>
                            <label className="block text-sm font-medium mb-2">Giorni alla Scadenza</label>
                            <Input
                              type="number"
                              value={previewData.daysUntilExpiry || 7}
                              onChange={(e) =>
                                setPreviewData({
                                  ...previewData,
                                  daysUntilExpiry: parseInt(e.target.value) || 7,
                                })
                              }
                            />
                          </div>
                        )}
                        {(selectedTemplate === 'PAYMENT_SUCCESS' ||
                          selectedTemplate === 'PAYMENT_FAILED') && (
                          <div>
                            <label className="block text-sm font-medium mb-2">Importo (€)</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={previewData.amount || 29.99}
                              onChange={(e) =>
                                setPreviewData({
                                  ...previewData,
                                  amount: parseFloat(e.target.value) || 29.99,
                                })
                              }
                            />
                          </div>
                        )}
                        <Button
                          onClick={() => handlePreview(selectedTemplate)}
                          disabled={loadingPreview}
                          className="w-full"
                        >
                          {loadingPreview ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Aggiornamento...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Aggiorna Preview
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* HTML Preview */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <CardTitle className="text-base">Anteprima Email</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        {loadingPreview ? (
                          <div className="p-8 flex items-center justify-center">
                            <Skeleton className="h-64 w-full" />
                          </div>
                        ) : previewHtml ? (
                          <div className="border-t">
                            <div
                              className="p-6 bg-background"
                              dangerouslySetInnerHTML={{ __html: previewHtml }}
                            />
                          </div>
                        ) : (
                          <div className="p-8 text-center text-muted-foreground">
                            <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Nessuna anteprima disponibile</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <EmptyState
                    icon={<Eye className="h-12 w-12" />}
                    title="Nessun template selezionato"
                    description="Seleziona un template dalla lista per visualizzare l'anteprima"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
