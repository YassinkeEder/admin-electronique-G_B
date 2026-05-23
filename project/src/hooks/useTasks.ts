//src/hooks/useTasks.ts
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Task } from '../types';

export function useTasks(projectId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('due_date', { ascending: true });
      if (err) throw err;
      setTasks((data as Task[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`tasks-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `project_id=eq.${projectId}`,
      }, () => {
        fetchTasks();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, fetchTasks]);

  return { tasks, loading, error, refetch: fetchTasks };
}

export async function createTask(data: Partial<Task>, userId: string) {
  return supabase.from('tasks').insert({ ...data, created_by: userId }).select().single();
}

export async function updateTask(id: string, data: Partial<Task>) {
  return supabase.from('tasks').update(data).eq('id', id).select().single();
}

export async function deleteTask(id: string) {
  return supabase.from('tasks').delete().eq('id', id);
}
