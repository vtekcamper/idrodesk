'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui-kit/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Button } from '@/components/ui-kit/button';
import { StatusBadge } from '@/components/ui-kit/status-badge';
import { Badge } from '@/components/ui-kit/badge';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { EmptyState } from '@/components/ui-kit/empty-state';
import {
  Phone,
  Mail,
  MapPin,
  Wrench,
  FileText,
  Plus,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const response = await clientsApi.getById(clientId);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={<AlertCircle className="h-12 w-12" />}
          title="Cliente non trovato"
          description="Il cliente richiesto non esiste o non hai i permessi per visualizzarlo"
          action={{
            label: 'Torna ai clienti',
            onClick: () => router.push('/clients'),
          }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={`${client.nome} ${client.cognome || ''}`}
          description="Dettagli cliente e storico"
          breadcrumb={[
            { label: 'Clienti', href: '/clients' },
            { label: `${client.nome} ${client.cognome || ''}` },
          ]}
          action={{
            label: 'Nuovo Intervento',
            onClick: () => router.push(`/jobs/new?clientId=${clientId}`),
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonna Principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info Cliente */}
            <Card>
              <CardHeader>
                <CardTitle>Informazioni Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {client.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${client.telefono}`}
                        className="text-primary hover:underline"
                      >
                        {client.telefono}
                      </a>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${client.email}`}
                        className="text-primary hover:underline"
                      >
                        {client.email}
                      </a>
                    </div>
                  )}
                  {(client.indirizzo || client.citta) && (
                    <div className="flex items-start gap-2 md:col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        {client.indirizzo && <p>{client.indirizzo}</p>}
                        {client.citta && (
                          <p className="text-sm text-muted-foreground">
                            {client.citta} {client.cap && `- ${client.cap}`}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {client.note && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Note</p>
                    <p className="text-sm whitespace-pre-wrap">{client.note}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Siti (se presenti) */}
            {client.sites && client.sites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Siti</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {client.sites.map((site: any) => (
                      <div key={site.id} className="p-3 border rounded-xl">
                        <p className="font-medium">{site.descrizione}</p>
                        {site.indirizzo && (
                          <p className="text-sm text-muted-foreground">{site.indirizzo}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interventi */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Interventi</CardTitle>
                  <Link href={`/jobs/new?clientId=${clientId}`}>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuovo
                    </Button>
                  </Link>
                </div>
                <CardDescription>
                  Storico interventi per questo cliente ({client._count?.jobs || 0} totali)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {client.jobs && client.jobs.length > 0 ? (
                  <div className="space-y-2">
                    {client.jobs.map((job: any) => (
                      <Link key={job.id} href={`/jobs/${job.id}`}>
                        <div className="p-3 border rounded-xl hover:bg-accent transition-colors cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{job.titolo}</p>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                {job.dataProgrammata && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(job.dataProgrammata).toLocaleDateString('it-IT')}
                                  </div>
                                )}
                                {job.completedAt && (
                                  <Badge variant="success" className="text-xs">
                                    Completato
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <StatusBadge status={job.stato} type="job" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Wrench className="h-8 w-8" />}
                    title="Nessun intervento"
                    description="Non ci sono ancora interventi per questo cliente"
                    action={{
                      label: 'Crea Intervento',
                      onClick: () => router.push(`/jobs/new?clientId=${clientId}`),
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Preventivi */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Preventivi</CardTitle>
                  <Link href={`/quotes/new?clientId=${clientId}`}>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuovo
                    </Button>
                  </Link>
                </div>
                <CardDescription>
                  Storico preventivi per questo cliente ({client._count?.quotes || 0} totali)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {client.quotes && client.quotes.length > 0 ? (
                  <div className="space-y-2">
                    {client.quotes.map((quote: any) => (
                      <Link key={quote.id} href={`/quotes/${quote.id}`}>
                        <div className="p-3 border rounded-xl hover:bg-accent transition-colors cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">
                                Preventivo {quote.numeroPreventivo}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(quote.data).toLocaleDateString('it-IT')}
                                </div>
                                <span className="font-semibold">
                                  €{Number(quote.totaleLordo).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <StatusBadge status={quote.stato} type="quote" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<FileText className="h-8 w-8" />}
                    title="Nessun preventivo"
                    description="Non ci sono ancora preventivi per questo cliente"
                    action={{
                      label: 'Crea Preventivo',
                      onClick: () => router.push(`/quotes/new?clientId=${clientId}`),
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistiche */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiche</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interventi</span>
                  <span className="font-semibold">{client._count?.jobs || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preventivi</span>
                  <span className="font-semibold">{client._count?.quotes || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Azioni Rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/jobs/new?clientId=${clientId}`} className="block">
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo Intervento
                  </Button>
                </Link>
                <Link href={`/quotes/new?clientId=${clientId}`} className="block">
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo Preventivo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

