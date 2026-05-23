// src/lib/permissions.ts
// RBAC complet — 4 rôles : admin | chef_projet | decideur | public
// Cohérent avec App.tsx (RoleRoute), schema.prisma (UserRole enum)
// et permissions.test.ts
// =============================================================================
// MATRICE DES PERMISSIONS PAR RÔLE
// Exporté pour les tests (permissions.test.ts l'importe)
// =============================================================================
export const ROLE_PERMISSIONS = {
    admin: {
        'projects:create': true,
        'projects:read': true,
        'projects:update': true,
        'projects:delete': true,
        'tasks:create': true,
        'tasks:read': true,
        'tasks:update': true,
        'tasks:delete': true,
        'metrics:read': true,
        'users:manage': true,
        'audit_logs:read': true,
        'documents:upload': true,
        'documents:delete': true,
        'bi:read': true,
    },
    chef_projet: {
        'projects:create': true,
        'projects:read': true,
        'projects:update': true, // ses propres projets (vérifié côté RLS)
        'projects:delete': false,
        'tasks:create': true,
        'tasks:read': true,
        'tasks:update': true,
        'tasks:delete': true, // ses propres tâches (vérifié côté RLS)
        'metrics:read': true,
        'users:manage': false,
        'audit_logs:read': false,
        'documents:upload': true,
        'documents:delete': true, // ses propres documents
        'bi:read': true,
    },
    decideur: {
        'projects:create': false,
        'projects:read': true,
        'projects:update': false,
        'projects:delete': false,
        'tasks:create': false,
        'tasks:read': true,
        'tasks:update': false,
        'tasks:delete': false,
        'metrics:read': true,
        'users:manage': false,
        'audit_logs:read': false,
        'documents:upload': false,
        'documents:delete': false,
        'bi:read': true,
    },
    public: {
        'projects:create': false,
        'projects:read': false, // accès via /public uniquement (page dédiée)
        'projects:update': false,
        'projects:delete': false,
        'tasks:create': false,
        'tasks:read': false,
        'tasks:update': false,
        'tasks:delete': false,
        'metrics:read': false,
        'users:manage': false,
        'audit_logs:read': false,
        'documents:upload': false,
        'documents:delete': false,
        'bi:read': false,
    },
};
// =============================================================================
// FONCTION GÉNÉRIQUE
// =============================================================================
export function hasPermission(role, permission) {
    if (!role)
        return false;
    return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}
// =============================================================================
// HELPERS SÉMANTIQUES — utilisés dans les composants
// =============================================================================
export function canCreateProject(role) {
    return hasPermission(role, 'projects:create');
}
export function canViewProject(role) {
    return hasPermission(role, 'projects:read');
}
export function canEditProject(role) {
    return hasPermission(role, 'projects:update');
}
export function canDeleteProject(role) {
    return hasPermission(role, 'projects:delete');
}
export function canManageUsers(role) {
    return hasPermission(role, 'users:manage');
}
/** Alias cohérent avec permissions.test.ts (canViewAudit, pas canViewAuditLogs) */
export function canViewAudit(role) {
    return hasPermission(role, 'audit_logs:read');
}
/** @deprecated Utiliser canViewAudit à la place */
export const canViewAuditLogs = canViewAudit;
export function canUploadDocuments(role) {
    return hasPermission(role, 'documents:upload');
}
export function canDeleteDocument(role) {
    return hasPermission(role, 'documents:delete');
}
export function canViewBI(role) {
    return hasPermission(role, 'bi:read');
}
export function canCreateTask(role) {
    return hasPermission(role, 'tasks:create');
}
export function canEditTask(role) {
    return hasPermission(role, 'tasks:update');
}
export function canDeleteTask(role) {
    return hasPermission(role, 'tasks:delete');
}
// =============================================================================
// CHECKS COMBINÉS — pour les guards dans les composants
// =============================================================================
/** Peut modifier un projet (admin toujours, chef_projet seulement le sien) */
export function canEditProjectRecord(role, projectCreatedBy, currentUserId) {
    if (!role)
        return false;
    if (role === 'admin')
        return true;
    if (role === 'chef_projet')
        return projectCreatedBy === currentUserId;
    return false;
}
/** Peut voir le dashboard BI */
export function canAccessBI(role) {
    return hasPermission(role, 'bi:read');
}
/** Peut accéder aux pages admin */
export function canAccessAdmin(role) {
    return role === 'admin';
}
// =============================================================================
// CHECKS REGROUPÉS (objet utile pour les composants qui testent plusieurs perms)
// =============================================================================
export const PERMISSION_CHECKS = {
    hasPermission,
    canCreateProject,
    canViewProject,
    canEditProject,
    canDeleteProject,
    canManageUsers,
    canViewAudit,
    canViewAuditLogs,
    canUploadDocuments,
    canDeleteDocument,
    canViewBI,
    canCreateTask,
    canEditTask,
    canDeleteTask,
    canEditProjectRecord,
    canAccessBI,
    canAccessAdmin,
};
