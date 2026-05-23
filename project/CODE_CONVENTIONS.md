/**
 * CODE CONVENTIONS & STANDARDS
 * E-GovProjetGB Frontend Code Guide
 * 
 * Academic Note: These conventions ensure code quality,
 * consistency, and maintainability across the project.
 */

// ============================================================================
// 1. TYPE SAFETY CONVENTIONS
// ============================================================================

// ✅ DO: Use discriminated unions for status types
type ProjectAction = 
  | { type: 'create'; payload: ProjectInput }
  | { type: 'update'; payload: { id: string; data: Partial<ProjectInput> } }
  | { type: 'delete'; payload: string };

// ❌ DON'T: Use generic string types
// type ProjectAction = { type: string; payload: any };

// ✅ DO: Export types properly typed from functions
import type { FC } from 'react';
type ProjectCardProps = {
  project: Project;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export const ProjectCard: FC<ProjectCardProps> = ({ project, onEdit, onDelete }) => {
  // Component implementation
  return null;
};

// ❌ DON'T: Use implicit any types
// export const ProjectCard = ({ project, onEdit, onDelete }) => { }

// ============================================================================
// 2. ERROR HANDLING CONVENTIONS
// ============================================================================

// ✅ DO: Consistent async error handling pattern
async function fetchProjects() {
  try {
    setLoading(true);
    const { data, error } = await supabase.from('projects').select('*');
    
    if (error) throw error;
    if (!data) throw new Error('No data returned');
    
    setProjects(data);
    setError(null);
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setError(message);
    console.error('fetchProjects failed:', err);
    return null;
  } finally {
    setLoading(false);
  }
}

// ❌ DON'T: Silent failures
// const { data } = await supabase.from('projects').select('*');
// if (data) setProjects(data); // What about error?

// ✅ DO: Validate before using data
function handleProjectData(data: unknown) {
  const validated = validateProject(data);
  if (!validated) {
    throw new Error('Invalid project data');
  }
  return validated;
}

// ❌ DON'T: Unsafe type assertions
// const project = (data as Project);

// ============================================================================
// 3. COMPONENT CONVENTIONS
// ============================================================================

// ✅ DO: Clear prop interface, use React.FC
interface ProjectFormProps {
  projectId?: string;
  onSubmit: (data: ProjectInput) => Promise<void>;
  onCancel: () => void;
}

export const ProjectForm: FC<ProjectFormProps> = ({ 
  projectId, 
  onSubmit, 
  onCancel 
}) => {
  // Implementation
  return null;
};

// ✅ DO: Export component as default AND named
export default ProjectForm;

// ❌ DON'T: Use "any" types or Props suffix inconsistently
// export const ProjectForm = ({ projectId, onSubmit, onCancel }: any) => {}

// ============================================================================
// 4. HOOK CONVENTIONS
// ============================================================================

// ✅ DO: Consistent hook return pattern
function useProjects(filters?: ProjectFilters) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch logic
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filters]); // Proper dependencies

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { projects, loading, error, refetch: fetch };
}

// ✅ DO: Memoize dependencies to prevent infinite loops
function useFilteredProjects(filters: ProjectFilters) {
  const memoizedFilters = useMemo(
    () => filters,
    [filters?.status, filters?.region, filters?.sector]
  );

  return useProjects(memoizedFilters);
}

// ✅ DO: Document hook return values
/**
 * Fetch projects from database
 * @param filters - Optional project filters
 * @returns { projects, loading, error, refetch }
 */
function useProjects(filters?: ProjectFilters) {
  // Implementation
  return { projects: [], loading: false, error: null, refetch: () => {} };
}

// ❌ DON'T: Forget cleanup or create memory leaks
// useEffect(() => {
//   const subscription = supabase.channel('changes').subscribe();
//   // Missing cleanup!
// }, []);

// ============================================================================
// 5. STATE MANAGEMENT CONVENTIONS
// ============================================================================

// ✅ DO: Use Context for cross-cutting concerns
type FilterContextType = {
  filters: ProjectFilters;
  setFilters: (filters: ProjectFilters) => void;
};

export const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within FilterProvider');
  }
  return context;
};

// ✅ DO: Keep state close to where it's used
function ProjectList() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // selectedId only used in this component
}

// ❌ DON'T: Prop drill multiple levels
// <ProjectGrid projects={projects} filters={filters} onFilter={onFilter} ... />

// ============================================================================
// 6. API/ASYNC CONVENTIONS
// ============================================================================

// ✅ DO: Separate API calls from components
async function createProject(data: ProjectInput, userId: string) {
  const validated = validateProjectInput(data);
  if (!validated) throw new Error('Invalid project data');

  const { data: result, error } = await supabase
    .from('projects')
    .insert([{ ...validated, createdBy: userId }])
    .select()
    .single();

  if (error) throw error;
  return validateProject(result);
}

// ✅ DO: Use consistent error messages
throw new Error('Failed to create project: Invalid input');

// ❌ DON'T: Mix API logic with component logic
// function ProjectForm() {
//   async function handleSubmit() {
//     const { data } = await supabase.from('projects').insert(...);
//   }
// }

// ============================================================================
// 7. NAMING CONVENTIONS
// ============================================================================

// ✅ DO: Consistent naming patterns
const PROJECT_API_ENDPOINTS = {
  list: '/api/projects',
  create: '/api/projects',
  update: (id: string) => `/api/projects/${id}`,
  delete: (id: string) => `/api/projects/${id}`,
};

// Hook functions: use[Feature]
// function useProjects() {}
// function useTasks() {}
// function useMetrics() {}

// Event handlers: handle[Action][Target]
// const handleProjectCreate = () => {}
// const handleFilterChange = () => {}
// const handleDeleteClick = () => {}

// Permission checks: can[Action][Resource]
// canViewProject(), canCreateTask(), canDeleteProject()

// Getters: get[Data]
// getProjectMetrics(), getUserPermissions(), getTaskStats()

// Validators: validate[Type]
// validateProject(), validateTaskInput(), validateProfile()

// ✅ DO: Use consistent file naming
// components/ProjectCard.tsx (PascalCase for components)
// hooks/useProjects.ts (camelCase with 'use' prefix)
// lib/permissions.ts (camelCase for utilities)
// types/index.ts (camelCase for index files)

// ============================================================================
// 8. DOCUMENTATION CONVENTIONS
// ============================================================================

// ✅ DO: Add JSDoc for public functions
/**
 * Fetch projects from database with optional filtering
 * @param filters - Project filters (search, status, region, etc.)
 * @param limit - Maximum number of projects to return (default: 50)
 * @returns Promise resolving to array of projects
 * @throws Error if database query fails
 * @example
 * const projects = await fetchProjects({ status: 'IN_PROGRESS' }, 100);
 */
async function fetchProjects(
  filters?: ProjectFilters,
  limit: number = 50
): Promise<Project[]> {
  // Implementation
  return [];
}

// ✅ DO: Add comments for complex logic
// Calculate budget variance: (actual - planned) / planned * 100
const variance = ((spent - budget) / budget) * 100;

// ❌ DON'T: Over-comment obvious code
// const name = project.name; // Get the name

// ============================================================================
// 9. TESTING CONVENTIONS
// ============================================================================

// ✅ DO: Follow AAA pattern (Arrange, Act, Assert)
describe('calculateBudgetVariance', () => {
  it('should calculate positive variance for budget overrun', () => {
    // Arrange
    const budget = 100;
    const spent = 120;

    // Act
    const variance = calculateBudgetVariance(budget, spent);

    // Assert
    expect(variance).toBe(20);
  });
});

// ✅ DO: Use descriptive test names
// ✓ "should return error message when project not found"
// ✗ "test get project"

// ✅ DO: Test edge cases and error conditions
describe('validateProjectInput', () => {
  it('should accept valid input', () => {});
  it('should reject invalid budget (negative)', () => {});
  it('should reject missing required fields', () => {});
  it('should reject invalid status enum', () => {});
});

// ============================================================================
// 10. PERFORMANCE CONVENTIONS
// ============================================================================

// ✅ DO: Memoize expensive components
const ProjectCard = React.memo(({ project, onEdit }: ProjectCardProps) => {
  return <div>{project.name}</div>;
}, (prev, next) => prev.project.id === next.project.id);

// ✅ DO: Use useCallback for event handlers passed to children
const handleEdit = useCallback((id: string) => {
  // Implementation
}, []);

// ✅ DO: Use useMemo for expensive calculations
const statistics = useMemo(() => {
  return calculateStatistics(projects);
}, [projects]);

// ❌ DON'T: Create new objects in render
// render() {
//   return <Child data={{...}} />; // New object each render!
// }

// ============================================================================
// 11. GIT & COMMIT CONVENTIONS
// ============================================================================

// ✅ DO: Use conventional commit messages
// feat: add project filter by budget range
// fix: prevent race condition in auth context
// refactor: extract query builder utilities
// test: add permission validation tests
// docs: update API documentation
// style: format code with prettier

// ✅ DO: Small, focused commits
// Good: "fix: handle null profile in auth context"
// Bad: "fix: misc bugs and improvements"

// ============================================================================
// 12. FILE ORGANIZATION
// ============================================================================

// ✅ Recommended structure:
// src/
// ├── types/
// │   └── index.ts                   (All type definitions)
// ├── lib/
// │   ├── permissions.ts             (Auth/RBAC)
// │   ├── validation.ts              (Zod schemas)
// │   ├── queries.ts                 (Supabase query builders)
// │   ├── utils.ts                   (Helper functions)
// │   └── __tests__/                 (Unit tests)
// ├── hooks/
// │   ├── useProjects.ts
// │   ├── useTasks.ts
// │   ├── useMetrics.ts
// │   ├── useError.ts                (NEW: Error handling)
// │   └── useValidation.ts           (NEW: Validation helper)
// ├── contexts/
// │   ├── AuthContext.tsx            (IMPROVED)
// │   └── FilterContext.tsx          (NEW)
// ├── components/
// │   ├── ErrorBoundary.tsx          (IMPROVED)
// │   ├── ErrorUI.tsx                (NEW)
// │   ├── dashboard/
// │   ├── projects/
// │   ├── tasks/
// │   └── ui/
// ├── pages/
// │   └── ...
// └── __tests__/                     (Integration tests)

// ============================================================================
// 13. IMPORT ORGANIZATION
// ============================================================================

// ✅ DO: Organize imports consistently
// 1. React/external libraries
// 2. Internal types
// 3. Hooks
// 4. Components
// 5. Utils/lib
// 6. Styles

import React, { FC, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import type { Project, ProjectInput } from '@/types';
import { useProjects } from '@/hooks/useProjects';
import { ProjectCard } from '@/components/ProjectCard';
import { validateProjectInput } from '@/lib/validation';
import styles from './ProjectList.module.css';

// ============================================================================
// 14. ACCESSIBILITY (A11y) CONVENTIONS
// ============================================================================

// ✅ DO: Include ARIA labels
<button
  aria-label="Delete project"
  onClick={() => deleteProject(id)}
>
  🗑️
</button>

// ✅ DO: Use semantic HTML
<form onSubmit={handleSubmit}>
  <label htmlFor="project-name">Project Name</label>
  <input id="project-name" type="text" />
</form>

// ✅ DO: Ensure keyboard navigation works
<div role="tablist">
  <button
    role="tab"
    aria-selected={activeTab === 'projects'}
    onKeyDown={handleKeyDown}
  >
    Projects
  </button>
</div>

// ============================================================================
// SUMMARY: BEFORE vs AFTER
// ============================================================================

// BEFORE (Anti-patterns)
/*
const ProjectPage = () => {
  const [projects, setProjects] = useState();
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    supabase.from('projects').select('*').then(({ data }) => {
      setProjects(data as any);  // ❌ Unsafe cast
      setLoading(false);
    });
  }, []); // ❌ Missing dependency array
  
  return (
    <div>
      {loading && 'Loading...'}
      {projects?.map(p => (
        <div key={p.id}>{p.name}</div>
      ))}
    </div>
  );
};
*/

// AFTER (Following conventions)
/*
const ProjectPage: FC = () => {
  const { projects, loading, error } = useProjects();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorUI message={error} />;
  
  return (
    <div>
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};
*/

// ============================================================================
// ENFORCEMENT
// ============================================================================

// ✅ Use ESLint to enforce many conventions:
// - No unused variables
// - No implicit any types
// - Proper dependency arrays
// - Exhaustive object properties
// - No console logs in production

// ✅ Use Prettier for consistent formatting
// ✅ Use TypeScript strict mode
// ✅ Use Husky pre-commit hooks to check conventions

export const CODE_CONVENTIONS = {
  version: '1.0',
  lastUpdated: '2026-04-19',
  targetAudience: 'Frontend developers',
  enforcedVia: ['ESLint', 'Prettier', 'TypeScript', 'Husky'],
};
