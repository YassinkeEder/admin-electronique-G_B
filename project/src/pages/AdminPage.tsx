import { useState, useEffect } from 'react';
import { Users, Shield, Activity, CheckCircle2, XCircle, CreditCard as Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { formatDate } from '../lib/utils';

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  chef_projet: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  decideur: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  public: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  chef_projet: 'Chef de Projet',
  decideur: 'Décideur',
  public: 'Public',
};

export function AdminPage() {
  const { profile: currentProfile } = useAuth();
  const { t } = useI18n();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('public');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, byRole: {} as Record<string, number> });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const users = (data as Profile[]) || [];
    setUsers(users);
    const byRole: Record<string, number> = {};
    users.forEach(u => { byRole[u.role] = (byRole[u.role] || 0) + 1; });
    setStats({ total: users.length, active: users.filter(u => u.is_active).length, byRole });
    setLoading(false);
  }

  async function handleUpdateRole() {
    if (!editingUser) return;
    setSaving(true);
    await supabase.from('profiles').update({ role: selectedRole }).eq('id', editingUser.id);
    setSaving(false);
    setEditingUser(null);
    fetchUsers();
  }

  async function toggleActive(user: Profile) {
    await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id);
    fetchUsers();
  }

  if (currentProfile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Shield size={48} className="text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Accès refusé</h2>
        <p className="text-slate-500 dark:text-slate-400">Vous n'avez pas les droits nécessaires.</p>
      </div>
    );
  }

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('nav.admin')}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Gestion des utilisateurs et des accès</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Users size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total utilisateurs</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Actifs</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.active}</p>
            </div>
          </div>
        </div>
        {Object.entries(stats.byRole).slice(0, 2).map(([role, count]) => (
          <div key={role} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                <Shield size={18} className="text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{ROLE_LABELS[role as UserRole] || role}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{count as number}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users size={18} className="text-blue-500" />
            {t('admin.users')}
          </h3>
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Temps réel</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                {['Utilisateur', 'Email', 'Rôle', 'Département', 'Statut', 'Inscrit le', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {(user.full_name || user.email || '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white truncate max-w-32">{user.full_name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{user.department || '—'}</td>
                  <td className="px-4 py-3">
                    {user.is_active ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                        <CheckCircle2 size={13} /> Actif
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                        <XCircle size={13} /> Inactif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {user.id !== currentProfile?.id && (
                        <>
                          <button
                            onClick={() => { setEditingUser(user); setSelectedRole(user.role); }}
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Modifier le rôle"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => toggleActive(user)}
                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            title={user.is_active ? 'Désactiver' : 'Activer'}
                          >
                            {user.is_active ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Modifier le rôle utilisateur" size="sm">
        {editingUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {(editingUser.full_name || editingUser.email || '?')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{editingUser.full_name || 'Sans nom'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{editingUser.email}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nouveau rôle</label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {(['admin', 'chef_projet', 'decideur', 'public'] as UserRole[]).map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                Annuler
              </button>
              <button onClick={handleUpdateRole} disabled={saving}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl text-sm disabled:opacity-50 hover:from-blue-500 hover:to-blue-400 transition-all">
                {saving ? 'Enregistrement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
