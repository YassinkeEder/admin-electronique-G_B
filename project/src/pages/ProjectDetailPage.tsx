// src/pages/ProjectDetailPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard as Edit, Trash2, Plus, DollarSign, Calendar, Users, MapPin, Tag, Target, AlertTriangle, CheckCircle2, TrendingUp, Clock, Download } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useProject, updateProject, deleteProject } from '../hooks/useProjects';
import { useTasks, createTask, updateTask, deleteTask } from '../hooks/useTasks';
import { useMetrics } from '../hooks/useMetrics';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Modal } from '../components/ui/Modal';
import { ProjectForm } from '../components/projects/ProjectForm';
import { DocumentsPanel } from '../components/projects/DocumentsPanel';
import { CommentsPanel } from '../components/projects/CommentsPanel';
import { GanttView } from '../components/projects/GanttView';
import { ProgressBar } from '../components/ui/ProgressBar';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { formatMillions, formatDate, formatPercent, STATUS_COLORS, SECTOR_ICONS, getBudgetUsage, isOverdue } from '../lib/utils';
import { exportProjectReport } from '../lib/exporters';
import { Task, TaskStatus, TaskPriority } from '../types';

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planifié', IN_PROGRESS: 'En cours', COMPLETED: 'Terminé',
  SUSPENDED: 'Suspendu', CANCELLED: 'Annulé',
  TODO: 'À faire', REVIEW: 'En revue', DONE: 'Terminé', BLOCKED: 'Bloqué',
};

const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  TODO: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  BLOCKED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-500',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  CRITICAL: 'bg-red-100 text-red-600',
};

interface TaskFormData {
  title: string;
  description: string;
  progress: number;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string;
  due_date: string;
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const { project, loading, refetch } = useProject(id!);
  const { tasks, loading: tasksLoading, refetch: refetchTasks } = useTasks(id!);
  const { metrics } = useMetrics(id!);

  const [showEditProject, setShowEditProject] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'metrics' | 'gantt' | 'documents' | 'comments'>('overview');
  const [exporting, setExporting] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskFormData>({
    title: '', description: '', progress: 0, status: 'TODO',
    priority: 'MEDIUM', start_date: '', due_date: '',
  });

  const canEdit = profile?.role === 'admin' || profile?.role === 'chef_projet';
  const canExport = profile?.role === 'admin' || profile?.role === 'chef_projet' || profile?.role === 'decideur';

  async function handleExportReport() {
    if (!project) return;
    setExporting(true);
    try {
      await exportProjectReport(project, tasks, metrics, user?.email || 'Utilisateur');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteProject() {
    if (!project || !confirm('Supprimer ce projet ?')) return;
    await deleteProject(project.id);
    navigate('/projects');
  }

  async function handleTaskSubmit() {
    if (!user || !id) return;
    if (editingTask) {
      await updateTask(editingTask.id, taskForm);
    } else {
      await createTask({ ...taskForm, project_id: id }, user.id);
    }
    setShowTaskForm(false);
    setEditingTask(null);
    resetTaskForm();
    refetchTasks();
  }

  function resetTaskForm() {
    setTaskForm({ title: '', description: '', progress: 0, status: 'TODO', priority: 'MEDIUM', start_date: '', due_date: '' });
  }

  function openEditTask(task: Task) {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      progress: task.progress,
      status: task.status,
      priority: task.priority,
      start_date: task.start_date || '',
      due_date: task.due_date || '',
    });
    setShowTaskForm(true);
  }

  const radarData = metrics.slice(0, 6).map(m => ({
    subject: m.kpi_type.replace(/_/g, ' '),
    value: Math.min(100, m.value),
    fullMark: 100,
  }));

  const kpiBarData = metrics.map(m => ({
    name: m.kpi_type.replace(/_/g, ' '),
    value: m.value,
    target: m.target_value,
    unit: m.unit,
  }));

  if (loading) return <PageLoader />;
  if (!project) return (
    <div className="text-center py-16 text-slate-500 dark:text-slate-400">
      Projet introuvable.
    </div>
  );

  const budgetUsage = getBudgetUsage(project.budget_xof, project.spent_xof);
  const overdue = isOverdue(project.end_date, project.status);

  const inputClass = "w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

  // ─── Onglets : on ajoute documents et comments ────────────────────────────
  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'overview',   label: 'Vue générale' },
    { id: 'tasks',      label: `Tâches (${tasks.length})` },
    { id: 'metrics',    label: 'KPI' },
    { id: 'gantt',      label: 'Gantt' },
    { id: 'documents',  label: 'Documents' },
    { id: 'comments',   label: 'Commentaires' },
  ];

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/projects')}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{SECTOR_ICONS[project.sector]}</span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{project.name}</h2>
            {overdue && <AlertTriangle size={16} className="text-red-500" />}
            {project.status === 'COMPLETED' && <CheckCircle2 size={16} className="text-emerald-500" />}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{project.region} · {project.sector}</p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button onClick={handleExportReport} disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors disabled:opacity-50">
              <Download size={15} /> {exporting ? 'Export...' : 'Exporter rapport'}
            </button>
            <button onClick={() => setShowEditProject(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              <Edit size={15} /> Modifier
            </button>
            <button onClick={handleDeleteProject}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
              <Trash2 size={15} /> Supprimer
            </button>
          </div>
        )}
        {canExport && !canEdit && (
          <button onClick={handleExportReport} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors disabled:opacity-50">
            <Download size={15} /> {exporting ? 'Export...' : 'Exporter rapport'}
          </button>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Budget',       value: formatMillions(project.budget_xof), icon: DollarSign, color: 'text-blue-500' },
          { label: 'Dépensé',      value: formatMillions(project.spent_xof),  icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Bénéficiaires',value: project.beneficiaries.toLocaleString('fr-FR'), icon: Users, color: 'text-amber-500' },
          { label: 'Fin prévue',   value: formatDate(project.end_date),       icon: Calendar, color: overdue ? 'text-red-500' : 'text-slate-500' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={16} className={card.color} />
              <p className="text-xs text-slate-500 dark:text-slate-400">{card.label}</p>
            </div>
            <p className="font-bold text-slate-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Barre de progression globale */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${STATUS_COLORS[project.status]}`}>
              {STATUS_LABELS[project.status]}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {project.progress}% complété · Utilisation budget: {formatPercent(budgetUsage)}
            </span>
          </div>
        </div>
        <ProgressBar value={project.progress} size="lg" showLabel />
        <div className="mt-2">
          <ProgressBar value={budgetUsage} size="sm" color={budgetUsage > 90 ? 'red' : budgetUsage > 70 ? 'amber' : 'green'} />
          <p className="text-xs text-slate-400 mt-1">Utilisation du budget</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Vue générale ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Description</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              {project.description || 'Aucune description disponible.'}
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              {[
                { label: 'Région',  value: project.region,              icon: MapPin },
                { label: 'Secteur', value: project.sector,              icon: Tag },
                { label: 'Début',   value: formatDate(project.start_date), icon: Calendar },
                { label: 'Fin',     value: formatDate(project.end_date),   icon: Target },
              ].map(info => (
                <div key={info.label} className="flex items-center gap-2">
                  <info.icon size={14} className="text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">{info.label}</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{info.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Performance KPI</h3>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Radar name="KPI" dataKey="value" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Aucune métrique disponible</div>
            )}
          </div>
        </div>
      )}

      {/* ── Tâches ── */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {canEdit && (
              <button onClick={() => { resetTaskForm(); setEditingTask(null); setShowTaskForm(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-blue-400 transition-all">
                <Plus size={16} /> Nouvelle tâche
              </button>
            )}
          </div>
          {tasksLoading ? <PageLoader /> : tasks.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Aucune tâche pour ce projet.</div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{task.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TASK_STATUS_COLOR[task.status]}`}>
                          {STATUS_LABELS[task.status]}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mb-2">
                        <ProgressBar value={task.progress} showLabel size="sm" className="flex-1" />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1">
                        <button onClick={() => openEditTask(task)}
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                          <Edit size={14} />
                        </button>
                        <button onClick={async () => { await deleteTask(task.id); refetchTasks(); }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── KPI ── */}
      {activeTab === 'metrics' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-6">Indicateurs KPI</h3>
          {kpiBarData.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Aucun indicateur disponible.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {metrics.map(m => (
                  <div key={m.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{m.kpi_type.replace(/_/g, ' ').toUpperCase()}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {m.value}{m.unit && <span className="text-sm font-normal ml-1 text-slate-400">{m.unit}</span>}
                    </p>
                    {m.target_value > 0 && (
                      <p className="text-xs text-slate-400 mt-1">Cible: {m.target_value}{m.unit}</p>
                    )}
                    <p className="text-xs text-slate-400">{m.period_label}</p>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={kpiBarData} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#f1f5f9' }} />
                  <Bar dataKey="value" name="Valeur" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" name="Cible" fill="#10b98150" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      )}

      {/* ── Gantt (remplace le Gantt CSS manuel) ── */}
      {activeTab === 'gantt' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-6">Diagramme de Gantt</h3>
          <GanttView
            tasks={tasks}
            project={project}
            loading={tasksLoading}
            onUpdate={refetchTasks}
          />
        </div>
      )}

      {/* ── Documents ── */}
      {activeTab === 'documents' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <DocumentsPanel
            resourceType="project"
            resourceId={id!}
            canUpload={canEdit}
          />
        </div>
      )}

      {/* ── Commentaires ── */}
      {activeTab === 'comments' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <CommentsPanel
            resourceType="project"
            resourceId={id!}
          />
        </div>
      )}

      {/* ── Modals ── */}
      <Modal isOpen={showEditProject} onClose={() => setShowEditProject(false)} title={t('proj.edit')} size="lg">
        <ProjectForm project={project} onSuccess={() => { setShowEditProject(false); refetch(); }} onCancel={() => setShowEditProject(false)} />
      </Modal>

      <Modal isOpen={showTaskForm} onClose={() => { setShowTaskForm(false); setEditingTask(null); }}
        title={editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'} size="md">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Titre *</label>
            <input type="text" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))}
              className={inputClass} required placeholder="Titre de la tâche..." />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))}
              className={inputClass + ' resize-none'} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Statut</label>
              <select value={taskForm.status} onChange={e => setTaskForm(p => ({ ...p, status: e.target.value as TaskStatus }))} className={inputClass}>
                {(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'] as TaskStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Priorité</label>
              <select value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value as TaskPriority }))} className={inputClass}>
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as TaskPriority[]).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date de début</label>
              <input type="date" value={taskForm.start_date} onChange={e => setTaskForm(p => ({ ...p, start_date: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date limite</label>
              <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Avancement ({taskForm.progress}%)</label>
            <input type="range" min={0} max={100} value={taskForm.progress}
              onChange={e => setTaskForm(p => ({ ...p, progress: parseInt(e.target.value) }))}
              className="w-full accent-blue-600" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowTaskForm(false); setEditingTask(null); }}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
              Annuler
            </button>
            <button type="button" onClick={handleTaskSubmit}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-blue-400 transition-all">
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}