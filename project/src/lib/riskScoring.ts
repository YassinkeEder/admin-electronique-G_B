import { Project } from '../types';

export type RiskLevel = 'critique' | 'élevé' | 'modéré' | 'faible';

export interface ProjectRiskScore {
  projectId: string;
  projectName: string;
  region: string;
  sector: string;
  riskLevel: RiskLevel;
  score: number;
  reasons: string[];
  budgetDeviation: number;
  delayDays: number;
  progressGap: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const formatReasonPercent = (value: number): string =>
  `${value > 0 ? '+' : ''}${Math.round(value)}%`;

export function computeRiskScore(project: Project): ProjectRiskScore {
  const now = new Date();
  const startDate = new Date(project.start_date);
  const endDate = new Date(project.end_date);

  const budgetDeviation = project.budget_xof > 0
    ? Math.round((project.spent_xof / project.budget_xof - project.progress / 100) * 100)
    : 0;

  const delayDays = project.status !== 'COMPLETED' && endDate.getTime() < now.getTime()
    ? Math.round((now.getTime() - endDate.getTime()) / 86400000)
    : 0;

  const totalDuration = Math.max(1, endDate.getTime() - startDate.getTime());
  const timeElapsed = clamp((now.getTime() - startDate.getTime()) / totalDuration, 0, 1);
  const progressGap = Math.round(timeElapsed * 100 - project.progress);

  const score = clamp(
    Math.round(budgetDeviation * 0.4 + delayDays * 0.5 + progressGap * 0.1),
    0,
    100,
  );

  const riskLevel: RiskLevel = score >= 70
    ? 'critique'
    : score >= 45
      ? 'élevé'
      : score >= 20
        ? 'modéré'
        : 'faible';

  const reasons: string[] = [];
  if (budgetDeviation > 10) {
    reasons.push(`Dépassement budget de ${formatReasonPercent(budgetDeviation)}`);
  }
  if (delayDays > 0) {
    reasons.push(`Retard de ${delayDays} jour${delayDays > 1 ? 's' : ''}`);
  }
  if (progressGap > 20) {
    reasons.push(`Avancement en retard de ${progressGap}% sur le planning`);
  }

  return {
    projectId: project.id,
    projectName: project.name,
    region: project.region,
    sector: project.sector,
    riskLevel,
    score,
    reasons,
    budgetDeviation,
    delayDays,
    progressGap,
  };
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  critique: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  élevé: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  modéré: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  faible: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export const RISK_ICONS: Record<RiskLevel, string> = {
  critique: '🔴',
  élevé: '🟠',
  modéré: '🟡',
  faible: '🟢',
};
