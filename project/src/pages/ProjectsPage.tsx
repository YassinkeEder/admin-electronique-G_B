import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter, ArrowUpRight, Calendar,
  DollarSign, Users, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { useProjects, deleteProject } from '../hooks/useProjects';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useProjectFilters } from '../contexts/FilterContext';
import { Modal } from '../components/ui/Modal';
import { ProjectForm } from '../components/projects/ProjectForm';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { formatMillions, formatDate, STATUS_COLORS, SECTOR_ICONS, isOverdue } from '../lib/utils';
import { ProjectStatus, ProjectRegion, ProjectSector, REGIONS, SECTORS, STATUSES } from '../types';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: 'Planifié', IN_PROGRESS: 'En cours', COMPLETED: 'Terminé',
  SUSPENDED: 'Suspendu', CANCELLED: 'Annulé',
};

export function ProjectsPage({ publicView = false }: { publicView?: boolean }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { profile } = useAuth();
  const { filters, setStatus, setRegion, setSector, setSearch } = useProjectFilters();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const { projects, loading, refetch } = useProjects({
    status: filters.status,
    region: filters.region,
    sector: filters.sector,
    strategic_axis: filters.strategic_axis,
    search: filters.search,
    is_public: publicView ? true : undefined,
  });

  const canEdit = !publicView && (profile?.role === 'admin' || profile?.role === 'chef_projet');

  const selectClass = "px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('nav.projects')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {projects.length} projet(s) trouvé(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
            <button onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
              Grille
            </button>
            <button onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
              Tableau
            </button>
          </div>
          {canEdit && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20">
              <Plus size={16} /> {t('proj.new')}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder={t('general.search')} value={filters.search || ''} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-slate-400" />
          <select value={filters.status || ''} onChange={e => setStatus(e.target.value as ProjectStatus | '')} className={selectClass}>
            <option value="">Tous statuts</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select value={filters.region || ''} onChange={e => setRegion(e.target.value as ProjectRegion | '')} className={selectClass}>
            <option value="">Toutes régions</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filters.sector || ''} onChange={e => setSector(e.target.value as ProjectSector | '')} className={selectClass}>
            <option value="">Tous secteurs</option>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
            <Filter size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">{t('general.noData')}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{SECTOR_ICONS[project.sector] || '📁'}</span>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{project.region} · {project.sector}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {isOverdue(project.end_date, project.status) && (
                    <AlertTriangle size={14} className="text-red-500" />
                  )}
                  {project.status === 'COMPLETED' && (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  )}
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${STATUS_COLORS[project.status]}`}>
                    {STATUS_LABELS[project.status]}
                  </span>
                </div>
              </div>

              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {project.name}
              </h3>

              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                  <span>Avancement</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{project.progress}%</span>
                </div>
                <ProgressBar value={project.progress} size="md" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <DollarSign size={12} className="text-blue-500" />
                  <span>{formatMillions(project.budget_xof)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Users size={12} className="text-emerald-500" />
                  <span>{project.beneficiaries.toLocaleString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Calendar size={12} className="text-amber-500" />
                  <span>{formatDate(project.end_date)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <ArrowUpRight size={12} className="text-blue-400" />
                  <span className="text-blue-500 dark:text-blue-400 font-medium">Détails</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                  {['Projet', 'Région', 'Secteur', 'Budget', 'Avancement', 'Statut', 'Fin'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {projects.map(project => (
                  <tr key={project.id} onClick={() => navigate(`/projects/${project.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{SECTOR_ICONS[project.sector]}</span>
                        <span className="font-medium text-slate-900 dark:text-white truncate max-w-48">{project.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{project.region}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{project.sector}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{formatMillions(project.budget_xof)}</td>
                    <td className="px-4 py-3 min-w-32">
                      <ProgressBar value={project.progress} showLabel size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${STATUS_COLORS[project.status]}`}>
                        {STATUS_LABELS[project.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(project.end_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={t('proj.new')} size="lg">
        <ProjectForm onSuccess={() => { setShowForm(false); refetch(); }} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
