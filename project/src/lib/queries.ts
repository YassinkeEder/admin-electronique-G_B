/**
 * Query Builders for Supabase
 * Consolidates repeated query logic across hooks
 * 
 * Academic Note: DRY principle - eliminates code duplication
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Project, Task } from '../types';
import type { ProjectFilters, TaskFilters } from './validation';

/**
 * Factory function to create query builders
 * Ensures consistency across all database queries
 */
export function createQueryBuilders(client: SupabaseClient) {
  return {
    projects: {
      /**
       * Build projects list query with filters
       * @param filters - Optional project filters
       * @returns Supabase query
       */
      list(filters?: ProjectFilters) {
        let query = client
          .from('projects')
          .select(
            `
            id, name, description, region, sector, status,
            budget_xof, spent_xof, progress, beneficiaries,
            start_date, end_date, created_at, updated_at,
            created_by, is_archived,
            creator:profiles!created_by(id, full_name, role, email)
            `
          )
          .eq('is_archived', false)
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.region) {
          query = query.eq('region', filters.region);
        }
        if (filters?.sector) {
          query = query.eq('sector', filters.sector);
        }
        if (filters?.search) {
          query = query.ilike('name', `%${filters.search}%`);
        }
        if (filters?.minBudget !== undefined) {
          query = query.gte('budget_xof', filters.minBudget);
        }
        if (filters?.maxBudget !== undefined) {
          query = query.lte('budget_xof', filters.maxBudget);
        }

        return query;
      },

      /**
       * Get single project by ID with full relations
       */
      byId(id: string) {
        return client
          .from('projects')
          .select(
            `
            *, creator:profiles!created_by(id, full_name, role, email)
            `
          )
          .eq('id', id)
          .eq('is_archived', false)
          .maybeSingle();
      },

      /**
       * Get projects for dropdown/select
       * Lightweight query for performance
       */
      dropdown() {
        return client
          .from('projects')
          .select('id, name, status')
          .eq('is_archived', false)
          .order('name', { ascending: true });
      },

      /**
       * Get project statistics by region
       */
      statsByRegion() {
        return client
          .from('projects')
          .select('region, budget_xof, progress')
          .eq('is_archived', false);
      },
    },

    tasks: {
      /**
       * Build tasks list query with filters
       */
      list(filters?: TaskFilters) {
        let query = client
          .from('tasks')
          .select(
            `
            id, title, description, project_id, status, priority,
            due_date, completed_at, created_at, updated_at,
            created_by, assignee_id,
            creator:profiles!created_by(id, full_name, email),
            assignee:profiles!assignee_id(id, full_name, email),
            project:projects(id, name, status)
            `
          )
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters?.projectId) {
          query = query.eq('project_id', filters.projectId);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.assigneeId) {
          query = query.eq('assignee_id', filters.assigneeId);
        }
        if (filters?.search) {
          query = query.ilike('title', `%${filters.search}%`);
        }
        if (filters?.dueAfter) {
          query = query.gte('due_date', filters.dueAfter);
        }
        if (filters?.dueBefore) {
          query = query.lte('due_date', filters.dueBefore);
        }

        return query;
      },

      /**
       * Get single task by ID
       */
      byId(id: string) {
        return client
          .from('tasks')
          .select(
            `
            *, creator:profiles!created_by(*),
            assignee:profiles!assignee_id(*),
            project:projects(*)
            `
          )
          .eq('id', id)
          .maybeSingle();
      },

      /**
       * Get tasks for project
       */
      byProjectId(projectId: string) {
        return client
          .from('tasks')
          .select('id, title, status, priority, due_date, assignee_id')
          .eq('project_id', projectId)
          .order('due_date', { ascending: true });
      },

      /**
       * Get overdue tasks
       */
      overdue() {
        return client
          .from('tasks')
          .select('id, title, project_id, due_date, status')
          .lt('due_date', new Date().toISOString())
          .neq('status', 'DONE')
          .order('due_date', { ascending: true });
      },
    },

    metrics: {
      /**
       * Get metrics for project
       */
      byProjectId(projectId: string) {
        return client
          .from('metrics')
          .select('*')
          .eq('project_id', projectId)
          .order('recorded_at', { ascending: false });
      },

      /**
       * Get latest metrics across all projects
       */
      latest() {
        return client
          .from('metrics')
          .select('*')
          .order('recorded_at', { ascending: false })
          .limit(100);
      },
    },

    profiles: {
      /**
       * Get profile by ID
       */
      byId(id: string) {
        return client
          .from('profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle();
      },

      /**
       * Get users in organization
       */
      byOrganization(orgId: string) {
        return client
          .from('profiles')
          .select('id, full_name, role, email, avatar_url')
          .eq('organization_id', orgId)
          .order('full_name', { ascending: true });
      },
    },
  };
}

/**
 * Real-time subscription channel builders
 * Ensures consistency for real-time features
 */
export function createSubscriptions(client: SupabaseClient) {
  return {
    projects: {
      /**
       * Subscribe to all project changes
       */
      all() {
        return client
          .channel('projects-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'projects' },
            (payload) => payload
          );
      },

      /**
       * Subscribe to specific project changes
       */
      byId(projectId: string) {
        return client
          .channel(`project:${projectId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'projects',
              filter: `id=eq.${projectId}`,
            },
            (payload) => payload
          );
      },
    },

    tasks: {
      /**
       * Subscribe to project tasks
       */
      byProjectId(projectId: string) {
        return client
          .channel(`project:${projectId}:tasks`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tasks',
              filter: `project_id=eq.${projectId}`,
            },
            (payload) => payload
          );
      },
    },
  };
}

/**
 * Error handling utilities for queries
 */
export function handleQueryError(error: unknown): string {
  if (!error) return 'Unknown error';
  
  if (error instanceof Error) {
    // Handle specific Supabase errors
    if (error.message.includes('JWT')) return 'Authentication failed';
    if (error.message.includes('not found')) return 'Resource not found';
    if (error.message.includes('permission')) return 'Permission denied';
    
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Query result type guards
 * Ensure data matches expected shape
 */
export function isProject(data: unknown): data is Project {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'budget_xof' in data
  );
}

export function isTask(data: unknown): data is Task {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'title' in data &&
    'project_id' in data
  );
}
