import { useRef, useState } from 'react';
import { Upload, Download, Trash2, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDocuments } from '../../hooks/useDocuments';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatDate } from '../../lib/utils';

interface DocumentsPanelProps {
  resourceType: string;
  resourceId: string;
  canUpload?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function DocumentsPanel({ resourceType, resourceId, canUpload = true }: DocumentsPanelProps) {
  const { documents, loading, error, uploadDocument, deleteDocument, downloadDocument } = useDocuments(resourceType, resourceId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadSuccess(false);

    const file = files[0];
    const success = await uploadDocument(file);

    setUploading(false);
    if (success) {
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-4">
      {canUpload && (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 hover:border-blue-400 dark:hover:border-blue-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.png,.gif,.zip"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex flex-col items-center gap-2 py-4 text-center disabled:opacity-50"
          >
            {uploading ? (
              <>
                <LoadingSpinner size="md" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Envoi en cours...</span>
              </>
            ) : (
              <>
                <Upload size={24} className="text-slate-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Glissez des fichiers ici</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">ou cliquez pour sélectionner</span>
              </>
            )}
          </button>
        </div>
      )}

      {uploadSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg text-emerald-700 dark:text-emerald-400 text-sm">
          <CheckCircle2 size={16} />
          <span>Fichier envoyé avec succès</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg text-red-700 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <FileText size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Aucun document</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-400 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{doc.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatFileSize(doc.size)} · {formatDate(doc.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => downloadDocument(doc.name)}
                  className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-colors"
                  title="Télécharger"
                >
                  <Download size={16} />
                </button>
                {canUpload && (
                  <button
                    onClick={() => deleteDocument(doc.name)}
                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
