import { useState, useEffect } from 'react';
import { Send, Trash2, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Comment, Profile } from '../../types';
import { formatDate } from '../../lib/utils';

type CommentWithAuthor = Omit<Comment, 'author'> & {
  author?: Pick<Profile, 'full_name' | 'email'>;
};

interface CommentsPanelProps {
  resourceType: string;
  resourceId: string;
}

export function CommentsPanel({ resourceType, resourceId }: CommentsPanelProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [resourceType, resourceId]);

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles(full_name, email)')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: true });

    setComments((data as CommentWithAuthor[]) || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('comments').insert({
        content,
        author_id: user.id,
        resource_type: resourceType,
        resource_id: resourceId,
      });

      if (error) throw error;
      setContent('');
      await fetchComments();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Supprimer ce commentaire ?')) return;
    await supabase.from('comments').delete().eq('id', commentId);
    await fetchComments();
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">Chargement...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare size={24} className="mx-auto mb-2 opacity-50 text-slate-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Aucun commentaire</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.map(comment => (
            <div key={comment.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {(comment.author?.full_name?.[0] || comment.author?.email?.[0] || '?').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {comment.author?.full_name || comment.author?.email || 'Utilisateur'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(comment.created_at)}
                    </p>
                  </div>
                </div>
                {user?.id === comment.author_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 break-words">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Ajouter un commentaire..."
          rows={2}
          className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
        />
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="flex-shrink-0 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5 text-sm"
        >
          <Send size={14} />
          <span className="hidden sm:inline">Envoyer</span>
        </button>
      </form>
    </div>
  );
}
