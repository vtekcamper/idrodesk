'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { cn } from '@/lib/utils';
import {
  Building2,
  FileText,
  Users,
  CreditCard,
  Settings,
  Bell,
  Shield,
} from 'lucide-react';

const settingsTabs = [
  { id: 'company', label: 'Azienda', href: '/settings/company', icon: Building2 },
  { id: 'documents', label: 'Documenti', href: '/settings/documents', icon: FileText },
  { id: 'users', label: 'Utenti & Ruoli', href: '/settings/users', icon: Users },
  { id: 'billing', label: 'Abbonamento', href: '/settings/billing', icon: CreditCard },
  { id: 'preferences', label: 'Preferenze', href: '/settings/preferences', icon: Settings },
  { id: 'notifications', label: 'Notifiche', href: '/settings/notifications', icon: Bell },
  { id: 'security', label: 'Sicurezza', href: '/settings/security', icon: Shield },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Impostazioni</h1>
          <p className="text-muted-foreground mt-2">
            Gestisci le impostazioni della tua azienda
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 overflow-x-auto">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href || pathname?.startsWith(tab.href + '/');
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={cn(
                    'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </DashboardLayout>
  );
}

