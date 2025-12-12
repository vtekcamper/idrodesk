'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = auth.getUser();
  const company = auth.getCompany();

  const handleLogout = () => {
    auth.logout();
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/jobs', label: 'Lavori', icon: '🔧' },
    { href: '/quotes', label: 'Preventivi', icon: '📄' },
    { href: '/clients', label: 'Clienti', icon: '👥' },
    { href: '/materials', label: 'Materiali', icon: '📦' },
    { href: '/checklists', label: 'Checklist', icon: '✅' },
  ];

  if (user?.ruolo === 'OWNER') {
    navItems.push({ href: '/users', label: 'Utenti', icon: '👤' });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="bg-white shadow-sm lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">IdroDesk</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <span className="text-2xl">☰</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t shadow-lg">
          <nav className="px-2 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  pathname === item.href
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 rounded-lg text-red-600 hover:bg-red-50"
            >
              <span className="mr-3">🚪</span>
              Esci
            </button>
          </nav>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white shadow-sm min-h-screen">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-primary-600">IdroDesk</h1>
            {company && (
              <p className="text-sm text-gray-600 mt-1">{company.ragioneSociale}</p>
            )}
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  pathname === item.href
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">
                  {user?.nome} {user?.cognome}
                </p>
                <p className="text-xs text-gray-500">{user?.ruolo}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full btn btn-secondary text-sm"
            >
              Esci
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-0">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

