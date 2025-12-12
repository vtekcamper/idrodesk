'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { adminAuth } from '@/lib/adminAuth';
import ImpersonationBanner from './ImpersonationBanner';
import { useTheme } from '@/components/theme-provider';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  DollarSign,
  BarChart3,
  FileText,
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui-kit/button';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

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
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/companies', label: 'Aziende', icon: Building2 },
    { href: '/admin/users', label: 'Utenti', icon: Users },
    { href: '/admin/subscriptions', label: 'Abbonamenti', icon: CreditCard },
    { href: '/admin/payments', label: 'Pagamenti', icon: DollarSign },
    { href: '/admin/reports', label: 'Report', icon: BarChart3 },
    { href: '/admin/audit-logs', label: 'Audit Log', icon: FileText },
    { href: '/admin/emails/templates', label: 'Template Email', icon: Mail },
    { href: '/admin/settings', label: 'Impostazioni', icon: Settings },
  ];

  const handleLogout = () => {
    adminAuth.logout();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b flex items-center justify-between p-4">
        <h2 className="text-lg font-bold">IdroDesk Admin</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-card border-r transition-all duration-300 fixed lg:static inset-y-0 z-40',
          sidebarOpen ? 'w-64' : 'w-20',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-4 border-b flex items-center justify-between h-16 lg:h-auto">
          {sidebarOpen && (
            <h2 className="text-xl font-bold">IdroDesk Admin</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full justify-start"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 mr-2" />
                {sidebarOpen && <span>Light Mode</span>}
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 mr-2" />
                {sidebarOpen && <span>Dark Mode</span>}
              </>
            )}
          </Button>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
              {admin?.nome?.[0]?.toUpperCase() || 'A'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {admin?.nome} {admin?.cognome}
                </p>
                <p className="text-xs text-muted-foreground truncate">{admin?.email}</p>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {sidebarOpen && <span>Esci</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <ImpersonationBanner />
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
