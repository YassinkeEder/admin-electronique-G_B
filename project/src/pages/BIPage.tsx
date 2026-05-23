import { useMemo, useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, BarChart, Bar, Line, Legend, Treemap,
} from 'recharts'
import { AlertTriangle, BarChart2, Brain, Globe, ShieldAlert, TrendingUp, Zap } from 'lucide-react'

import { PageLoader } from '../components/ui/LoadingSpinner'
import { useBiOverview } from '../hooks/useBiOverview'
import { useI18n } from '../contexts/I18nContext'
import { formatMillions, CHART_COLORS, isOverdue } from '../lib/utils'
import {
  ProjectRegion,
  ProjectSector,
  StrategicAxis,
  REGIONS,
  SECTORS,
  STRATEGIC_AXES,
  STRATEGIC_AXIS_LABELS,
} from '../types'

export function BIPage() {
  const { t } = useI18n()
  const [regionFilter, setRegionFilter] = useState<ProjectRegion | ''>('')
  const [sectorFilter, setSectorFilter] = useState<ProjectSector | ''>('')
  const [axisFilter, setAxisFilter] = useState<StrategicAxis | ''>('')

  const {
    projects,
    metrics,
    riskSummary,
    mlStatus,
    loading,
    error,
  } = useBiOverview({
    region: regionFilter,
    sector: sectorFilter,
    strategic_axis: axisFilter,
  })

  const scatterData = useMemo(() =>
    projects.map(project => ({
      name: project.name,
      budget: Math.round(project.budget_xof / 1_000_000),
      progress: project.progress,
      beneficiaries: Math.round(project.beneficiaries / 1000),
      overdue: isOverdue(project.end_date, project.status) ? 1 : 0,
    })), [projects])

  const sectorPerf = useMemo(() => {
    const map: Record<string, { total: number; count: number; budget: number }> = {}
    projects.forEach(project => {
      if (!map[project.sector]) map[project.sector] = { total: 0, count: 0, budget: 0 }
      map[project.sector].total += project.progress
      map[project.sector].count += 1
      map[project.sector].budget += project.budget_xof
    })
    return Object.entries(map).map(([sector, data]) => ({
      sector,
      avgProgress: Math.round(data.total / data.count),
      count: data.count,
      budget: Math.round(data.budget / 1_000_000),
    }))
  }, [projects])

  const regionRadar = useMemo(() => {
    const map: Record<string, { count: number; budget: number; progress: number }> = {}
    projects.forEach(project => {
      if (!map[project.region]) map[project.region] = { count: 0, budget: 0, progress: 0 }
      map[project.region].count += 1
      map[project.region].budget += project.budget_xof
      map[project.region].progress += project.progress
    })
    return Object.entries(map).map(([region, data]) => ({
      region,
      count: data.count,
      budget: Math.round(data.budget / 1_000_000),
      avgProgress: data.count ? Math.round(data.progress / data.count) : 0,
    }))
  }, [projects])

  const strategyAxisData = useMemo(() => {
    const map: Record<StrategicAxis, { count: number; budget: number }> = STRATEGIC_AXES.reduce((accumulator, axis) => ({
      ...accumulator,
      [axis]: { count: 0, budget: 0 },
    }), {} as Record<StrategicAxis, { count: number; budget: number }>)

    projects.forEach(project => {
      if (project.strategic_axis && map[project.strategic_axis]) {
        map[project.strategic_axis].count += 1
        map[project.strategic_axis].budget += project.budget_xof
      }
    })

    return STRATEGIC_AXES.map(axis => ({
      axis,
      label: STRATEGIC_AXIS_LABELS[axis],
      projects: map[axis].count,
      budget: Math.round(map[axis].budget / 1_000_000),
    }))
  }, [projects])

  const treemapData = useMemo(() => ({
    name: 'Budget',
    children: projects.map(project => ({
      name: project.name.length > 20 ? `${project.name.slice(0, 20)}…` : project.name,
      size: project.budget_xof,
      fill: CHART_COLORS[REGIONS.indexOf(project.region as ProjectRegion) % CHART_COLORS.length],
    })),
  }), [projects])

  const riskChartData = useMemo(() => (
    (riskSummary?.projects || []).map(project => ({
      name: project.name.length > 22 ? `${project.name.slice(0, 22)}…` : project.name,
      progress: project.progress,
      delayRiskPct: Math.round(project.delay_probability * 100),
      budgetRiskPct: Math.round(project.budget_probability * 100),
    }))
  ), [riskSummary])

  const averageRoi = useMemo(() => {
    const roiMetrics = metrics.filter(metric => metric.kpi_type === 'roi')
    if (roiMetrics.length === 0) return 0
    return Math.round(roiMetrics.reduce((sum, metric) => sum + metric.value, 0) / roiMetrics.length)
  }, [metrics])

  const totalBudget = useMemo(
    () => projects.reduce((sum, project) => sum + project.budget_xof, 0),
    [projects],
  )

  const summary = riskSummary?.summary
  const selectClass = 'px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all'

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('bi.title')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Analyse avancée et scoring ML via l&apos;API backend.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value as ProjectRegion | '')} className={selectClass}>
            <option value="">Toutes régions</option>
            {REGIONS.map(region => <option key={region} value={region}>{region}</option>)}
          </select>
          <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value as ProjectSector | '')} className={selectClass}>
            <option value="">Tous secteurs</option>
            {SECTORS.map(sector => <option key={sector} value={sector}>{sector}</option>)}
          </select>
          <select value={axisFilter} onChange={e => setAxisFilter(e.target.value as StrategicAxis | '')} className={selectClass}>
            <option value="">Tous axes</option>
            {STRATEGIC_AXES.map(axis => (
              <option key={axis} value={axis}>{STRATEGIC_AXIS_LABELS[axis]}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          Impossible de charger le module BI depuis l&apos;API: {error}
        </div>
      )}

      {mlStatus === 'degraded' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          Le service ML est indisponible. Les analyses descriptives restent visibles, mais les prédictions de risque ne sont pas à jour.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Projets analysés', value: projects.length, icon: BarChart2, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
          { label: 'ROI moyen', value: `${averageRoi}%`, icon: TrendingUp, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' },
          { label: 'Budget total', value: formatMillions(totalBudget), icon: Zap, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
          { label: 'Projets critiques', value: summary?.critical_projects ?? '—', icon: ShieldAlert, color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} className="text-blue-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Risque projet — modèle backend</h3>
          </div>
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Les probabilités affichées proviennent désormais du backend via <code>/api/bi/overview</code>,
              lui-même branché sur le service Python ML. Aucune heuristique frontend n&apos;est utilisée ici.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={riskChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#f1f5f9', fontSize: 12 }} />
              <Legend />
              <Bar yAxisId="left" dataKey="progress" name="Avancement réel %" fill="#3b82f620" stroke="#3b82f6" strokeWidth={1} radius={[3, 3, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="delayRiskPct" name="Risque retard %" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="budgetRiskPct" name="Risque budget %" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} strokeDasharray="5 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-emerald-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">{t('bi.regionComparison')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={regionRadar}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="region" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <PolarRadiusAxis angle={30} tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <Radar name="Projets" dataKey="count" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} />
              <Radar name="Avancement moy. %" dataKey="avgProgress" stroke="#10b981" fill="#10b98120" strokeWidth={2} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t('bi.budgetAnalysis')} par Secteur</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={sectorPerf}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="sector" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#f1f5f9', fontSize: 12 }} />
              <Legend />
              <Bar yAxisId="left" dataKey="budget" name="Budget M XOF" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="avgProgress" name="Avg %" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t('bi.performanceMatrix')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="budget" name="Budget (M XOF)" tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: 'Budget (M XOF)', position: 'bottom', fontSize: 10, fill: '#94a3b8' }} />
              <YAxis dataKey="progress" name="Avancement %" tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: 'Avancement %', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#f1f5f9', fontSize: 12 }}
                formatter={(value, name) => [value, name]}
                labelFormatter={() => ''}
              />
              <Scatter data={scatterData} fill="#3b82f6" name="Projets">
                {scatterData.map((entry, index) => (
                  <rect key={index} fill={entry.overdue ? '#ef4444' : '#3b82f6'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 mt-2 text-center">Points rouges = projets en retard</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Alignement Stratégie Numérique 2030</h3>
        <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Source : projets filtrés par axe stratégique persistant en base.
        </div>
        <div className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={strategyAxisData} layout="vertical" margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis type="category" dataKey="label" width={180} tick={{ fontSize: 12, fill: '#475569' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#f1f5f9' }} />
              <Legend wrapperStyle={{ color: '#94a3b8' }} />
              <Bar dataKey="projects" name="Nombre de projets" fill="#3b82f6" radius={[10, 10, 10, 10]} />
              <Bar dataKey="budget" name="Budget total (M XOF)" fill="#10b981" radius={[10, 10, 10, 10]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-red-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Analyse du risque par projet</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {['Projet', 'Avancement', 'Risque retard', 'Risque budget', 'Usage budget', 'Modèle'].map(header => (
                  <th key={header} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {(riskSummary?.projects || []).map(project => (
                <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{project.name}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-blue-600 dark:text-blue-400">{project.progress}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {Math.round(project.delay_probability * 100)}% ({project.delay_risk})
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      {Math.round(project.budget_probability * 100)}% ({project.budget_risk})
                    </span>
                  </td>
                  <td className="px-4 py-3">{project.budget_usage_pct}%</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{project.model_used}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Répartition budgétaire</h3>
        <ResponsiveContainer width="100%" height={320}>
          <Treemap data={[treemapData]} dataKey="size" stroke="#fff" fill="#3b82f6" />
        </ResponsiveContainer>
      </div>
    </div>
  )
}
