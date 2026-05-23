// project/src/components/ui/LoadingSpinner.tsx
import { clsx } from '../../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div className={clsx(
      'rounded-full border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 animate-spin',
      sizes[size],
      className
    )} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
      </div>
    </div>
  );
}
