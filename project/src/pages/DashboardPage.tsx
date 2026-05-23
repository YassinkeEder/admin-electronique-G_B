import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Line,
} from 'recharts';
import {
  DollarSign, FolderOpen, TrendingUp, AlertTriangle,
  Users, CheckCircle2, Clock, Activity, Brain,
} from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useMetrics } from '../hooks/useMetrics';
import { useRegionalKPIs } from '../hooks/useRegionalKPIs';
import { KPICard } from '../components/dashboard/KPICard';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { useI18n } from '../contexts/I18nContext';
import { formatMillions, formatXOF, STATUS_COLORS, CHART_COLORS, isOverdue } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { ProjectStatus } from '../types';
import { computeRiskScore, RISK_COLORS, RISK_ICONS } from '../lib/riskScoring';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: 'Planifié',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  SUSPENDED: 'Suspendu',
  CANCELLED: 'Annulé',
};

export function DashboardPage() {
  const { projects, loading } = useProjects();
  const { metrics } = useMetrics();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { regionalKPIs, top3Regions } = useRegionalKPIs(projects);

  const stats = useMemo(() => {
    const totalBudget = projects.reduce((s, p) => s + p.budget_xof, 0);
    const totalSpent = projects.reduce((s, p) => s + p.spent_xof, 0);
    const activeProjects = projects.filter(p => p.status === 'IN_PROGRESS').length;
    const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
    const avgProgress = projects.length > 0
      ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)
      : 0;
    const delayedProjects = projects.filter(p => isOverdue(p.end_date, p.status)).length;
    const totalBeneficiaries = projects.reduce((s, p) => s + p.beneficiaries, 0);

    // CORRECTION N°3: Calcul dynamique des tendances KPI
    // budgetTrend : si dépenses > 80% du budget → tendance négative (-20), sinon positive
    const budgetTrend = totalBudget > 0 
      ? (totalSpent / totalBudget > 0.8 
        ? -20 
        : Math.round((1 - totalSpent / totalBudget) * 100))
      : 0;

    // projectTrend : % de projets actifs par rapport au total - 50% baseline
    const projectTrend = projects.length > 0
      ? Math.round((activeProjects / projects.length) * 100 - 50)
      : 0;

    // avgProgressTrend : écart entre progression moyenne et cible 70%
    const avgProgressTrend = avgProgress - 70;

    // delayTrend : toujours négatif si retards, sinon +5 (bon)
    const delayTrend = delayedProjects > 0 ? -(delayedProjects * 15) : 5;

    return { 
      totalBudget, 
      totalSpent, 
      activeProjects, 
      completedProjects, 
      avgProgress, 
      delayedProjects, 
      totalBeneficiaries,
      budgetTrend,
      projectTrend,
      avgProgressTrend,
      delayTrend
    };
  }, [projects]);

  const statusData = useMemo(() => {
    const counts: Partial<Record<ProjectStatus, number>> = {};
    projects.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_LABELS[status as ProjectStatus] || status,
      value: count,
      status,
    }));
  }, [projects]);

  const regionData = useMemo(() => {
    const map: Record<string, number> = {};
    projects.forEach(p => { map[p.region] = (map[p.region] || 0) + p.budget_xof; });
    return Object.entries(map).map(([region, budget]) => ({ region, budget }))
      .sort((a, b) => b.budget - a.budget);
  }, [projects]);

  const sectorData = useMemo(() => {
    const map: Record<string, number> = {};
    projects.forEach(p => { map[p.sector] = (map[p.sector] || 0) + 1; });
    return Object.entries(map).map(([sector, count]) => ({ sector, count }))
      .sort((a, b) => b.count - a.count);
  }, [projects]);

  const progressTrend = useMemo(() => {
    return projects.slice(0, 6).map(p => ({
      name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name,
      progress: p.progress,
      budget: Math.round(p.budget_xof / 1_000_000),
      spent: Math.round(p.spent_xof / 1_000_000),
    }));
  }, [projects]);

  const avgROI = useMemo(() => {
    const roiMetrics = metrics.filter(m => m.kpi_type === 'roi');
    if (!roiMetrics.length) return 0;
    return Math.round(roiMetrics.reduce((s, m) => s + m.value, 0) / roiMetrics.length);
  }, [metrics]);

  const riskScores = useMemo(() => projects.map(computeRiskScore), [projects]);
  const atRiskProjects = useMemo(
    () => riskScores.filter(r => r.riskLevel === 'critique' || r.riskLevel === 'élevé'),
    [riskScores],
  );

  const mlPredictions = useMemo(() => {
    return projects.map(p => {
      const start = new Date(p.start_date);
      const end = new Date(p.end_date);
      const now = new Date();
      const durationMs = Math.max(1, end.getTime() - start.getTime());
      const elapsedRatio = Math.min(1, Math.max(0, (now.getTime() - start.getTime()) / durationMs));
      const predictedCompletion = Math.min(100, Math.max(0, Math.round(
        p.progress + (elapsedRatio > 0 ? (p.progress / elapsedRatio) * (1 - elapsedRatio) : 0)
      )));
      const budgetUsageRate = p.budget_xof > 0 ? p.spent_xof / p.budget_xof : 0;
      const costDeviation = Math.round(((budgetUsageRate - (p.progress / 100)) * 100) * 10) / 10;
      const risk = costDeviation > 12 || isOverdue(p.end_date, p.status)
        ? 'Élevé'
        : costDeviation > 5
          ? 'Moyen'
          : 'Normal';

      return {
        name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name,
        actual: p.progress,
        predicted: predictedCompletion,
        costDev: costDeviation,
        risk,
      };
    });
  }, [projects]);

  const predictedAverage = mlPredictions.length > 0
    ? Math.round(mlPredictions.reduce((sum, item) => sum + item.predicted, 0) / mlPredictions.length)
    : 0;

  const highRiskCount = mlPredictions.filter(p => p.risk === 'Élevé').length;
  const onTrackCount = mlPredictions.filter(p => p.risk === 'Normal').length;
  const chartPredictionData = mlPredictions.slice(0, 6);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('nav.dashboard')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Pilotage des projets numériques publics · Guinée-Bissau
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Activity size={16} className="text-emerald-500" />
          <span>MAJ en temps réel</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title={t('dash.totalBudget')}
          value={formatMillions(stats.totalBudget)}
          subtitle={`Dépensé: ${formatMillions(stats.totalSpent)}`}
          icon={DollarSign}
          color="blue"
          trend={stats.budgetTrend}
        />
        <KPICard
          title={t('dash.activeProjects')}
          value={String(stats.activeProjects)}
          subtitle={`${stats.completedProjects} terminé(s) sur ${projects.length} total`}
          icon={FolderOpen}
          color="green"
          trend={stats.projectTrend}
        />
        <KPICard
          title={t('dash.avgProgress')}
          value={`${stats.avgProgress}%`}
          subtitle={`ROI moyen: ${avgROI}%`}
          icon={TrendingUp}
          color="amber"
          trend={stats.avgProgressTrend}
        />
        <KPICard
          title={t('dash.delayedProjects')}
          value={String(stats.delayedProjects)}
          subtitle={`${stats.totalBeneficiaries.toLocaleString('fr-FR')} bénéficiaires`}
          icon={AlertTriangle}
          color={stats.delayedProjects > 0 ? 'red' : 'green'}
          trend={stats.delayTrend}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Prévisions ML"
          value={`${predictedAverage}%`}
          subtitle="Avancement moyen estimé"
          icon={Brain}
          color="blue"
          trend={predictedAverage - stats.avgProgress}
        />
        <KPICard
          title="Projets à l'heure"
          value={String(onTrackCount)}
          subtitle={`${projects.length} projets totaux`}
          icon={CheckCircle2}
          color="green"
          trend={onTrackCount - highRiskCount}
        />
        <KPICard
          title="Projets à risque"
          value={String(highRiskCount)}
          subtitle="Risque budgétaire ou retard"
          icon={AlertTriangle}
          color="red"
          trend={highRiskCount > 0 ? -10 : 5}
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">⚠️ Projets à risque</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Suivi des projets dont le risque composite est élevé ou critique.
            </p>
          </div>
          {atRiskProjects.length > 0 && (
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Voir tous
            </button>
          )}
        </div>

        {atRiskProjects.length === 0 ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-950/40 dark:text-emerald-200">
            ✅ Tous les projets respectent les seuils de risque.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {atRiskProjects.slice(0, 4).map(risk => (
              <div key={risk.projectId} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-900 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${RISK_COLORS[risk.riskLevel]}`}>
                  <span>{RISK_ICONS[risk.riskLevel]}</span>
                  <span>{risk.riskLevel.toUpperCase()}</span>
                </div>
                <h4 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                  {risk.projectName.length > 35 ? `${risk.projectName.slice(0, 35)}…` : risk.projectName}
                </h4>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {risk.region} • {risk.sector}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {risk.reasons.slice(0, 3).map(reason => (
                    <li key={reason} className="list-disc list-inside">{reason}</li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                    Score {risk.score}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${risk.projectId}`)}
                    className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Voir projet →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={18} className="text-blue-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Prévisions ML</h3>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartPredictionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#f1f5f9' }} />
            <Legend />
            <Bar dataKey="actual" name="Avancement réel" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="predicted" name="Avancement prédit" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
          Calcul ML simplifié côté frontend : estimer l’avancement futur à partir de la vitesse actuelle et du temps restant.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Budget vs Dépenses (M XOF)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={progressTrend} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#f1f5f9' }}
                formatter={(value) => [`${Number(value ?? 0)} M XOF`, 'Valeur']}
              />
              <Legend />
              <Bar dataKey="budget" name="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" name="Dépensé" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t('dash.statusOverview')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {statusData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#f1f5f9' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusData.map((item, i) => (
              <div key={item.status} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t('dash.budgetByRegion')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={regionData} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${(v / 1e9).toFixed(1)}Mrd`} />
              <YAxis type="category" dataKey="region" tick={{ fontSize: 11, fill: '#94a3b8' }} width={55} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#f1f5f9' }}
                formatter={(value) => [formatMillions(Number(value ?? 0)), 'Budget']}
              />
              <Bar dataKey="budget" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Projets par Secteur</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={sectorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
              <XAxis dataKey="sector" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#f1f5f9' }} />
              <Area type="monotone" dataKey="count" stroke="#10b981" fill="#10b98120" strokeWidth={2} name="Projets" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CORRECTION N°9: Section Performances par région */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">Performances par région</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Analyse détaillée des KPI régionaux</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Région</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Projets</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Budget</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Dépensé %</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Avancement</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Retards</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {regionalKPIs.map(kpi => (
                <tr key={kpi.region} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{kpi.region}</td>
                  <td className="text-center px-4 py-3 text-slate-600 dark:text-slate-400">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                      {kpi.projectCount}
                    </span>
                  </td>
                  <td className="text-right px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {formatMillions(kpi.totalBudget)}
                  </td>
                  <td className="text-right px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${Math.min(100, kpi.budgetUtilizationRate)}%`,
                            background: kpi.budgetUtilizationRate > 90 ? '#ef4444' : kpi.budgetUtilizationRate > 70 ? '#f59e0b' : '#10b981',
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-10 text-right">
                        {kpi.budgetUtilizationRate}%
                      </span>
                    </div>
                  </td>
                  <td className="text-center px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-md text-xs font-semibold">
                      {kpi.avgProgress}%
                    </span>
                  </td>
                  <td className="text-center px-4 py-3">
                    {kpi.delayedCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-xs font-semibold">
                        ⚠ {kpi.delayedCount}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">{t('dash.recentProjects')}</h3>
          <button
            onClick={() => navigate('/projects')}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Voir tout →
          </button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {projects.slice(0, 5).map(project => (
            <div
              key={project.id}
              className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{project.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {project.region} · {project.sector}
                </p>
              </div>
              <div className="w-32 hidden sm:block">
                <ProgressBar value={project.progress} showLabel size="sm" />
              </div>
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{formatMillions(project.budget_xof)}</p>
                <p className="text-xs text-slate-400">{formatXOF(project.spent_xof).slice(0, 12)}...</p>
              </div>
              <span className={`hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full font-medium border ${STATUS_COLORS[project.status]}`}>
                {STATUS_LABELS[project.status]}
              </span>
              <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                {project.status === 'COMPLETED' && <CheckCircle2 size={16} className="text-emerald-500" />}
                {isOverdue(project.end_date, project.status) && <AlertTriangle size={16} className="text-red-500" />}
                {project.status === 'IN_PROGRESS' && !isOverdue(project.end_date, project.status) && <Clock size={16} className="text-amber-500" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Budget Total', value: formatMillions(stats.totalBudget), icon: DollarSign, color: 'text-blue-500' },
          { label: 'Dépensé', value: formatMillions(stats.totalSpent), icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Bénéficiaires', value: (stats.totalBeneficiaries / 1000).toFixed(0) + 'k', icon: Users, color: 'text-amber-500' },
          { label: 'Taux Complétion', value: `${stats.avgProgress}%`, icon: CheckCircle2, color: 'text-slate-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
            <stat.icon size={20} className={stat.color} />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
