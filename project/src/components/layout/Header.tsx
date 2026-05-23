import { Sun, Moon, LogOut, Languages } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { NotificationBell } from './NotificationBell';
import { clsx } from '../../lib/utils';

interface HeaderProps {
  sidebarCollapsed: boolean;
  title: string;
}

export function Header({ sidebarCollapsed, title }: HeaderProps) {
  const { signOut, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale } = useI18n();

  return (
    <header className={clsx(
      'fixed top-0 right-0 z-30 h-16',
      'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md',
      'border-b border-slate-200 dark:border-slate-700/50',
      'flex items-center justify-between px-6 transition-all duration-300',
      sidebarCollapsed ? 'left-16' : 'left-64'
    )}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Temps réel</span>
        </div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white hidden sm:block">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setLocale(locale === 'fr' ? 'pt' : 'fr')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Change language"
        >
          <Languages size={16} />
          <span className="uppercase text-xs">{locale}</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <NotificationBell />

        {profile && (
          <div className="flex items-center gap-2 pl-2 ml-2 border-l border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {(profile.full_name || profile.email)[0].toUpperCase()}
              </span>
            </div>
            <button
              onClick={signOut}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Déconnexion"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
