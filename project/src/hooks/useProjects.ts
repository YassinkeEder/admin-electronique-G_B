//src/hooks/useProjects.ts
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Project, ProjectStatus, ProjectRegion, ProjectSector, StrategicAxis } from '../types';

interface ProjectFilters {
  status?: ProjectStatus | '';
  region?: ProjectRegion | '';
  sector?: ProjectSector | '';
  strategic_axis?: StrategicAxis | '';
  is_public?: boolean;
  search?: string;
}

export function useProjects(filters?: ProjectFilters) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.region) query = query.eq('region', filters.region);
      if (filters?.sector) query = query.eq('sector', filters.sector);
      if (filters?.strategic_axis) query = query.eq('strategic_axis', filters.strategic_axis);
      if (typeof filters?.is_public === 'boolean') query = query.eq('is_public', filters.is_public);
      if (filters?.search) query = query.ilike('name', `%${filters.search}%`);

      const { data, error: err } = await query;
      if (err) throw err;
      setProjects((data as Project[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.region, filters?.sector, filters?.strategic_axis, filters?.is_public, filters?.search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const channel = supabase
      .channel('projects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchProjects();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchProjects]);

  return { projects, loading, error, refetch: fetchProjects };
}

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (err) throw err;
      setProject(data as Project);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchProject();
  }, [fetchProject, id]);

  return { project, loading, error, refetch: fetchProject };
}

export async function createProject(data: Partial<Project>, userId: string) {
  return supabase.from('projects').insert({ ...data, created_by: userId }).select().single();
}

export async function updateProject(id: string, data: Partial<Project>, userId: string) {
  return supabase.from('projects').update({ ...data, updated_by: userId }).eq('id', id).select().single();
}

export async function deleteProject(id: string) {
  return supabase.from('projects').update({ is_archived: true }).eq('id', id);
}
