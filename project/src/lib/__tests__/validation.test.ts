/**
 * Validation Tests
 * Academic-ready tests for Zod validation schemas
 * 
 * Demonstrates: Runtime type checking, error handling, edge cases
 */

import {
  validateProject,
  validateProjectInput,
  validateTask,
  validateTaskInput,
  validateProfile,
  validateProjectFilters,
  validateTaskFilters,
  getValidationErrors,
  ProjectSchema,
  ProjectInputSchema,
  TaskSchema,
  TaskInputSchema,
  ProfileSchema,
} from '../validation';

/**
 * TEST FIXTURES
 * Valid test data for consistent testing
 */
const validProjectInput = {
  name: 'Projet Test',
  description: 'Description du projet',
  region: 'Bissau' as const,
  sector: 'Santé' as const,
  status: 'PLANNED' as const,
  budgetXof: 5000000,
  spentXof: 0,
  progress: 0,
  beneficiaries: 1000,
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 86400000).toISOString(),
};

const validProject = {
  ...validProjectInput,
  id: '550e8400-e29b-41d4-a716-446655440000',
  createdBy: '550e8400-e29b-41d4-a716-446655440001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isArchived: false,
};

const validTaskInput = {
  title: 'Tâche Test',
  description: 'Description de la tâche',
  projectId: '550e8400-e29b-41d4-a716-446655440000',
  status: 'TODO' as const,
  priority: 'MEDIUM' as const,
  dueDate: new Date(Date.now() + 86400000).toISOString(),
};

const validTask = {
  ...validTaskInput,
  id: '550e8400-e29b-41d4-a716-446655440002',
  createdBy: '550e8400-e29b-41d4-a716-446655440001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const validProfile = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  fullName: 'Jean Dupont',
  role: 'admin' as const,
  organizationId: '550e8400-e29b-41d4-a716-446655440003',
  email: 'jean@example.com',
  phone: '+245123456789',
  avatarUrl: 'https://example.com/avatar.jpg',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ============================================================================
// PROJECT INPUT VALIDATION TESTS
// ============================================================================

describe('ProjectInput Validation', () => {
  describe('validateProjectInput - Happy Path', () => {
    it('should validate correct project input', () => {
      // Act
      const result = validateProjectInput(validProjectInput);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual(expect.objectContaining({
        name: validProjectInput.name,
        region: validProjectInput.region,
        budgetXof: validProjectInput.budgetXof,
      }));
    });

    it('should validate with minimal required fields', () => {
      // Arrange
      const minimal = {
        name: 'Minimal Project',
        region: 'Bissau' as const,
        sector: 'Santé' as const,
        budgetXof: 1000000,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
      };

      // Act
      const result = validateProjectInput(minimal);

      // Assert
      expect(result).not.toBeNull();
    });
  });

  describe('validateProjectInput - Field Validation', () => {
    it('should reject missing name', () => {
      // Arrange
      const invalid = { ...validProjectInput, name: undefined };

      // Act
      const result = validateProjectInput(invalid);

      // Assert
      expect(result).toBeNull();
    });

    it('should reject name too short', () => {
      // Arrange
      const invalid = { ...validProjectInput, name: 'AB' };

      // Act
      const result = validateProjectInput(invalid);

      // Assert
      expect(result).toBeNull();
    });

    it('should reject invalid budget (negative)', () => {
      // Arrange
      const invalid = { ...validProjectInput, budgetXof: -1000 };

      // Act
      const result = validateProjectInput(invalid);

      // Assert
      expect(result).toBeNull();
    });

    it('should reject invalid region', () => {
      // Arrange
      const invalid = { ...validProjectInput, region: 'InvalidRegion' };

      // Act
      const result = validateProjectInput(invalid as any);

      // Assert
      expect(result).toBeNull();
    });

    it('should reject invalid sector', () => {
      // Arrange
      const invalid = { ...validProjectInput, sector: 'InvalidSector' };

      // Act
      const result = validateProjectInput(invalid as any);

      // Assert
      expect(result).toBeNull();
    });

    it('should reject invalid status', () => {
      // Arrange
      const invalid = { ...validProjectInput, status: 'INVALID_STATUS' };

      // Act
      const result = validateProjectInput(invalid as any);

      // Assert
      expect(result).toBeNull();
    });

    it('should allow spent >= 0', () => {
      // Arrange
      const valid = { ...validProjectInput, spentXof: 0 };

      // Act
      const result = validateProjectInput(valid);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.spentXof).toBe(0);
    });

    it('should reject spent < 0', () => {
      // Arrange
      const invalid = { ...validProjectInput, spentXof: -100 };

      // Act
      const result = validateProjectInput(invalid);

      // Assert
      expect(result).toBeNull();
    });

    it('should allow progress 0-100', () => {
      // Arrange & Act & Assert
      expect(validateProjectInput({ ...validProjectInput, progress: 0 })).not.toBeNull();
      expect(validateProjectInput({ ...validProjectInput, progress: 50 })).not.toBeNull();
      expect(validateProjectInput({ ...validProjectInput, progress: 100 })).not.toBeNull();
    });

    it('should reject progress outside 0-100', () => {
      // Arrange & Act & Assert
      expect(validateProjectInput({ ...validProjectInput, progress: -1 })).toBeNull();
      expect(validateProjectInput({ ...validProjectInput, progress: 101 })).toBeNull();
    });
  });
});

// ============================================================================
// TASK INPUT VALIDATION TESTS
// ============================================================================

describe('TaskInput Validation', () => {
  it('should validate correct task input', () => {
    // Act
    const result = validateTaskInput(validTaskInput);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.title).toBe(validTaskInput.title);
    expect(result?.status).toBe('TODO');
    expect(result?.priority).toBe('MEDIUM');
  });

  it('should reject missing title', () => {
    // Arrange
    const invalid = { ...validTaskInput, title: undefined };

    // Act
    const result = validateTaskInput(invalid);

    // Assert
    expect(result).toBeNull();
  });

  it('should reject invalid status', () => {
    // Arrange
    const invalid = { ...validTaskInput, status: 'INVALID' };

    // Act
    const result = validateTaskInput(invalid as any);

    // Assert
    expect(result).toBeNull();
  });

  it('should allow optional fields', () => {
    // Arrange
    const minimal = {
      title: 'Task',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    };

    // Act
    const result = validateTaskInput(minimal);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.priority).toBe('MEDIUM'); // default value
    expect(result?.status).toBe('TODO'); // default value
  });
});

// ============================================================================
// COMPLETE ENTITY VALIDATION TESTS
// ============================================================================

describe('Project Validation (Complete Entity)', () => {
  it('should validate complete project', () => {
    // Act
    const result = validateProject(validProject);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.id).toBe(validProject.id);
  });

  it('should reject missing id', () => {
    // Arrange
    const invalid = { ...validProject, id: undefined };

    // Act
    const result = validateProject(invalid);

    // Assert
    expect(result).toBeNull();
  });

  it('should reject invalid UUID', () => {
    // Arrange
    const invalid = { ...validProject, id: 'not-a-uuid' };

    // Act
    const result = validateProject(invalid);

    // Assert
    expect(result).toBeNull();
  });
});

describe('Task Validation (Complete Entity)', () => {
  it('should validate complete task', () => {
    // Act
    const result = validateTask(validTask);

    // Assert
    expect(result).not.toBeNull();
  });

  it('should reject missing id', () => {
    // Arrange
    const invalid = { ...validTask, id: undefined };

    // Act
    const result = validateTask(invalid);

    // Assert
    expect(result).toBeNull();
  });
});

// ============================================================================
// FILTER VALIDATION TESTS
// ============================================================================

describe('Filter Validation', () => {
  describe('validateProjectFilters', () => {
    it('should return empty object for null input', () => {
      // Act
      const result = validateProjectFilters(null);

      // Assert
      expect(result).toEqual({});
    });

    it('should validate valid filters', () => {
      // Arrange
      const filters = {
        search: 'test',
        status: 'IN_PROGRESS' as const,
        region: 'Bissau' as const,
        sector: 'Santé' as const,
      };

      // Act
      const result = validateProjectFilters(filters);

      // Assert
      expect(result.search).toBe('test');
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should ignore invalid filters gracefully', () => {
      // Arrange
      const filters = {
        search: 'test',
        status: 'INVALID_STATUS',
        unknownField: 'should be ignored',
      };

      // Act
      const result = validateProjectFilters(filters);

      // Assert
      expect(result.search).toBe('test');
      expect(result.status).toBeUndefined();
    });
  });

  describe('validateTaskFilters', () => {
    it('should validate task filters', () => {
      // Arrange
      const filters = {
        search: 'task',
        status: 'IN_PROGRESS' as const,
        projectId: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = validateTaskFilters(filters);

      // Assert
      expect(result.search).toBe('task');
      expect(result.status).toBe('IN_PROGRESS');
    });
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('Error Handling', () => {
  it('should extract validation errors correctly', () => {
    // Arrange
    const invalid = {
      name: 'AB', // too short
      budgetXof: -100, // negative
      region: 'InvalidRegion',
    };

    // Act
    const result = ProjectInputSchema.safeParse(invalid);

    if (!result.success) {
      const errors = getValidationErrors(result.error);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toHaveProperty('field');
      expect(errors[0]).toHaveProperty('message');
    } else {
      fail('Validation should have failed');
    }
  });

  it('should handle validation of non-object inputs', () => {
    // Act & Assert
    expect(validateProject(null)).toBeNull();
    expect(validateProject(undefined)).toBeNull();
    expect(validateProject('string')).toBeNull();
    expect(validateProject(123)).toBeNull();
    expect(validateProject([])).toBeNull();
  });
});

// ============================================================================
// PROFILE VALIDATION TESTS
// ============================================================================

describe('Profile Validation', () => {
  it('should validate valid profile', () => {
    // Act
    const result = validateProfile(validProfile);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.email).toBe(validProfile.email);
  });

  it('should reject invalid email', () => {
    // Arrange
    const invalid = { ...validProfile, email: 'not-an-email' };

    // Act
    const result = validateProfile(invalid);

    // Assert
    expect(result).toBeNull();
  });

  it('should reject invalid role', () => {
    // Arrange
    const invalid = { ...validProfile, role: 'invalid_role' };

    // Act
    const result = validateProfile(invalid as any);

    // Assert
    expect(result).toBeNull();
  });

  it('should allow optional avatar', () => {
    // Arrange
    const noAvatar = { ...validProfile, avatarUrl: null };

    // Act
    const result = validateProfile(noAvatar);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.avatarUrl).toBeNull();
  });
});
