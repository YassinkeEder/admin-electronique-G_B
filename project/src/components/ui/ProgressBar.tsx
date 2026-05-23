import { clsx } from '../../lib/utils';

interface ProgressBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'amber' | 'red';
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

function getColor(value: number): 'red' | 'amber' | 'blue' | 'green' {
  if (value < 25) return 'red';
  if (value < 50) return 'amber';
  if (value < 75) return 'blue';
  return 'green';
}

export function ProgressBar({ value, className, showLabel = false, size = 'md', color }: ProgressBarProps) {
  const actualColor = color || getColor(value);
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className={clsx('flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500', colorClasses[actualColor])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-9 text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
}
