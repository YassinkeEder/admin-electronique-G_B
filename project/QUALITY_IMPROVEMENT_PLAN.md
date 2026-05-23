# 📋 CODE QUALITY IMPROVEMENT PLAN

**Project**: E-GovProjetGB Frontend  
**Duration**: 4 weeks  
**Target Score**: 8.5/10  
**Current Score**: 6.5/10  

---

## 🎯 ROADMAP AT A GLANCE

```
WEEK 1: Foundation (Infrastructure & Critical Fixes)
├── Jest + RTL Setup
├── Fix AuthContext errors
├── Add Error Boundaries
└── Type validation with Zod

WEEK 2: Core Testing (High-Value Tests)
├── Permission tests (100% coverage)
├── Auth flow tests (80%+)
├── Project CRUD tests (80%+)
└── Task operations tests (80%+)

WEEK 3: Refactoring (Code Quality)
├── Extract query builders
├── Fix prop drilling
├── Add consistent error handling
└── Performance optimization

WEEK 4: Polish (Final Touches)
├── E2E tests
├── Documentation
├── Code review
└── Final audit
```

---

## WEEK 1: FOUNDATION (4-5 days)

### Task 1.1: Setup Jest + React Testing Library
**Time**: 3-4 hours  
**Priority**: 🔴 CRITICAL  
**Files to Create**:

```
project/
├── jest.config.js (NEW)
├── jest.setup.js (NEW)
├── tsconfig.test.json (NEW)
├── src/__mocks__/ (NEW)
│   ├── supabase.ts
│   └── window.ts
└── src/__tests__/ (NEW)
    └── setup.ts
```

**What to do**:
1. Install dependencies:
   ```bash
   npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom @types/jest
   ```

2. Create `jest.config.js`:
   ```javascript
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'jsdom',
     setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
     moduleNameMapper: {
       '^@/(.*)$': '<rootDir>/src/$1',
     },
     collectCoverageFrom: [
       'src/**/*.{ts,tsx}',
       '!src/**/*.d.ts',
       '!src/**/*.stories.tsx',
     ],
   };
   ```

3. Create `jest.setup.js` with RTL imports
4. Create mock for Supabase client
5. Update `package.json` with test scripts:
   ```json
   "test": "jest",
   "test:watch": "jest --watch",
   "test:coverage": "jest --coverage"
   ```

**Success Criteria**:
- [ ] `npm test` runs without errors
- [ ] Tests discover correctly
- [ ] Supabase mocked
- [ ] Coverage reports generated

---

### Task 1.2: Fix AuthContext Error Handling
**Time**: 1-2 hours  
**Priority**: 🔴 CRITICAL  
**File to Update**: `src/contexts/AuthContext.tsx`

**Current Issues**:
```typescript
// ❌ Silent failure - error never caught
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .maybeSingle();

if (data) setProfile(data as Profile);
```

**What to do**:
1. Add `error` state to context
2. Wrap profile fetch in try-catch
3. Expose error to consumers
4. Add error clearing on successful operations

**Example Fix**:
```typescript
// ✅ Proper error handling
try {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (data) {
    setProfile(validateProfile(data));
    setError(null);
  }
} catch (err) {
  setError(err instanceof Error ? err.message : 'Auth failed');
  setProfile(null);
}
```

**Success Criteria**:
- [ ] Error state added to AuthContext
- [ ] All async operations wrapped in try-catch
- [ ] Error exposed to consumers
- [ ] Error shown in LoginPage UI

---

### Task 1.3: Create Validation Schemas (Zod)
**Time**: 2-3 hours  
**Priority**: 🔴 CRITICAL  
**File Created**: `src/lib/validation.ts` ✅ (Already done)

**What's Done**:
- ✅ ProjectSchema, TaskSchema, ProfileSchema
- ✅ InputSchemas for form validation
- ✅ Filter schemas
- ✅ Helper functions (validateProject, etc.)

**What Remains**:
1. Add to `src/lib/queries.ts` - Query builders for Supabase
2. Update hooks to use validation functions

---

### Task 1.4: Improve Error Boundary
**Time**: 1-2 hours  
**Priority**: 🟡 HIGH  
**File to Update**: `src/components/ErrorBoundary.tsx`

**What to do**:
1. Already exists and looks good
2. Integrate with error reporting (Sentry)
3. Add error context for better debugging
4. Export error UI component for use in other places

**New File**: `src/components/ErrorUI.tsx`
```typescript
export const ErrorUI: FC<{
  error: Error;
  onRetry?: () => void;
  title?: string;
}> = ({ error, onRetry, title = 'Something went wrong' }) => {
  // Reusable error display component
  return (
    <div className="...">
      <h2>{title}</h2>
      <p>{error.message}</p>
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  );
};
```

**Success Criteria**:
- [ ] Error boundaries prevent app crashes
- [ ] Error UI shown to users
- [ ] Error details logged
- [ ] Errors visible in development

---

### Task 1.5: Setup Code Conventions
**Time**: 1 hour  
**Priority**: 🟢 MEDIUM  
**Files Created**:
- ✅ `CODE_CONVENTIONS.md` (Already done)
- `eslint.config.js` (Update)
- `.prettierrc` (Update)

**What to do**:
1. Review CODE_CONVENTIONS.md with team
2. Configure ESLint for strict rules
3. Setup pre-commit hooks with Husky
4. Add to CI/CD pipeline

---

### Week 1 Checklist

- [ ] Jest + RTL configured and working
- [ ] AuthContext errors fixed and tested
- [ ] Validation schemas (Zod) created
- [ ] Error boundaries improved
- [ ] Code conventions documented
- [ ] Pre-commit hooks setup
- [ ] Team review & approval

---

## WEEK 2: CORE TESTING (5-6 days)

### Task 2.1: Permission Tests
**Time**: 3-4 hours  
**Priority**: 🔴 CRITICAL  
**File Created**: `src/lib/__tests__/permissions.test.ts` ✅ (Already done)

**Coverage**: 
- ✅ All 4 roles tested
- ✅ All permission combinations covered
- ✅ Edge cases (null, undefined, invalid roles)
- ✅ Permission matrix integrity

**Success Criteria**:
- [ ] All tests passing
- [ ] 100% line coverage
- [ ] 100% branch coverage
- [ ] All permission functions tested

**Run Tests**:
```bash
npm test -- permissions.test.ts --coverage
```

---

### Task 2.2: Validation Tests
**Time**: 3-4 hours  
**Priority**: 🔴 CRITICAL  
**File Created**: `src/lib/__tests__/validation.test.ts` ✅ (Already done)

**Coverage**:
- ✅ All schema validations
- ✅ Valid inputs accepted
- ✅ Invalid inputs rejected
- ✅ Edge cases (null, undefined, type mismatches)
- ✅ Error extraction

**Success Criteria**:
- [ ] All tests passing
- [ ] 100% validation coverage
- [ ] Error messages clear
- [ ] No regressions

---

### Task 2.3: AuthContext Tests
**Time**: 4-5 hours  
**Priority**: 🔴 CRITICAL  
**File to Create**: `src/contexts/__tests__/AuthContext.test.tsx`

**Tests to Write**:
```typescript
describe('AuthContext', () => {
  describe('Login Flow', () => {
    it('should set user on successful login', () => {});
    it('should set error on failed login', () => {});
    it('should set loading state', () => {});
  });

  describe('Profile Loading', () => {
    it('should fetch profile on auth state change', () => {});
    it('should handle profile not found', () => {});
    it('should handle fetch error', () => {});
  });

  describe('Logout', () => {
    it('should clear user and profile', () => {});
    it('should clear tokens', () => {});
  });

  describe('useAuth Hook', () => {
    it('should throw error if used outside provider', () => {});
    it('should return current auth state', () => {});
  });
});
```

**Success Criteria**:
- [ ] 80%+ coverage
- [ ] All success paths tested
- [ ] All error paths tested
- [ ] Logout tested

---

### Task 2.4: Project CRUD Tests
**Time**: 4-5 hours  
**Priority**: 🔴 CRITICAL  
**File to Create**: `src/hooks/__tests__/useProjects.test.ts`

**Tests to Write**:
```typescript
describe('useProjects', () => {
  describe('Fetch Projects', () => {
    it('should fetch projects successfully', () => {});
    it('should handle empty results', () => {});
    it('should handle fetch error', () => {});
    it('should apply filters', () => {});
  });

  describe('Create Project', () => {
    it('should create with valid input', () => {});
    it('should reject invalid input', () => {});
    it('should set loading/error states', () => {});
  });

  describe('Update Project', () => {
    it('should update existing project', () => {});
    it('should validate update data', () => {});
    it('should handle concurrent updates', () => {});
  });

  describe('Delete Project', () => {
    it('should delete project', () => {});
    it('should update local state', () => {});
  });

  describe('Real-time Subscriptions', () => {
    it('should subscribe to changes', () => {});
    it('should cleanup on unmount', () => {});
  });
});
```

**Success Criteria**:
- [ ] 80%+ coverage
- [ ] CRUD operations tested
- [ ] Filtering tested
- [ ] Subscriptions cleanup tested
- [ ] Error cases covered

---

### Task 2.5: Task Operations Tests
**Time**: 3-4 hours  
**Priority**: 🔴 CRITICAL  
**File to Create**: `src/hooks/__tests__/useTasks.test.ts`

**Tests to Write**:
```typescript
describe('useTasks', () => {
  describe('Fetch Tasks', () => {
    it('should fetch project tasks', () => {});
    it('should handle missing project', () => {});
    it('should apply filters', () => {});
  });

  describe('Create Task', () => {
    it('should create task with valid data', () => {});
    it('should require projectId', () => {});
  });

  describe('Update Task', () => {
    it('should update task status', () => {});
    it('should update assignee', () => {});
  });

  describe('Delete Task', () => {
    it('should delete task', () => {});
  });
});
```

**Success Criteria**:
- [ ] 80%+ coverage
- [ ] Task CRUD tested
- [ ] Project relation validated
- [ ] Error cases covered

---

### Week 2 Checklist

- [ ] Permission tests (100% coverage)
- [ ] Validation tests (100% coverage)
- [ ] Auth tests (80%+ coverage)
- [ ] Project CRUD tests (80%+ coverage)
- [ ] Task tests (80%+ coverage)
- [ ] Total test coverage: 70%+
- [ ] All tests passing
- [ ] CI/CD tests green

---

## WEEK 3: REFACTORING (4-5 days)

### Task 3.1: Extract Query Builders
**Time**: 2-3 hours  
**Priority**: 🟡 HIGH  
**File to Create**: `src/lib/queries.ts`

**Current Issue**: Query building duplicated across hooks

**Solution**:
```typescript
// src/lib/queries.ts
export const projectQueries = {
  list: (filters?: ProjectFilters) => {
    let query = supabase.from('projects').select('*');
    
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.region) query = query.eq('region', filters.region);
    if (filters?.search) query = query.ilike('name', `%${filters.search}%`);
    
    return query;
  },
  
  byId: (id: string) =>
    supabase.from('projects').select('*').eq('id', id).maybeSingle(),
};

// Usage in hook:
const { data } = await projectQueries.list(filters);
```

**Refactored Files**:
- `src/hooks/useProjects.ts`
- `src/hooks/useTasks.ts`
- `src/hooks/useMetrics.ts`

**Success Criteria**:
- [ ] Query builders extracted
- [ ] DRY principle followed
- [ ] All tests still passing
- [ ] No performance regression

---

### Task 3.2: Fix Prop Drilling in ProjectsPage
**Time**: 2-3 hours  
**Priority**: 🟡 HIGH  
**Files to Update**:
- `src/pages/ProjectsPage.tsx`
- `src/contexts/FilterContext.tsx` (NEW)

**Current Problem**:
```typescript
// ❌ Multiple filter states passed individually
const [search, setSearch] = useState('');
const [statusFilter, setStatusFilter] = useState('');
const [regionFilter, setRegionFilter] = useState('');
// Passed 5 levels deep
```

**Solution**:
```typescript
// src/contexts/FilterContext.tsx
export const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<ProjectFilters>({});
  return (
    <FilterContext.Provider value={{ filters, setFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
};
```

**Usage in ProjectsPage**:
```typescript
// ✅ Clean, no prop drilling
const { filters, setFilters } = useFilters();
const { projects } = useProjects(filters);

return (
  <ProjectGrid
    projects={projects}
    onFilterChange={setFilters}
  />
);
```

**Success Criteria**:
- [ ] Context created and working
- [ ] No more prop drilling
- [ ] Filters persist in URL (bonus)
- [ ] Tests updated

---

### Task 3.3: Improve Error Handling (Consistent Pattern)
**Time**: 2-3 hours  
**Priority**: 🟡 HIGH  
**Files to Update**:
- `src/pages/ProjectsPage.tsx`
- `src/pages/TasksPage.tsx`
- `src/pages/AdminPage.tsx`

**Current Pattern**:
```typescript
// ❌ Inconsistent error handling
if (loading) return <LoadingSpinner />;
// No error handling
return <ProjectGrid projects={projects} />;
```

**New Pattern**:
```typescript
// ✅ Consistent error handling
const { projects, loading, error } = useProjects(filters);

if (loading) return <LoadingSkeletons />;
if (error) return <ErrorUI error={error} onRetry={refetch} />;
if (!projects?.length) return <EmptyState />;

return <ProjectGrid projects={projects} />;
```

**File: Create `src/hooks/useError.ts`**:
```typescript
export function useError() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setError(new Error(message));
    // Optionally: Send to error tracking
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}
```

**Success Criteria**:
- [ ] All pages show error UI
- [ ] Consistent error messages
- [ ] Error recovery mechanism (retry button)
- [ ] Tests pass

---

### Task 3.4: Add Input Validation to Forms
**Time**: 2-3 hours  
**Priority**: 🟡 HIGH  
**Files to Update**:
- `src/components/projects/ProjectForm.tsx`
- Task forms (similar pattern)

**Current**:
```typescript
// ❌ No validation
const handleSubmit = async (data: any) => {
  await createProject(data);
};
```

**New**:
```typescript
// ✅ With validation
const handleSubmit = async (formData: unknown) => {
  const validated = validateProjectInput(formData);
  if (!validated) {
    setErrors(getValidationErrors(...));
    return;
  }
  await createProject(validated);
};
```

**Success Criteria**:
- [ ] All forms use validation
- [ ] Error messages shown to user
- [ ] Invalid submissions prevented
- [ ] Tests cover validation

---

### Task 3.5: Performance Optimization
**Time**: 2-3 hours  
**Priority**: 🟢 MEDIUM  

**What to do**:
1. Add `React.memo()` to ProjectCard
2. Add `useCallback()` for event handlers
3. Add `useMemo()` for expensive calculations
4. Consider virtualization for large lists

**Example**:
```typescript
export const ProjectCard = React.memo(
  ({ project, onEdit }: ProjectCardProps) => {
    return <div>{project.name}</div>;
  },
  (prev, next) => prev.project.id === next.project.id
);
```

**Success Criteria**:
- [ ] No unnecessary re-renders
- [ ] Performance benchmarks improve
- [ ] Tests still passing

---

### Week 3 Checklist

- [ ] Query builders extracted
- [ ] Prop drilling fixed
- [ ] Error handling consistent
- [ ] Input validation added
- [ ] Performance optimized
- [ ] All tests updated
- [ ] Code review passed

---

## WEEK 4: POLISH (3-4 days)

### Task 4.1: E2E Tests for Critical Workflows
**Time**: 3-4 hours  
**Priority**: 🟢 MEDIUM  
**File to Create**: `src/__tests__/e2e/critical-workflows.test.tsx`

**Tests to Write**:
```typescript
describe('E2E: Critical Workflows', () => {
  describe('Create and Update Project', () => {
    it('should create project and update it', () => {});
    it('should show errors for invalid data', () => {});
  });

  describe('User Permissions', () => {
    it('chef_projet can only edit own projects', () => {});
    it('public cannot create projects', () => {});
  });

  describe('Task Management', () => {
    it('should create task in project', () => {});
    it('should update task status', () => {});
  });
});
```

**Success Criteria**:
- [ ] 4-5 critical workflows tested
- [ ] All workflows passing
- [ ] Reflects real user behavior

---

### Task 4.2: Documentation Updates
**Time**: 2-3 hours  
**Priority**: 🟢 MEDIUM  

**Files to Update**:
- `README.md` - Add testing section
- `DEVELOPMENT.md` - Testing & conventions
- `CODE_CONVENTIONS.md` - Already created ✅

**What to document**:
1. How to run tests
2. Testing best practices
3. Code conventions
4. Contributing guidelines
5. Architecture overview

---

### Task 4.3: Final Code Review & Audit
**Time**: 1-2 hours  
**Priority**: 🟢 MEDIUM  

**Checklist**:
- [ ] All tests passing
- [ ] Coverage >= 70%
- [ ] No TypeScript errors
- [ ] ESLint warnings resolved
- [ ] No console logs in production
- [ ] Error handling complete
- [ ] Accessibility reviewed
- [ ] Performance acceptable
- [ ] Documentation updated

---

### Task 4.4: Team Training & Knowledge Transfer
**Time**: 1-2 hours  
**Priority**: 🟢 MEDIUM  

**Share**:
- Testing best practices
- Code conventions
- New utilities (validation, query builders)
- How to write tests (AAA pattern)
- Error handling patterns

---

### Week 4 Checklist

- [ ] E2E tests written and passing
- [ ] Documentation updated
- [ ] Code review completed
- [ ] All quality gates passed
- [ ] Team trained on conventions
- [ ] Final audit done
- [ ] Ready for production

---

## ✅ SUCCESS CRITERIA - FINAL

### Code Quality Metrics

**Type Safety**
- ✅ 95%+ (up from 79%)
- No unsafe `as` type assertions
- All optional types reviewed
- Runtime validation everywhere

**Error Handling**
- ✅ 90%+ (up from 37%)
- All async operations wrapped
- Error UI shown to users
- Errors logged and tracked

**Test Coverage**
- ✅ 75%+ (up from 0%)
- Permissions: 100%
- Core hooks: 80%+
- Components: 60%+
- E2E: 30%+

**Code Organization**
- ✅ DRY principle followed
- No code duplication
- Clear separation of concerns
- Consistent naming

**Performance**
- ✅ No unnecessary re-renders
- Memoization applied
- Virtualization for large lists
- Fast initial load

### Academic Readiness

- ✅ Code follows best practices
- ✅ Tests demonstrate quality
- ✅ Documentation complete
- ✅ Architecture clear
- ✅ Ready for thesis appendices

---

## 📊 TIMELINE SUMMARY

| Week | Focus | Deliverables | Tests |
|------|-------|--------------|-------|
| 1 | Foundation | Jest setup, Auth fixes, Zod schemas | Configuration |
| 2 | Testing | Core tests for auth, permissions, CRUD | 50+ tests |
| 3 | Refactoring | Query builders, error handling, validation | All tests passing |
| 4 | Polish | E2E tests, docs, final audit | 75%+ coverage |

**Total Effort**: ~40 hours (2-3 hours/day for 2-3 weeks)

---

## 🎯 ACCEPTANCE CRITERIA

**Definition of Done**:
- [ ] All tests passing (no failures)
- [ ] Coverage >= 70%
- [ ] Zero critical issues
- [ ] No type errors
- [ ] No ESLint warnings
- [ ] Documentation complete
- [ ] Code reviewed & approved
- [ ] Team trained on conventions
- [ ] Ready for production deployment

---

## 📝 NOTES FOR ACADEMIC USE

This improvement plan is designed to be **thesis-ready**:

1. **Reproducible**: Clear steps to follow
2. **Documented**: Each task has success criteria
3. **Measurable**: Metrics before and after
4. **Sustainable**: Conventions ensure future quality
5. **Educational**: Demonstrates software engineering best practices

**Thesis Contributions**:
- Section: "Quality Assurance & Testing Strategy"
- Appendix: Code samples showing before/after improvements
- Appendix: Test coverage reports
- Appendix: Coding conventions & standards

---

**Version**: 1.0  
**Status**: Ready to Execute  
**Next Step**: Start Week 1 with Jest setup

