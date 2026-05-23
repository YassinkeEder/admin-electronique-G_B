import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, MapPin, Layers, DollarSign } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { formatMillions, formatDate, isOverdue } from '../lib/utils';
import { ProjectRegion, ProjectSector, ProjectStatus, StrategicAxis, STRATEGIC_AXES, STRATEGIC_AXIS_LABELS, REGIONS, SECTORS, STATUSES } from '../types';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: 'Planifié',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  SUSPENDED: 'Suspendu',
  CANCELLED: 'Annulé',
};

export function PublicTransparencyPage() {
  const [regionFilter, setRegionFilter] = useState<ProjectRegion | ''>('');
  const [sectorFilter, setSectorFilter] = useState<ProjectSector | ''>('');
  const [axisFilter, setAxisFilter] = useState<StrategicAxis | ''>('');
  const { projects, loading } = useProjects({ region: regionFilter, sector: sectorFilter, strategic_axis: axisFilter, is_public: true });

  const totalBudget = useMemo(() => projects.reduce((sum, project) => sum + project.budget_xof, 0), [projects]);
  const totalProjects = projects.length;
  const averageProgress = useMemo(
    () => (totalProjects ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / totalProjects) : 0),
    [projects, totalProjects]
  );
  const delayedProjects = useMemo(() => projects.filter(project => isOverdue(project.end_date, project.status)).length, [projects]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Portail public</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Transparence des projets</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300 max-w-2xl">
              Accédez sans compte aux projets publics de la plateforme. Filtrez par région et secteur pour voir l'état du budget et de l'avancement.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Projets publics', value: totalProjects, icon: Globe, color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200' },
            { label: 'Budget total engagé', value: formatMillions(totalBudget), icon: DollarSign, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200' },
            { label: 'Progrès moyen', value: `${averageProgress}%`, icon: Layers, color: 'bg-slate-50 text-slate-700 dark:bg-slate-900/20 dark:text-slate-200' },
            { label: 'Projets en retard', value: delayedProjects, icon: MapPin, color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200' },
          ].map(card => (
            <div key={card.label} className={`rounded-3xl border border-slate-200 dark:border-slate-700 p-5 ${card.color}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/80 dark:bg-slate-800 flex items-center justify-center text-lg shadow-sm">
                  <card.icon size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] font-semibold">{card.label}</p>
                  <p className="text-3xl font-bold mt-2">{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Liste des projets publics</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Filtrer par région et secteur pour trouver les projets pertinents.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={regionFilter}
                onChange={e => setRegionFilter(e.target.value as ProjectRegion | '')}
                className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200"
              >
                <option value="">Toutes régions</option>
                {REGIONS.map(region => <option key={region} value={region}>{region}</option>)}
              </select>
              <select
                value={sectorFilter}
                onChange={e => setSectorFilter(e.target.value as ProjectSector | '')}
                className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200"
              >
                <option value="">Tous secteurs</option>
                {SECTORS.map(sector => <option key={sector} value={sector}>{sector}</option>)}
              </select>
              <select
                value={axisFilter}
                onChange={e => setAxisFilter(e.target.value as StrategicAxis | '')}
                className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200"
              >
                <option value="">Tous axes</option>
                {STRATEGIC_AXES.map(axis => (
                  <option key={axis} value={axis}>{STRATEGIC_AXIS_LABELS[axis]}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="mt-8"><PageLoader /></div>
          ) : projects.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400">
              Aucun projet public trouvé avec ces filtres.
            </div>
          ) : (
            <div className="mt-8 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-700 dark:text-slate-200">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-[0.24em]">
                  <tr>
                    <th className="px-5 py-4">Projet</th>
                    <th className="px-4 py-4">Région</th>
                    <th className="px-4 py-4">Secteur</th>
                    <th className="px-4 py-4">Statut</th>
                    <th className="px-4 py-4 text-right">Budget</th>
                    <th className="px-4 py-4 text-right">Avancement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                  {projects.map(project => (
                    <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">{project.name}</td>
                      <td className="px-4 py-4">{project.region}</td>
                      <td className="px-4 py-4">{project.sector}</td>
                      <td className="px-4 py-4">{STATUS_LABELS[project.status]}</td>
                      <td className="px-4 py-4 text-right">{formatMillions(project.budget_xof)}</td>
                      <td className="px-4 py-4 text-right">{project.progress}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
