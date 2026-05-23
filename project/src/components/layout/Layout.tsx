import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { clsx } from '../../lib/utils';
import { useI18n } from '../../contexts/I18nContext';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'nav.dashboard',
  '/projects': 'nav.projects',
  '/tasks': 'nav.tasks',
  '/bi': 'nav.bi',
  '/admin': 'nav.admin',
};

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { t } = useI18n();

  const titleKey = Object.keys(PAGE_TITLES).find(k => location.pathname.startsWith(k)) || '/dashboard';
  const title = t(PAGE_TITLES[titleKey] || 'nav.dashboard');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <Header sidebarCollapsed={collapsed} title={title} />
      <main className={clsx(
        'pt-16 min-h-screen transition-all duration-300',
        collapsed ? 'pl-16' : 'pl-64'
      )}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
