import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Metric } from '../types';

export function useMetrics(projectId?: string) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('metrics').select('*').order('recorded_at', { ascending: false });
      if (projectId) query = query.eq('project_id', projectId);
      const { data, error: err } = await query;
      if (err) throw err;
      setMetrics((data as Metric[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
}
