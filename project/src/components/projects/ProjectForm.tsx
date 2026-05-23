import { useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { Project, REGIONS, SECTORS, STATUSES, ProjectStatus, ProjectRegion, ProjectSector, StrategicAxis, STRATEGIC_AXES, STRATEGIC_AXIS_DESCRIPTIONS, STRATEGIC_AXIS_LABELS } from '../../types';
import { createProject, updateProject } from '../../hooks/useProjects';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { AlertCircle } from 'lucide-react';

interface ProjectFormProps {
  project?: Project;
  onSuccess: () => void;
  onCancel: () => void;
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: 'Planifié',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  SUSPENDED: 'Suspendu',
  CANCELLED: 'Annulé',
};

export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    budget_xof: project?.budget_xof || 0,
    spent_xof: project?.spent_xof || 0,
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
    status: project?.status || 'PLANNED' as ProjectStatus,
    region: project?.region || 'Bissau' as ProjectRegion,
    sector: project?.sector || 'Governance' as ProjectSector,
    strategic_axis: project?.strategic_axis || 'e_gouvernement' as StrategicAxis,
    is_public: project?.is_public ?? true,
    progress: project?.progress || 0,
    beneficiaries: project?.beneficiaries || 0,
  });

  function handleChange(field: string, value: string | number | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setLoading(true);
    try {
      if (project) {
        const { error } = await updateProject(project.id, form, user.id);
        if (error) throw error;
      } else {
        const { error } = await createProject(form, user.id);
        if (error) throw error;
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-700 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className={labelClass}>{t('proj.name')} *</label>
        <input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)}
          className={inputClass} required placeholder="Nom du projet..." />
      </div>

      <div>
        <label className={labelClass}>{t('proj.description')}</label>
        <textarea value={form.description} onChange={e => handleChange('description', e.target.value)}
          className={inputClass + ' resize-none'} rows={3} placeholder="Description du projet..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t('proj.budget')} *</label>
          <input type="number" value={form.budget_xof} onChange={e => handleChange('budget_xof', parseInt(e.target.value) || 0)}
            className={inputClass} required min={0} />
        </div>
        <div>
          <label className={labelClass}>{t('proj.spent')}</label>
          <input type="number" value={form.spent_xof} onChange={e => handleChange('spent_xof', parseInt(e.target.value) || 0)}
            className={inputClass} min={0} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t('proj.startDate')} *</label>
          <input type="date" value={form.start_date} onChange={e => handleChange('start_date', e.target.value)}
            className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>{t('proj.endDate')} *</label>
          <input type="date" value={form.end_date} onChange={e => handleChange('end_date', e.target.value)}
            className={inputClass} required />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>{t('proj.status')}</label>
          <select value={form.status} onChange={e => handleChange('status', e.target.value)} className={inputClass}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>{t('proj.region')}</label>
          <select value={form.region} onChange={e => handleChange('region', e.target.value)} className={inputClass}>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>{t('proj.sector')}</label>
          <select value={form.sector} onChange={e => handleChange('sector', e.target.value)} className={inputClass}>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Axe stratégique numérique</label>
        <select
          value={form.strategic_axis}
          onChange={e => handleChange('strategic_axis', e.target.value as StrategicAxis)}
          className={inputClass}
        >
          {STRATEGIC_AXES.map(axis => (
            <option key={axis} value={axis}>{STRATEGIC_AXIS_LABELS[axis]}</option>
          ))}
        </select>
        <p className="mt-2 text-sm italic text-slate-500 dark:text-slate-400">
          {STRATEGIC_AXIS_DESCRIPTIONS[form.strategic_axis]}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="is_public"
          type="checkbox"
          checked={form.is_public}
          onChange={e => handleChange('is_public', e.target.checked)}
          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="is_public" className="text-sm text-slate-700 dark:text-slate-300">
          Projet public visible sur le portail citoyen
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t('proj.progress')} ({form.progress}%)</label>
          <input type="range" min={0} max={100} value={form.progress}
            onChange={e => handleChange('progress', parseInt(e.target.value))}
            className="w-full accent-blue-600" />
        </div>
        <div>
          <label className={labelClass}>{t('proj.beneficiaries')}</label>
          <input type="number" value={form.beneficiaries} onChange={e => handleChange('beneficiaries', parseInt(e.target.value) || 0)}
            className={inputClass} min={0} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
          {t('proj.cancel')}
        </button>
        <button type="submit" disabled={loading}
          className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center gap-2 transition-all shadow-md shadow-blue-500/20">
          {loading && <LoadingSpinner size="sm" />}
          {t('proj.save')}
        </button>
      </div>
    </form>
  );
}
