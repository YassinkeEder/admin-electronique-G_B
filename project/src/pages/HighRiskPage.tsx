import { useMemo, useState } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingUp, ShieldCheck } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { formatMillions, isOverdue } from '../lib/utils';
import { ProjectRegion, ProjectSector, REGIONS, SECTORS } from '../types';
import { PageLoader } from '../components/ui/LoadingSpinner';

interface RiskRecord {
  id: string;
  name: string;
  region: string;
  sector: string;
  status: string;
  budget: number;
  progress: number;
  predicted: number;
  costDev: number;
  risk: 'Élevé' | 'Moyen' | 'Normal';
  overdue: boolean;
  start_date: string;
  end_date: string;
}

export function HighRiskPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [regionFilter, setRegionFilter] = useState<ProjectRegion | ''>('');
  const [sectorFilter, setSectorFilter] = useState<ProjectSector | ''>('');

  const { projects, loading } = useProjects({ region: regionFilter, sector: sectorFilter });

  const risks = useMemo<RiskRecord[]>(() => projects.map((p) => {
    const start = new Date(p.start_date);
    const end = new Date(p.end_date);
    const now = new Date();
    const duration = Math.max(1, end.getTime() - start.getTime());
    const elapsedRatio = Math.min(1, Math.max(0, (now.getTime() - start.getTime()) / duration));
    const predicted = Math.min(100, Math.max(0, Math.round(
      p.progress + (elapsedRatio > 0 ? (p.progress / elapsedRatio) * (1 - elapsedRatio) : 0)
    )));
    const budgetUsageRate = p.budget_xof > 0 ? p.spent_xof / p.budget_xof : 0;
    const costDev = Math.round(((budgetUsageRate - (p.progress / 100)) * 100) * 10) / 10;
    const overdue = isOverdue(p.end_date, p.status);
    const risk: RiskRecord['risk'] = overdue || costDev > 12 ? 'Élevé'
      : costDev > 6 ? 'Moyen'
      : 'Normal';

    return {
      id: p.id,
      name: p.name,
      region: p.region,
      sector: p.sector,
      status: p.status,
      budget: p.budget_xof,
      progress: p.progress,
      predicted,
      costDev,
      risk,
      overdue,
      start_date: p.start_date,
      end_date: p.end_date,
    };
  }).sort((a, b) => {
    const riskOrder = { 'Élevé': 0, 'Moyen': 1, 'Normal': 2 };
    if (riskOrder[a.risk] !== riskOrder[b.risk]) return riskOrder[a.risk] - riskOrder[b.risk];
    return b.costDev - a.costDev;
  }), [projects]);

  const highRisk = risks.filter((record) => record.risk === 'Élevé');
  const mediumRisk = risks.filter((record) => record.risk === 'Moyen');
  const normalRisk = risks.filter((record) => record.risk === 'Normal');

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Projets à haut risque</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-2xl">
            Visualisez les projets dont le risque est élevé ou moyen selon le budget et les retards.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value as ProjectRegion | '')}
            className="px-3 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="">Toutes régions</option>
            {REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
          </select>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value as ProjectSector | '')}
            className="px-3 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="">Tous secteurs</option>
            {SECTORS.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Risque élevé', value: highRisk.length, icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
          { label: 'Risque moyen', value: mediumRisk.length, icon: TrendingUp, color: 'bg-amber-100 text-amber-700' },
          { label: 'A l’heure', value: normalRisk.length, icon: ShieldCheck, color: 'bg-emerald-100 text-emerald-700' },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.color}`}>
              <card.icon size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">{card.label}</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-white">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Liste des projets à risque</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Triés par gravité et déviation budgétaire.</p>
        </div>
        {risks.length === 0 ? (
          <div className="p-10 text-center text-slate-500 dark:text-slate-400">Aucun projet trouvé.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-[0.2em]">
                <tr>
                  <th className="px-5 py-4 text-left">Projet</th>
                  <th className="px-4 py-4 text-left">Région</th>
                  <th className="px-4 py-4 text-left">Secteur</th>
                  <th className="px-4 py-4 text-right">Budget</th>
                  <th className="px-4 py-4 text-right">Avancement</th>
                  <th className="px-4 py-4 text-right">Prévision</th>
                  <th className="px-4 py-4 text-right">Écart coût</th>
                  <th className="px-4 py-4 text-center">Risque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {risks.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/80 cursor-pointer"
                    onClick={() => navigate(`/projects/${record.id}`)}
                  >
                    <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">{record.name}</td>
                    <td className="px-4 py-4">{record.region}</td>
                    <td className="px-4 py-4">{record.sector}</td>
                    <td className="px-4 py-4 text-right">{formatMillions(record.budget)}</td>
                    <td className="px-4 py-4 text-right">{record.progress}%</td>
                    <td className="px-4 py-4 text-right">{record.predicted}%</td>
                    <td className={`px-4 py-4 text-right text-sm font-semibold ${record.costDev >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>{record.costDev > 0 ? `+${record.costDev}%` : `${record.costDev}%`}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${record.risk === 'Élevé' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : record.risk === 'Moyen' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                        {record.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
