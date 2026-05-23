import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Task, TaskStatus, Project } from '../types';
import { ProgressBar } from '../components/ui/ProgressBar';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { formatDate } from '../lib/utils';
import { useI18n } from '../contexts/I18nContext';

const STATUS_COLOR: Record<TaskStatus, string> = {
  TODO: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  BLOCKED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'À faire', IN_PROGRESS: 'En cours', REVIEW: 'En revue', DONE: 'Terminé', BLOCKED: 'Bloqué',
};

interface TaskWithProject extends Task {
  project?: Project;
}

export function TasksPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskStatus | ''>('');

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      const { data } = await supabase
        .from('tasks')
        .select('*, project:projects(id, name, region, sector)')
        .order('due_date', { ascending: true });
      setTasks((data as TaskWithProject[]) || []);
      setLoading(false);
    }
    fetchTasks();
  }, []);

  const filtered = filter ? tasks.filter(t => t.status === filter) : tasks;

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    done: tasks.filter(t => t.status === 'DONE').length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'DONE').length,
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('nav.tasks')}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Vue globale de toutes les tâches</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: CheckSquare, color: 'text-blue-500' },
          { label: 'En cours', value: stats.inProgress, icon: Clock, color: 'text-amber-500' },
          { label: 'Terminées', value: stats.done, icon: CheckSquare, color: 'text-emerald-500' },
          { label: 'En retard', value: stats.overdue, icon: AlertTriangle, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
            <s.icon size={20} className={s.color} />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'] as (TaskStatus | '')[]).map(s => (
          <button key={s || 'all'}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === s
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}>
            {s ? STATUS_LABELS[s as TaskStatus] : 'Toutes'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          Aucune tâche disponible.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                {['Tâche', 'Projet', 'Priorité', 'Avancement', 'Statut', 'Échéance', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filtered.map(task => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'DONE';
                return (
                  <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isOverdue && <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />}
                        <span className="font-medium text-slate-900 dark:text-white truncate max-w-48">{task.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {task.project && (
                        <button
                          onClick={() => navigate(`/projects/${task.project_id}`)}
                          className="text-blue-500 dark:text-blue-400 hover:underline text-xs"
                        >
                          {task.project.name}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        task.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                        task.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                        task.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 min-w-28">
                      <ProgressBar value={task.progress} showLabel size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[task.status]}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                      <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                        {formatDate(task.due_date)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/projects/${task.project_id}`)}
                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                        <ArrowUpRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
