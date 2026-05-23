import { useEffect, useState, useMemo } from 'react';
import { Square as LogSquare, Filter, Download, Calendar, User, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuditLog, Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, clsx } from '../lib/utils';
import { PageLoader } from '../components/ui/LoadingSpinner';

interface AuditLogWithUser extends AuditLog {
  user?: Profile;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  LOGIN: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  LOGOUT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  EXPORT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  PERMISSION_CHANGE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const RESOURCE_ICONS: Record<string, string> = {
  projects: '📁',
  tasks: '✓',
  profiles: '👤',
  auth: '🔐',
  metrics: '📊',
  notifications: '🔔',
  comments: '💬',
};

export function AuditLogsPage() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<AuditLogWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);

  useEffect(() => {
    fetchLogs();
    fetchUsers();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    let query = supabase
      .from('audit_logs')
      .select('*, user:profiles(id, full_name, email)')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', new Date(`${endDate}T23:59:59`).toISOString());
    }
    if (actionFilter) {
      query = query.eq('action', actionFilter);
    }
    if (resourceFilter) {
      query = query.eq('table_name', resourceFilter);
    }
    if (userFilter) {
      query = query.eq('user_id', userFilter);
    }

    const { data } = await query;
    setLogs((data as AuditLogWithUser[]) || []);
    setLoading(false);
  }

  async function fetchUsers() {
    const { data } = await supabase.from('profiles').select('*');
    setUsers((data as Profile[]) || []);
  }

  const stats = useMemo(() => {
    const actions: Record<string, number> = {};
    const resources: Record<string, number> = {};
    logs.forEach(log => {
      actions[log.action] = (actions[log.action] || 0) + 1;
      resources[log.table_name] = (resources[log.table_name] || 0) + 1;
    });
    return { actions, resources };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (actionFilter && log.action !== actionFilter) return false;
      if (resourceFilter && log.table_name !== resourceFilter) return false;
      if (userFilter && log.user_id !== userFilter) return false;
      return true;
    });
  }, [logs, actionFilter, resourceFilter, userFilter]);

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <LogSquare size={48} className="text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Accès refusé</h2>
        <p className="text-slate-500 dark:text-slate-400">Seuls les administrateurs peuvent accéder aux journaux d'audit.</p>
      </div>
    );
  }

  if (loading) return <PageLoader />;

  const selectClass = "px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Journal d'audit</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {filteredLogs.length} événement(s) enregistré(s)
          </p>
        </div>
        <button
          onClick={() => {
            const csv = [
              ['Utilisateur', 'Action', 'Ressource', 'ID', 'Date'],
              ...filteredLogs.map(log => [
                log.user?.full_name || log.user?.email || 'Système',
                log.action,
                log.table_name,
                log.record_id || '—',
                formatDate(log.created_at),
              ]),
            ]
              .map(row => row.map(cell => `"${cell}"`).join(','))
              .join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors text-sm"
        >
          <Download size={16} /> Exporter CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(stats.actions).slice(0, 4).map(([action, count]) => (
          <div key={action} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white mb-2', {
              'bg-emerald-500': action === 'CREATE',
              'bg-blue-500': action === 'UPDATE',
              'bg-red-500': action === 'DELETE',
              'bg-green-500': action === 'LOGIN',
              'bg-orange-500': action === 'LOGOUT',
              'bg-purple-500': action === 'EXPORT',
              'bg-yellow-500': action === 'PERMISSION_CHANGE',
            })}>
              {action[0]}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{action}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{count}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-400" />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className={selectClass} placeholder="Date début" />
          <span className="text-slate-400">—</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className={selectClass} placeholder="Date fin" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-slate-400" />
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className={selectClass}>
            <option value="">Toutes actions</option>
            {Object.keys(stats.actions).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={resourceFilter} onChange={e => setResourceFilter(e.target.value)} className={selectClass}>
            <option value="">Toutes ressources</option>
            {Object.keys(stats.resources).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className={selectClass}>
            <option value="">Tous utilisateurs</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
          </select>
          <button onClick={() => { setStartDate(''); setEndDate(''); setActionFilter(''); setResourceFilter(''); setUserFilter(''); }}
            className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                {['Utilisateur', 'Action', 'Ressource', 'Détails', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    Aucun événement d'audit.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                          {(log.user?.full_name?.[0] || log.user?.email?.[0] || '?').toUpperCase()}
                        </div>
                        <span className="text-slate-900 dark:text-white text-sm font-medium max-w-40 truncate">
                          {log.user?.full_name || log.user?.email || 'Système'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600')}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <span className="text-lg">{RESOURCE_ICONS[log.table_name] || '📄'}</span>
                        <span className="text-sm font-medium">{log.table_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                        {log.record_id && <p className="font-mono truncate">ID: {log.record_id.slice(0, 8)}…</p>}
                        {log.changes && (
                          <details className="cursor-pointer">
                            <summary className="font-medium text-blue-500 dark:text-blue-400">
                              Afficher les modifications
                            </summary>
                            <pre className="text-xs mt-1 bg-slate-50 dark:bg-slate-900/50 p-2 rounded overflow-auto max-h-24">
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
