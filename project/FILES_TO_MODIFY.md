# Files to Modify - Changes Summary

This document outlines **changes to existing files** needed for Week 1 implementation.

## Priority 1: Critical (Must Do This Week)

### 1. src/contexts/AuthContext.tsx
**Current state**: Silently fails on profile fetch  
**Issue**: Error never shown to user  
**Time**: 30 minutes  
**Impact**: High (blocks login error handling)

**Changes needed**:
```diff
// Add error state
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
+ error: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// In AuthProvider
const [error, setError] = useState<string | null>(null);

// Wrap profile fetch in try-catch
const subscription = supabase.auth.onAuthStateChange(
  async (event, session) => {
    try {
+     setError(null);
      setIsLoading(true);
      if (session?.user) {
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

+       if (fetchError) throw fetchError;
        setProfile(profile || null);
        setUser(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
+   } catch (err) {
+     const message = err instanceof Error ? err.message : 'Failed to load profile';
+     setError(message);
+     setUser(null);
+     setProfile(null);
+   } finally {
+     setIsLoading(false);
    }
  }
);

// Expose error in value
const value = {
  user,
  profile,
+ error,
  isLoading,
  signIn,
  signUp,
  signOut,
};
```

---

### 2. src/pages/LoginPage.tsx
**Current state**: Doesn't display auth errors  
**Issue**: User sees loading spinner on auth failure  
**Time**: 20 minutes  
**Impact**: High (critical for UX)

**Changes needed**:
```diff
import { ErrorUI } from '@/components/ui/ErrorUI';
import { useError } from '@/hooks/useError';

export function LoginPage() {
  const { signIn, isLoading, error: authError } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { error: formError, setError } = useError();

  const displayError = authError || formError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await signIn(formData.email, formData.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="space-y-6">
+     {displayError && (
+       <ErrorUI 
+         message={displayError} 
+         onDismiss={() => setError('')}
+       />
+     )}
      {/* form fields */}
    </div>
  );
}
```

---

### 3. src/App.tsx
**Current state**: No error boundary wrapping app  
**Issue**: App crashes on unhandled errors  
**Time**: 10 minutes  
**Impact**: Medium (safety net)

**Changes needed**:
```diff
import { ErrorBoundary } from './components/ErrorBoundary';

export function App() {
  return (
+   <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <I18nProvider>
            <FilterProvider>
              {/* routes */}
            </FilterProvider>
          </I18nProvider>
        </ThemeProvider>
      </AuthProvider>
+   </ErrorBoundary>
  );
}
```

---

### 4. src/components/ErrorBoundary.tsx
**Current state**: Displays error in console  
**Issue**: User doesn't see error, sees broken UI  
**Time**: 30 minutes  
**Impact**: High (safety)

**Changes needed**: See IMPLEMENTATION_GUIDE.md Week 1.3  
**Full replacement** recommended (current version too simple)

---

### 5. src/hooks/useProjects.ts
**Current state**: Duplicates query logic  
**Issue**: Code duplication, hard to maintain  
**Time**: 45 minutes  
**Impact**: Medium (code quality)

**Changes needed**:
```diff
import { createQueryBuilders, handleQueryError } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
+ import { ProjectFilters, validateProjectFilters } from '@/lib/validation';

+ const queryBuilders = createQueryBuilders(supabase);

export function useProjects(filters?: ProjectFilters) {
  // [existing code]

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
+     
+     // Use query builder instead of manual query
+     const { data, error } = await queryBuilders.projects.list(filters);
+     if (error) throw error;
+     
-     const { data, error } = await supabase
-       .from('projects')
-       .select(/* long query */)
-       .eq('is_archived', false)
-       .order('created_at', { ascending: false });

      setProjects(data || []);
    } catch (err) {
+     setError(handleQueryError(err));
    }
  };

  // [rest of hook]
}
```

---

### 6. src/hooks/useTasks.ts
**Current state**: Similar duplication to useProjects  
**Issue**: Code duplication  
**Time**: 45 minutes  
**Impact**: Medium (code quality)

**Changes needed**: Same pattern as useProjects refactoring  

---

## Priority 2: Important (Should Do This Week)

### 7. src/pages/ProjectsPage.tsx
**Current state**: Prop drilling (5 levels deep)  
**Issue**: Hard to maintain, props passed through multiple components  
**Time**: 1 hour  
**Impact**: Medium (maintainability)

**Changes needed**:
```diff
- import { FilterState } from '@/types';
+ import { useProjectFilters } from '@/contexts/FilterContext';

export function ProjectsPage() {
- const [filters, setFilters] = useState<FilterState>({...});
- const handleFilterChange = (filters: FilterState) => setFilters(filters);
+ const { filters, updateFilter, reset } = useProjectFilters();
  const { projects, loading, error } = useProjects(filters);

  return (
    <div>
-     <FilterComponent filters={filters} onChange={handleFilterChange} />
+     <FilterComponent />
      <ProjectsList />
    </div>
  );
}

// In FilterComponent
- export function FilterComponent({ filters, onChange }: Props) {
+ export function FilterComponent() {
+ const { filters, updateFilter } = useProjectFilters();
  return (
    <select 
-     value={filters.status}
+     value={filters.status}
-     onChange={(e) => onChange({...filters, status: e.target.value})}
+     onChange={(e) => updateFilter('status', e.target.value as ProjectStatus)}
    >
  );
}
```

---

### 8. src/pages/TasksPage.tsx
**Current state**: No error UI, date comparison bugs  
**Issue**: Errors silent, dates compared incorrectly  
**Time**: 1 hour  
**Impact**: Medium (UX + correctness)

**Changes needed**:
```diff
+ import { ErrorUI } from '@/components/ui/ErrorUI';
+ import { useError } from '@/hooks/useError';
+ import { useTaskFilters } from '@/contexts/FilterContext';

export function TasksPage() {
+ const { filters } = useTaskFilters();
  const { tasks, loading, error } = useTasks(filters);
+ const { error: displayError, clearError } = useError();

  return (
    <div>
+     {(error || displayError) && (
+       <ErrorUI 
+         message={error || displayError}
+         onDismiss={clearError}
+       />
+     )}
      {loading && <LoadingSpinner />}
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}

// Fix date comparison in filters
- const overdueTasks = tasks.filter(t => 
-   t.due_date < new Date()  // ❌ String vs Date
- );
+ const overdueTasks = tasks.filter(t => 
+   t.due_date && new Date(t.due_date) < new Date()  // ✅ Both dates
+ );
```

---

### 9. src/pages/ProjectDetailPage.tsx
**Current state**: No error boundary, unsafe casting  
**Issue**: Crashes if data incomplete  
**Time**: 45 minutes  
**Impact**: Low-Medium (safety)

**Changes needed**:
```diff
+ import { ErrorUI } from '@/components/ui/ErrorUI';

export function ProjectDetailPage() {
  const { id } = useParams();
  const { project, loading, error } = useProject(id!);
- const status = project.status as ProjectStatus;  // ❌ Unsafe

+ {error && <ErrorUI message={error} />}
+ {!project ? (
+   <div>Project not found</div>
+ ) : (
+   // Use project safely here
+ )}
```

---

## Priority 3: Nice-to-Have (Week 2+)

### 10. src/components/dashboard/KPICard.tsx
- [ ] Add loading skeleton
- [ ] Add error state
- [ ] Add Zod validation for data

### 11. src/lib/audit.ts
- [ ] Add proper error handling
- [ ] Use error constants from validation.ts

### 12. src/lib/i18n.ts
- [ ] Validate translations exist
- [ ] Handle missing translation gracefully

---

## Implementation Priority Matrix

| File | Priority | Time | Impact | Week |
|------|----------|------|--------|------|
| AuthContext.tsx | 🔴 CRITICAL | 30min | High | 1 |
| LoginPage.tsx | 🔴 CRITICAL | 20min | High | 1 |
| App.tsx | 🔴 CRITICAL | 10min | Medium | 1 |
| ErrorBoundary.tsx | 🔴 CRITICAL | 30min | High | 1 |
| useProjects.ts | 🟠 HIGH | 45min | Medium | 1 |
| useTasks.ts | 🟠 HIGH | 45min | Medium | 1 |
| ProjectsPage.tsx | 🟠 HIGH | 1hr | Medium | 1 |
| TasksPage.tsx | 🟠 HIGH | 1hr | Medium | 1 |
| ProjectDetailPage.tsx | 🟡 MEDIUM | 45min | Low | 2 |
| KPICard.tsx | 🟡 MEDIUM | 1hr | Low | 2 |

**Total Week 1**: 6-8 hours (modifications + testing)

---

## Verification Checklist

After each modification:

- [ ] `npm run type-check` - No TypeScript errors
- [ ] `npm test` - All tests passing
- [ ] `npm run lint` - No ESLint warnings
- [ ] Manual test - Feature works as expected
- [ ] Error handling - Errors shown to user (not silent)

---

## Rollback Plan

If modification breaks things:

1. **Revert to version control**: `git checkout -- [file]`
2. **Check test output**: `npm test -- --verbose`
3. **Review changes**: Compare with before/after examples
4. **Re-read instructions**: Verify you followed all steps

---

## Next Steps

1. **Today**: Create jest.config.js and run tests (Task 0.1-0.4)
2. **Tomorrow**: Fix AuthContext errors (Task 1.2)
3. **Day 3**: Improve ErrorBoundary (Task 1.3)
4. **Day 4-5**: Refactor useProjects & useTasks (Tasks 1.4-1.5)
5. **Day 6-7**: Fix ProjectsPage & TasksPage (Priority 2)
6. **End of week**: Run full test suite, verify coverage

---

## Resources

- **CODE_QUALITY_AUDIT.md** - Analysis of each file
- **CODE_CONVENTIONS.md** - How to write code
- **IMPLEMENTATION_GUIDE.md** - Detailed step-by-step
- **src/lib/validation.ts** - Zod schemas to use
- **src/lib/queries.ts** - Query builders (NEW)
- **src/contexts/FilterContext.tsx** - Filter state (NEW)
- **src/hooks/useError.ts** - Error handling (NEW)
- **src/components/ui/ErrorUI.tsx** - Error display (NEW)

---

**Start with Priority 1 files**. They unlock all other improvements.

Good luck! 🚀
