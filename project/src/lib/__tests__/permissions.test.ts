import type { UserRole } from '../../types/index';

import {
  hasPermission,
  canViewAudit,
  canCreateProject,
  canViewProject,
  canEditProject,
  canDeleteProject,
  canManageUsers,
  canUploadDocuments,
  canDeleteDocument,
  canViewBI,
  canCreateTask,
  canEditTask,
  canDeleteTask,
  canEditProjectRecord,
  canAccessAdmin,
  ROLE_PERMISSIONS,
} from '../permissions';

// =============================================================================
// ROLE_PERMISSIONS - structure
// =============================================================================

describe('ROLE_PERMISSIONS', () => {
  const roles: UserRole[] = ['admin', 'chef_projet', 'decideur', 'public'];

  it('existe et contient les 4 roles', () => {
    roles.forEach(role => {
      expect(ROLE_PERMISSIONS).toHaveProperty(role);
    });
  });

  it('chaque role a toutes les cles de permission', () => {
    const expectedKeys = [
      'projects:create', 'projects:read', 'projects:update', 'projects:delete',
      'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
      'metrics:read', 'users:manage', 'audit_logs:read',
      'documents:upload', 'documents:delete', 'bi:read',
    ];

    roles.forEach(role => {
      expectedKeys.forEach(key => {
        expect(ROLE_PERMISSIONS[role]).toHaveProperty(key);
        expect(typeof ROLE_PERMISSIONS[role][key]).toBe('boolean');
      });
    });
  });
});

// =============================================================================
// hasPermission
// =============================================================================

describe('hasPermission', () => {
  it('retourne false si role est null', () => {
    expect(hasPermission(null, 'projects:read')).toBe(false);
  });

  it('retourne false si role est undefined', () => {
    expect(hasPermission(undefined, 'projects:read')).toBe(false);
  });

  it('retourne false si permission inconnue', () => {
    expect(hasPermission('admin', 'inexistant:action')).toBe(false);
  });

  it('admin a projects:delete', () => {
    expect(hasPermission('admin', 'projects:delete')).toBe(true);
  });

  it("public n'a aucune permission", () => {
    const perms = ROLE_PERMISSIONS.public;
    Object.values(perms).forEach(val => {
      expect(val).toBe(false);
    });
  });
});

// =============================================================================
// canViewAudit
// =============================================================================

describe('canViewAudit', () => {
  it('admin peut voir les audits', () => {
    expect(canViewAudit('admin')).toBe(true);
  });

  it('chef_projet ne peut pas voir les audits', () => {
    expect(canViewAudit('chef_projet')).toBe(false);
  });

  it('decideur ne peut pas voir les audits', () => {
    expect(canViewAudit('decideur')).toBe(false);
  });

  it('public ne peut pas voir les audits', () => {
    expect(canViewAudit('public')).toBe(false);
  });

  it('retourne false si role null', () => {
    expect(canViewAudit(null)).toBe(false);
  });
});

// =============================================================================
// canCreateProject
// =============================================================================

describe('canCreateProject', () => {
  it('admin peut creer', () => expect(canCreateProject('admin')).toBe(true));
  it('chef_projet peut creer', () => expect(canCreateProject('chef_projet')).toBe(true));
  it('decideur ne peut pas creer', () => expect(canCreateProject('decideur')).toBe(false));
  it('public ne peut pas creer', () => expect(canCreateProject('public')).toBe(false));
});

// =============================================================================
// canViewProject
// =============================================================================

describe('canViewProject', () => {
  it('admin peut voir', () => expect(canViewProject('admin')).toBe(true));
  it('chef_projet peut voir', () => expect(canViewProject('chef_projet')).toBe(true));
  it('decideur peut voir', () => expect(canViewProject('decideur')).toBe(true));
  it('public ne peut pas voir les projets directement', () => {
    expect(canViewProject('public')).toBe(false);
  });
});

// =============================================================================
// canEditProject / canDeleteProject
// =============================================================================

describe('canEditProject', () => {
  it('admin peut modifier', () => expect(canEditProject('admin')).toBe(true));
  it('chef_projet peut modifier', () => expect(canEditProject('chef_projet')).toBe(true));
  it('decideur ne peut pas modifier', () => expect(canEditProject('decideur')).toBe(false));
  it('public ne peut pas modifier', () => expect(canEditProject('public')).toBe(false));
});

describe('canDeleteProject', () => {
  it('admin peut supprimer', () => expect(canDeleteProject('admin')).toBe(true));
  it('chef_projet ne peut pas supprimer', () => expect(canDeleteProject('chef_projet')).toBe(false));
  it('decideur ne peut pas supprimer', () => expect(canDeleteProject('decideur')).toBe(false));
  it('public ne peut pas supprimer', () => expect(canDeleteProject('public')).toBe(false));
});

// =============================================================================
// canManageUsers
// =============================================================================

describe('canManageUsers', () => {
  it('admin peut gerer les users', () => expect(canManageUsers('admin')).toBe(true));
  it('chef_projet ne peut pas gerer les users', () => expect(canManageUsers('chef_projet')).toBe(false));
  it('decideur ne peut pas gerer les users', () => expect(canManageUsers('decideur')).toBe(false));
  it('public ne peut pas gerer les users', () => expect(canManageUsers('public')).toBe(false));
});

// =============================================================================
// Documents
// =============================================================================

describe('canUploadDocuments', () => {
  it('admin peut uploader', () => expect(canUploadDocuments('admin')).toBe(true));
  it('chef_projet peut uploader', () => expect(canUploadDocuments('chef_projet')).toBe(true));
  it('decideur ne peut pas uploader', () => expect(canUploadDocuments('decideur')).toBe(false));
  it('public ne peut pas uploader', () => expect(canUploadDocuments('public')).toBe(false));
});

describe('canDeleteDocument', () => {
  it('admin peut supprimer', () => expect(canDeleteDocument('admin')).toBe(true));
  it('chef_projet peut supprimer', () => expect(canDeleteDocument('chef_projet')).toBe(true));
  it('decideur ne peut pas supprimer', () => expect(canDeleteDocument('decideur')).toBe(false));
  it('public ne peut pas supprimer', () => expect(canDeleteDocument('public')).toBe(false));
});

// =============================================================================
// BI
// =============================================================================

describe('canViewBI', () => {
  it('admin peut voir BI', () => expect(canViewBI('admin')).toBe(true));
  it('chef_projet peut voir BI', () => expect(canViewBI('chef_projet')).toBe(true));
  it('decideur peut voir BI', () => expect(canViewBI('decideur')).toBe(true));
  it('public ne peut pas voir BI', () => expect(canViewBI('public')).toBe(false));
});

// =============================================================================
// Tasks
// =============================================================================

describe('canCreateTask', () => {
  it('admin peut creer', () => expect(canCreateTask('admin')).toBe(true));
  it('chef_projet peut creer', () => expect(canCreateTask('chef_projet')).toBe(true));
  it('decideur ne peut pas creer', () => expect(canCreateTask('decideur')).toBe(false));
  it('public ne peut pas creer', () => expect(canCreateTask('public')).toBe(false));
});

describe('canEditTask', () => {
  it('admin peut modifier', () => expect(canEditTask('admin')).toBe(true));
  it('chef_projet peut modifier', () => expect(canEditTask('chef_projet')).toBe(true));
  it('decideur ne peut pas modifier', () => expect(canEditTask('decideur')).toBe(false));
});

describe('canDeleteTask', () => {
  it('admin peut supprimer', () => expect(canDeleteTask('admin')).toBe(true));
  it('chef_projet peut supprimer', () => expect(canDeleteTask('chef_projet')).toBe(true));
  it('decideur ne peut pas supprimer', () => expect(canDeleteTask('decideur')).toBe(false));
  it('public ne peut pas supprimer', () => expect(canDeleteTask('public')).toBe(false));
});

// =============================================================================
// canEditProjectRecord - ownership check
// =============================================================================

describe('canEditProjectRecord', () => {
  const USER_A = 'user-uuid-aaa';
  const USER_B = 'user-uuid-bbb';

  it("admin peut editer n'importe quel projet", () => {
    expect(canEditProjectRecord('admin', USER_B, USER_A)).toBe(true);
  });

  it('chef_projet peut editer son propre projet', () => {
    expect(canEditProjectRecord('chef_projet', USER_A, USER_A)).toBe(true);
  });

  it("chef_projet ne peut pas editer le projet d'un autre", () => {
    expect(canEditProjectRecord('chef_projet', USER_A, USER_B)).toBe(false);
  });

  it('decideur ne peut pas editer', () => {
    expect(canEditProjectRecord('decideur', USER_A, USER_A)).toBe(false);
  });

  it('public ne peut pas editer', () => {
    expect(canEditProjectRecord('public', USER_A, USER_A)).toBe(false);
  });

  it('retourne false si role null', () => {
    expect(canEditProjectRecord(null, USER_A, USER_A)).toBe(false);
  });

  it('retourne false si createdBy null', () => {
    expect(canEditProjectRecord('chef_projet', null, USER_A)).toBe(false);
  });
});

// =============================================================================
// canAccessAdmin
// =============================================================================

describe('canAccessAdmin', () => {
  it('admin accede a la page admin', () => expect(canAccessAdmin('admin')).toBe(true));
  it("chef_projet n'y accede pas", () => expect(canAccessAdmin('chef_projet')).toBe(false));
  it("decideur n'y accede pas", () => expect(canAccessAdmin('decideur')).toBe(false));
  it("public n'y accede pas", () => expect(canAccessAdmin('public')).toBe(false));
});

// =============================================================================
// Coherence hierarchique
// =============================================================================

describe('coherence hierarchique', () => {
  const allPermissions = Object.keys(ROLE_PERMISSIONS.admin);

  it('admin a au moins autant de permissions que chef_projet', () => {
    allPermissions.forEach(perm => {
      if (ROLE_PERMISSIONS.chef_projet[perm]) {
        expect(ROLE_PERMISSIONS.admin[perm]).toBe(true);
      }
    });
  });

  it('chef_projet a au moins autant de permissions que decideur', () => {
    allPermissions.forEach(perm => {
      if (ROLE_PERMISSIONS.decideur[perm]) {
        expect(ROLE_PERMISSIONS.chef_projet[perm]).toBe(true);
      }
    });
  });

  it("public n'a aucune permission", () => {
    allPermissions.forEach(perm => {
      expect(ROLE_PERMISSIONS.public[perm]).toBe(false);
    });
  });
});
