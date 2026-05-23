// src/App.tsx
// Corrections par rapport à l'original :
//   1. Route /public ajoutée (RootRedirect y envoie le rôle 'public')
//   2. PublicDashboardPage définie inline (à extraire dans pages/ si elle grossit)
//   3. La route /* ne redirige plus vers /dashboard (évite boucle pour 'public')
//      mais vers / (RootRedirect gère ensuite selon le rôle)

import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FilterProvider } from './contexts/FilterContext';
import { ErrorBoundary } from './components/ErrorBoundary';
const Layout = lazy(() => import('./components/layout/Layout').then(m => ({ default: m.Layout })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const TasksPage = lazy(() => import('./pages/TasksPage').then(m => ({ default: m.TasksPage })));
const BIPage = lazy(() => import('./pages/BIPage').then(m => ({ default: m.BIPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));
const GanttPage = lazy(() => import('./pages/GanttPage').then(m => ({ default: m.GanttPage })));
const HighRiskPage = lazy(() => import('./pages/HighRiskPage').then(m => ({ default: m.HighRiskPage })));
const PublicTransparencyPage = lazy(() => import('./pages/PublicTransparencyPage').then(m => ({ default: m.PublicTransparencyPage })));
import { PageLoader } from './components/ui/LoadingSpinner';
import type { UserRole } from './types';

// =============================================================================
// PUBLIC DASHBOARD — vue lecture seule pour rôle 'public'
// Pas de layout complet (pas de sidebar), juste les projets publics
// À déplacer dans src/pages/PublicDashboardPage.tsx quand elle grossit
// =============================================================================

function PublicDashboardPage() {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header minimal */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                E-GovProjetGB
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tableau de bord public — Guinée-Bissau
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {profile?.full_name || 'Visiteur'}
            </span>
            <Link
              to="/login"
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              Connexion
            </Link>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Accès public en lecture seule
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                Vous consultez les projets publics de l'État. Pour accéder aux
                fonctionnalités complètes, connectez-vous avec un compte autorisé.
              </p>
            </div>
          </div>
        </div>

        {/* Projets publics — composant réutilisé en lecture seule */}
        {/* ProjectsPage gère déjà le cas où canEdit = false */}
        <ProjectsPage publicView />
      </main>
    </div>
  );
}

// =============================================================================
// GUARDS DE ROUTES
// =============================================================================

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <PageLoader />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <PageLoader />
    </div>
  );
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RoleRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) {
  const { profile, loading, user } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <PageLoader />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/dashboard" replace state={{ error: 'Profil non chargé' }} />;

  if (!allowedRoles.includes(profile.role)) {
    // Rôle public redirigé vers /public, pas /dashboard
    return <Navigate to={profile.role === 'public' ? '/public' : '/dashboard'} replace />;
  }

  return <>{children}</>;
}

/** Point d'entrée : redirige selon le rôle */
function RootRedirect() {
  const { profile, loading, user } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <PageLoader />
    </div>
  );

  // Non connecté → login
  if (!user) return <Navigate to="/login" replace />;

  // Rôle public → dashboard public dédié (sans sidebar, sans routes protégées)
  if (profile?.role === 'public') return <Navigate to="/public" replace />;

  // Tous les autres rôles → dashboard principal
  return <Navigate to="/dashboard" replace />;
}

// =============================================================================
// ROUTES
// =============================================================================

function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center"><PageLoader /></div>}>
      <Routes>
      {/* Racine : redirige selon rôle */}
      <Route path="/" element={<RootRedirect />} />

      {/* Auth */}
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/transparency" element={<PublicTransparencyPage />} />

      {/* ── Dashboard public (rôle 'public') ──────────────────────────────── */}
      {/* Accessible uniquement si connecté avec role=public */}
      <Route
        path="/public"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['public']}>
              <PublicDashboardPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* ── Application principale (layout avec sidebar) ───────────────────── */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {/* Empêcher le rôle public d'accéder au layout complet */}
            <RoleRoute allowedRoles={['admin', 'chef_projet', 'decideur']}>
              <Layout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route path="dashboard"       element={<DashboardPage />} />
        <Route path="projects"        element={<ProjectsPage />} />
        <Route path="projects/:id"    element={<ProjectDetailPage />} />
        <Route path="timeline"        element={<GanttPage />} />
        <Route path="high-risk"       element={<HighRiskPage />} />

        <Route path="tasks" element={
          <RoleRoute allowedRoles={['admin', 'chef_projet', 'decideur']}>
            <TasksPage />
          </RoleRoute>
        } />

        <Route path="bi" element={
          <RoleRoute allowedRoles={['admin', 'chef_projet', 'decideur']}>
            <BIPage />
          </RoleRoute>
        } />

        <Route path="admin" element={
          <RoleRoute allowedRoles={['admin']}>
            <AdminPage />
          </RoleRoute>
        } />

        <Route path="audit-logs" element={
          <RoleRoute allowedRoles={['admin']}>
            <AuditLogsPage />
          </RoleRoute>
        } />
      </Route>

      {/* Fallback : retour à la racine (RootRedirect gère ensuite) */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

// =============================================================================
// APP ROOT
// =============================================================================

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <I18nProvider>
            <FilterProvider>
              <AuthProvider>
                <AppRoutes />
              </AuthProvider>
            </FilterProvider>
          </I18nProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}