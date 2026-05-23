import { useEffect, useMemo, useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { useI18n } from '../contexts/I18nContext';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { GanttView } from '../components/projects/GanttView';
import { formatDate, formatMillions, isOverdue } from '../lib/utils';
import { ProjectRegion, ProjectSector, REGIONS, SECTORS } from '../types';

export function GanttPage() {
  const { t } = useI18n();
  const [regionFilter, setRegionFilter] = useState<ProjectRegion | ''>('');
  const [sectorFilter, setSectorFilter] = useState<ProjectSector | ''>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const { projects, loading: projectsLoading } = useProjects({ region: regionFilter, sector: sectorFilter });

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || projects[0] || null,
    [projects, selectedProjectId]
  );

  const { tasks, loading: tasksLoading, refetch: refetchTasks } = useTasks(selectedProject?.id ?? '');

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const timeline = useMemo(() => {
    const datedProjects = projects
      .filter((project) => project.start_date && project.end_date)
      .map((project) => ({
        ...project,
        start: new Date(project.start_date),
        end: new Date(project.end_date),
      }));

    if (datedProjects.length === 0) {
      return { min: new Date(), max: new Date(), list: [], totalMs: 1 };
    }

    const minDate = new Date(Math.min(...datedProjects.map((p) => p.start.getTime())));
    const maxDate = new Date(Math.max(...datedProjects.map((p) => p.end.getTime())));
    const totalMs = Math.max(maxDate.getTime() - minDate.getTime(), 1000 * 60 * 60 * 24);

    return { min: minDate, max: maxDate, list: datedProjects, totalMs };
  }, [projects]);

  const delayedCount = useMemo(
    () => projects.filter((project) => project.start_date && project.end_date && isOverdue(project.end_date, project.status)).length,
    [projects]
  );

  if (projectsLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('nav.gantt')}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-2xl">
            Vue Gantt complète des projets avec sélection de projet et planification des tâches.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value as ProjectRegion | '')}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="">Toutes régions</option>
            {REGIONS.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value as ProjectSector | '')}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="">Tous secteurs</option>
            {SECTORS.map((sector) => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Total projets</p>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{projects.length}</p>
        </div>
        <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Budget total</p>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{formatMillions(projects.reduce((sum, project) => sum + project.budget_xof, 0))}</p>
        </div>
        <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Projets en retard</p>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{delayedCount}</p>
        </div>
      </section>

      <section className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Sélectionnez un projet</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Affichez les tâches du projet dans une vue Gantt interactive.</p>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Projets avec dates : {timeline.list.length}/{projects.length}</p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400">Aucun projet disponible.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => setSelectedProjectId(project.id)}
                className={`rounded-3xl border p-4 text-left transition ${selectedProject?.id === project.id ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-semibold text-slate-900 dark:text-white">{project.name}</span>
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{project.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{project.region} · {project.sector}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{formatDate(project.start_date)}</span>
                  <span>{formatDate(project.end_date)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Chronologie du projet</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Déplacez les barres pour ajuster les dates ou la progression des tâches.</p>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {selectedProject ? `${selectedProject.name}` : 'Sélectionnez un projet dans la liste ci-dessus.'}
          </div>
        </div>

        {!selectedProject ? (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400">Sélectionnez un projet pour afficher son diagramme de Gantt.</div>
        ) : !selectedProject.start_date || !selectedProject.end_date ? (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400">Le projet sélectionné n'a pas de dates de début ou de fin définies.</div>
        ) : tasksLoading ? (
          <PageLoader />
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400">Aucune tâche définie pour ce projet.</div>
        ) : (
          <GanttView tasks={tasks} project={selectedProject} loading={tasksLoading} onUpdate={refetchTasks} />
        )}
      </section>
    </div>
  );
}
