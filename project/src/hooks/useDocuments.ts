import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  created_at: string;
}

export function useDocuments(resourceType: string, resourceId: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const path = `${resourceType}/${resourceId}`;
      const { data, error: err } = await supabase.storage.from('documents').list(path);
      if (err) throw err;

      const docs: Document[] = [];
      for (const file of data || []) {
        if (!file.id) {
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(`${path}/${file.name}`);

        docs.push({
          id: file.id,
          name: file.name,
          size: file.metadata?.size || 0,
          type: file.metadata?.mimetype || 'application/octet-stream',
          url: publicUrl,
          created_at: file.created_at || new Date().toISOString(),
        });
      }
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, [resourceType, resourceId]);

  useEffect(() => {
    if (resourceType && resourceId) {
      fetchDocuments();
    }
  }, [fetchDocuments, resourceType, resourceId]);

  const uploadDocument = useCallback(async (file: File): Promise<boolean> => {
    try {
      const path = `${resourceType}/${resourceId}`;
      const fileName = `${Date.now()}-${file.name}`;

      const { error: err } = await supabase.storage
        .from('documents')
        .upload(`${path}/${fileName}`, file);

      if (err) throw err;
      await fetchDocuments();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      return false;
    }
  }, [resourceType, resourceId, fetchDocuments]);

  const deleteDocument = useCallback(async (fileName: string): Promise<boolean> => {
    try {
      const path = `${resourceType}/${resourceId}`;
      const { error: err } = await supabase.storage
        .from('documents')
        .remove([`${path}/${fileName}`]);

      if (err) throw err;
      await fetchDocuments();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      return false;
    }
  }, [resourceType, resourceId, fetchDocuments]);

  const downloadDocument = useCallback(async (fileName: string) => {
    try {
      const path = `${resourceType}/${resourceId}`;
      const { data, error: err } = await supabase.storage
        .from('documents')
        .download(`${path}/${fileName}`);

      if (err) throw err;
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  }, [resourceType, resourceId]);

  return { documents, loading, error, uploadDocument, deleteDocument, downloadDocument, refetch: fetchDocuments };
}
