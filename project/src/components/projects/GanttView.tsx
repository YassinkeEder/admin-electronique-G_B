// src/components/projects/GanttView.tsx
// Dépendance : npm install gantt-task-react
// S'intègre directement dans l'onglet 'gantt' de ProjectDetailPage

import { useMemo, useState } from 'react';
import { Gantt, Task as GanttTask, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { updateTask } from '../../hooks/useTasks';
import type { Task, Project } from '../../types';

// ─── Mapping statut (MAJUSCULES) → couleurs ──────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; progress: string }> = {
  TODO:        { bg: '#f1f5f9', progress: '#94a3b8' },
  IN_PROGRESS: { bg: '#dbeafe', progress: '#3b82f6' },
  REVIEW:      { bg: '#fef3c7', progress: '#f59e0b' },
  DONE:        { bg: '#d1fae5', progress: '#10b981' },
  BLOCKED:     { bg: '#fee2e2', progress: '#ef4444' },
};

// ─── Conversion Task → GanttTask ─────────────────────────────────────────────
function toGanttTask(task: Task, projectStart: Date, projectEnd: Date): GanttTask {
  const styles = STATUS_STYLES[task.status] ?? STATUS_STYLES['TODO'];

  let start = task.start_date ? new Date(task.start_date) : new Date(projectStart);
  let end   = task.due_date   ? new Date(task.due_date)   : new Date(projectEnd);

  // Garantir end > start (exigence de la lib)
  if (end <= start) {
    end = new Date(start);
    end.setDate(end.getDate() + 1);
  }

  return {
    id:       task.id,
    name:     task.title,
    start,
    end,
    progress: task.progress ?? 0,
    type:     'task',
    styles: {
      backgroundColor:         styles.bg,
      backgroundSelectedColor: styles.bg,
      progressColor:           styles.progress,
      progressSelectedColor:   styles.progress,
    },
    isDisabled: task.status === 'DONE',
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface GanttViewProps {
  tasks:      Task[];
  project:    Project;
  loading?:   boolean;
  onUpdate?:  () => void;  // refetchTasks après update
}

// ─── Composant ────────────────────────────────────────────────────────────────
export function GanttView({ tasks, project, loading = false, onUpdate }: GanttViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);

  const columnWidth = viewMode === ViewMode.Day ? 40 : viewMode === ViewMode.Week ? 65 : 120;

  const projectStart = new Date(project.start_date);
  const projectEnd   = new Date(project.end_date);

  // Seules les tâches avec au moins une date sont affichées
  const tasksWithDates = useMemo(
    () => tasks.filter(t => t.start_date || t.due_date),
    [tasks]
  );

  const ganttTasks = useMemo<GanttTask[]>(
    () => tasksWithDates
      .map(t => toGanttTask(t, projectStart, projectEnd))
      .sort((a, b) => a.start.getTime() - b.start.getTime()),
    [tasksWithDates, project]
  );

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleDateChange = async (ganttTask: GanttTask) => {
    await updateTask(ganttTask.id, {
      start_date: ganttTask.start.toISOString().split('T')[0],
      due_date:   ganttTask.end.toISOString().split('T')[0],
    });
    onUpdate?.();
  };

  const handleProgressChange = async (ganttTask: GanttTask) => {
    await updateTask(ganttTask.id, { progress: Math.round(ganttTask.progress) });
    onUpdate?.();
  };

  // ─── États vides ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3" />
        Chargement…
      </div>
    );
  }

  if (ganttTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
        <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm">Aucune tâche avec des dates définies.</p>
        <p className="text-xs opacity-60">Ajoutez une date de début ou d'échéance aux tâches.</p>
      </div>
    );
  }

  // ─── Légende ───────────────────────────────────────────────────────────────
  const legend = [
    { label: 'À faire',     color: STATUS_STYLES.TODO.progress },
    { label: 'En cours',    color: STATUS_STYLES.IN_PROGRESS.progress },
    { label: 'En revue',    color: STATUS_STYLES.REVIEW.progress },
    { label: 'Terminé',     color: STATUS_STYLES.DONE.progress },
    { label: 'Bloqué',      color: STATUS_STYLES.BLOCKED.progress },
  ];

  const hidden = tasks.length - tasksWithDates.length;

  return (
    <div className="space-y-4">

      {/* Barre d'outils */}
      <div className="flex items-center justify-between flex-wrap gap-3">

        {/* Sélecteur de vue */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
          {([ViewMode.Day, ViewMode.Week, ViewMode.Month] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === mode
                  ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {mode === ViewMode.Day ? 'Jour' : mode === ViewMode.Week ? 'Semaine' : 'Mois'}
            </button>
          ))}
        </div>

        {/* Légende */}
        <div className="flex items-center gap-3 flex-wrap">
          {legend.map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Avertissement tâches sans dates */}
      {hidden > 0 && (
        <p className="text-xs text-amber-500 dark:text-amber-400">
          {hidden} tâche{hidden > 1 ? 's' : ''} sans dates — non affichée{hidden > 1 ? 's' : ''} dans le Gantt.
        </p>
      )}

      {/* Diagramme */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <Gantt
          tasks={ganttTasks}
          viewMode={viewMode}
          columnWidth={columnWidth}
          listCellWidth="200px"
          rowHeight={40}
          barFill={75}
          handleWidth={8}
          todayColor="rgba(59, 130, 246, 0.08)"
          locale="fr-FR"
          onDateChange={handleDateChange}
          onProgressChange={handleProgressChange}
          ganttHeight={Math.min(ganttTasks.length * 40 + 60, 480)}
        />
      </div>

      <p className="text-xs text-slate-400">
        Glissez les barres pour modifier les dates · Faites glisser l'extrémité droite pour ajuster la progression.
      </p>
    </div>
  );
}
