import { ProjectStatus, TaskPriority, TaskStatus } from '../types';

type ClassValue =
  | string
  | undefined
  | false
  | null
  | Record<string, boolean | undefined | null>;

export function formatXOF(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMillions(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} Mrd`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} M`;
  return formatXOF(amount);
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(dateStr));
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(endDate: string, status: ProjectStatus): boolean {
  if (status === 'COMPLETED' || status === 'CANCELLED') return false;
  return getDaysRemaining(endDate) < 0;
}

export function getBudgetUsage(budget: number, spent: number): number {
  if (budget === 0) return 0;
  return Math.min((spent / budget) * 100, 100);
}

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  PLANNED: 'bg-blue-100 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  SUSPENDED: 'bg-orange-100 text-orange-700 border-orange-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

export const STATUS_DOT_COLORS: Record<ProjectStatus, string> = {
  PLANNED: 'bg-blue-500',
  IN_PROGRESS: 'bg-amber-500',
  COMPLETED: 'bg-emerald-500',
  SUSPENDED: 'bg-orange-500',
  CANCELLED: 'bg-red-500',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  REVIEW: 'bg-amber-100 text-amber-700',
  DONE: 'bg-emerald-100 text-emerald-700',
  BLOCKED: 'bg-red-100 text-red-700',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

export const SECTOR_ICONS: Record<string, string> = {
  Health: '🏥',
  Education: '📚',
  Infrastructure: '🏗️',
  Agriculture: '🌾',
  Energy: '⚡',
  ICT: '💻',
  Finance: '💰',
  Governance: '🏛️',
  Environment: '🌿',
};

export const CHART_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

export function clsx(...classes: ClassValue[]): string {
  return classes
    .flatMap((value) => {
      if (!value) {
        return [];
      }

      if (typeof value === 'string') {
        return [value];
      }

      return Object.entries(value)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([className]) => className);
    })
    .join(' ');
}
