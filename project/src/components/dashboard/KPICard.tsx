import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { useEffect } from 'react';
import { clsx } from '../../lib/utils';
import { useError, logError } from '../../hooks/useError';
import { ErrorUI } from '../ui/ErrorUI';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'slate';
  loading?: boolean;
}

const colorSchemes = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400',
    accent: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-100 dark:border-blue-800/30',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'bg-emerald-100 dark:bg-emerald-800/40 text-emerald-600 dark:text-emerald-400',
    accent: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-800/30',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'bg-amber-100 dark:bg-amber-800/40 text-amber-600 dark:text-amber-400',
    accent: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-100 dark:border-amber-800/30',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400',
    accent: 'text-red-600 dark:text-red-400',
    border: 'border-red-100 dark:border-red-800/30',
  },
  slate: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    icon: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    accent: 'text-slate-600 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

export function KPICard({ title, value, subtitle, icon: Icon, trend, trendLabel, color = 'blue', loading }: KPICardProps) {
  const scheme = colorSchemes[color];
  const { error, setError, clearError } = useError();

  function validateProps(): string | null {
    if (!title || typeof title !== 'string') return 'Invalid KPI title';
    if (typeof value !== 'string' && typeof value !== 'number') return 'Invalid KPI value';
    if (typeof color !== 'string' || !(color in colorSchemes)) return 'Invalid KPI color';
    if (trend !== undefined && (typeof trend !== 'number' || !Number.isFinite(trend))) return 'Invalid KPI trend value';
    if (!Icon || (typeof Icon !== 'function' && typeof Icon !== 'object')) return 'Invalid KPI icon';
    return null;
  }

  useEffect(() => {
    try {
      const err = validateProps();
      if (err) setError(err);
      else clearError();
    } catch (err) {
      // Ensure unexpected validation exceptions are logged and surfaced
      const message = err instanceof Error ? err.message : 'KPI validation failed';
      logError(err as Error, { title, value, color, trend });
      setError(message);
    }
  }, [title, value, color, trend, Icon, setError, clearError]);

  if (error) {
    return (
      <div>
        <ErrorUI message={error} onDismiss={clearError} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-4" />
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
      </div>
    );
  }

  return (
    <div className={clsx(
      'bg-white dark:bg-slate-800 rounded-2xl border p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
      scheme.border
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center', scheme.icon)}>
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          <div className={clsx(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            trend >= 0
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          )}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <p className={clsx('text-2xl font-bold', scheme.accent)}>{value}</p>
        {(subtitle || trendLabel) && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle || trendLabel}</p>
        )}
      </div>
    </div>
  );
}
