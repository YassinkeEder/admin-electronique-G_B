import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, CheckSquare, BarChart3, Shield, Globe, CalendarDays, ChevronLeft, ChevronRight, Square as LogSquare, AlertTriangle } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from '../../lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useI18n();
  const { profile } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/projects', icon: FolderOpen, label: t('nav.projects') },
    { to: '/timeline', icon: CalendarDays, label: t('nav.gantt') },
    { to: '/high-risk', icon: AlertTriangle, label: t('nav.highRisk') },
    { to: '/tasks', icon: CheckSquare, label: t('nav.tasks') },
    { to: '/bi', icon: BarChart3, label: t('nav.bi') },
    ...(profile?.role === 'admin' ? [
      { to: '/admin', icon: Shield, label: t('nav.admin') },
      { to: '/audit-logs', icon: LogSquare, label: 'Audit' },
    ] : []),
  ];

  return (
    <aside className={clsx(
      'fixed left-0 top-0 h-full z-40 flex flex-col',
      'bg-slate-900 dark:bg-slate-950 border-r border-slate-700/50',
      'transition-all duration-300 ease-in-out',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700/50">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
              <Globe size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">E-Gov</p>
              <p className="text-slate-400 text-xs leading-tight">Guinée-Bissau</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto">
            <Globe size={16} className="text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className={clsx(
            'p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors',
            collapsed && 'hidden'
          )}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors mx-auto mt-2 rounded-lg"
        >
          <ChevronRight size={16} />
        </button>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && profile && (
        <div className="px-3 py-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {(profile.full_name || profile.email)[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{profile.full_name || profile.email}</p>
              <p className="text-slate-400 text-xs capitalize">{profile.role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
