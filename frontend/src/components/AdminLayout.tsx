'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { adminAuth } from '@/lib/adminAuth';
import ImpersonationBanner from './ImpersonationBanner';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!adminAuth.isSuperAdmin()) {
      router.push('/admin/login');
    }
  }, [router]);

  if (!adminAuth.isSuperAdmin()) {
    return null;
  }

  const admin = adminAuth.getAdmin();

  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/companies', label: 'Aziende', icon: '🏢' },
    { href: '/admin/users', label: 'Utenti', icon: '👥' },
    { href: '/admin/subscriptions', label: 'Abbonamenti', icon: '💳' },
    { href: '/admin/payments', label: 'Pagamenti', icon: '💵' },
    { href: '/admin/reports', label: 'Report', icon: '📈' },
    { href: '/admin/audit-logs', label: 'Audit Log', icon: '📋' },
    { href: '/admin/settings', label: 'Impostazioni', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`bg-white shadow-lg transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h2 className="text-xl font-bold text-gray-900">IdroDesk Admin</h2>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              {sidebarOpen ? '←' : '→'}
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
              {admin?.nome?.[0]?.toUpperCase() || 'A'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {admin?.nome} {admin?.cognome}
                </p>
                <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              adminAuth.logout();
              router.push('/admin/login');
            }}
            className={`w-full btn btn-secondary text-sm flex items-center justify-center gap-2 transition-all hover:bg-gray-300 ${!sidebarOpen ? 'p-2' : ''}`}
          >
            {sidebarOpen ? (
              <>
                <span>🚪</span>
                <span>Esci</span>
              </>
            ) : (
              <span>🚪</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ImpersonationBanner />
        {children}
      </div>
    </div>
  );
}

