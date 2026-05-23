/**
 * Export utilities — Rapport HTML autonome
 * Génère des fichiers HTML formatés pour archivage et diffusion offline
 */

import { Project, Task, Metric } from '../types';
import { formatDate, formatMillions } from './utils';

/**
 * Exporte un projet complet en rapport HTML autonome
 * @param project - Données du projet
 * @param tasks - Tableau des tâches associées
 * @param metrics - Tableau des KPI métriques
 * @param userName - Nom de l'utilisateur qui exporte (optionnel)
 * @returns Promise<void> — Déclenche le téléchargement
 */
export async function exportProjectReport(
  project: Project,
  tasks: Task[],
  metrics: Metric[],
  userName: string = 'Utilisateur'
): Promise<void> {
  // Créer le slug du nom pour le fichier
  const projectSlug = project.name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .slice(0, 30);

  // Formater la date d'export
  const now = new Date();
  const exportDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const exportTime = now.toLocaleTimeString('fr-FR');

  // Construire le HTML du rapport
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport - ${project.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: #f8fafc;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            page-break-after: always;
        }
        .header {
            border-bottom: 3px solid #0066cc;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header-title {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 10px;
            font-weight: 600;
        }
        .project-title {
            font-size: 32px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 5px;
        }
        .project-meta {
            font-size: 14px;
            color: #475569;
        }
        
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 15px;
            border-left: 4px solid #0066cc;
            padding-left: 12px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-card {
            padding: 15px;
            background: #f1f5f9;
            border-radius: 8px;
            border-left: 3px solid #0066cc;
        }
        .info-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .info-value {
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
        }
        .info-unit {
            font-size: 12px;
            color: #64748b;
            margin-left: 5px;
        }
        
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: #10b981;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: bold;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 13px;
        }
        th {
            background: #0066cc;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #0066cc;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        tr:last-child td {
            border-bottom: none;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-planned { background: #dbeafe; color: #1e40af; }
        .status-in-progress { background: #fed7aa; color: #92400e; }
        .status-completed { background: #dcfce7; color: #166534; }
        .status-suspended { background: #fedba8; color: #9a3412; }
        .status-cancelled { background: #fecaca; color: #991b1b; }
        
        .priority-low { color: #64748b; }
        .priority-medium { color: #f59e0b; font-weight: bold; }
        .priority-high { color: #d97706; font-weight: bold; }
        .priority-critical { color: #dc2626; font-weight: bold; }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
            text-align: right;
        }
        
        .description-box {
            padding: 15px;
            background: #f0f4f8;
            border-left: 3px solid #0066cc;
            border-radius: 4px;
            margin-bottom: 15px;
            line-height: 1.6;
            color: #334155;
        }
        
        @media print {
            body { background: white; }
            .container { box-shadow: none; margin: 0; padding: 40mm; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- En-tête -->
        <div class="header">
            <div class="header-title">🇬🇼 E-GovProjetGB | République de Guinée-Bissau</div>
            <div class="project-title">${escapeHtml(project.name)}</div>
            <div class="project-meta">${escapeHtml(project.region)} • ${escapeHtml(project.sector)}</div>
        </div>

        <!-- Fiche projet -->
        <div class="section">
            <div class="section-title">📋 Fiche Projet</div>
            
            <div class="info-grid">
                <div class="info-card">
                    <div class="info-label">Statut</div>
                    <div class="info-value">
                        <span class="status-badge status-${project.status.toLowerCase()}">
                            ${project.status}
                        </span>
                    </div>
                </div>
                <div class="info-card">
                    <div class="info-label">Avancement</div>
                    <div class="info-value">${project.progress}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.progress}%">
                            ${project.progress}%
                        </div>
                    </div>
                </div>
                <div class="info-card">
                    <div class="info-label">Budget (XOF)</div>
                    <div class="info-value">${formatMillions(project.budget_xof)}</div>
                </div>
                <div class="info-card">
                    <div class="info-label">Dépensé (XOF)</div>
                    <div class="info-value">${formatMillions(project.spent_xof)}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, (project.spent_xof / project.budget_xof) * 100)}%; background: ${(project.spent_xof / project.budget_xof) > 0.9 ? '#ef4444' : (project.spent_xof / project.budget_xof) > 0.7 ? '#f59e0b' : '#10b981'}">
                            ${Math.round((project.spent_xof / project.budget_xof) * 100)}%
                        </div>
                    </div>
                </div>
                <div class="info-card">
                    <div class="info-label">Date de début</div>
                    <div class="info-value">${formatDate(project.start_date)}</div>
                </div>
                <div class="info-card">
                    <div class="info-label">Date de fin</div>
                    <div class="info-value">${formatDate(project.end_date)}</div>
                </div>
                <div class="info-card">
                    <div class="info-label">Bénéficiaires</div>
                    <div class="info-value">${project.beneficiaries.toLocaleString('fr-FR')}</div>
                </div>
                <div class="info-card">
                    <div class="info-label">Région</div>
                    <div class="info-value">${escapeHtml(project.region)}</div>
                </div>
            </div>

            ${project.description ? `
                <div class="section-title" style="margin-top: 20px;">Description</div>
                <div class="description-box">${escapeHtml(project.description)}</div>
            ` : ''}
        </div>

        <!-- Tableau des tâches -->
        ${tasks.length > 0 ? `
        <div class="section">
            <div class="section-title">📌 Tâches du projet</div>
            <table>
                <thead>
                    <tr>
                        <th>Titre</th>
                        <th>Statut</th>
                        <th>Priorité</th>
                        <th>Assigné à</th>
                        <th>Avancement</th>
                        <th>Échéance</th>
                    </tr>
                </thead>
                <tbody>
                    ${tasks.map(task => `
                    <tr>
                        <td><strong>${escapeHtml(task.title)}</strong></td>
                        <td><span class="status-badge status-${task.status.toLowerCase()}">${task.status}</span></td>
                        <td><span class="priority-${task.priority.toLowerCase()}">${task.priority}</span></td>
                        <td>${task.assignee ? escapeHtml(task.assignee.full_name) : '—'}</td>
                        <td>${task.progress}%</td>
                        <td>${task.due_date ? formatDate(task.due_date) : '—'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <!-- Tableau des KPI -->
        ${metrics.length > 0 ? `
        <div class="section">
            <div class="section-title">📊 Indicateurs KPI</div>
            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Valeur</th>
                        <th>Unité</th>
                        <th>Cible</th>
                        <th>Période</th>
                    </tr>
                </thead>
                <tbody>
                    ${metrics.map(m => `
                    <tr>
                        <td><strong>${escapeHtml(m.kpi_type.replace(/_/g, ' '))}</strong></td>
                        <td>${m.value}</td>
                        <td>${escapeHtml(m.unit)}</td>
                        <td>${m.target_value}</td>
                        <td>${escapeHtml(m.period_label)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <!-- Pied de page -->
        <div class="footer">
            <div><strong>Date d'export :</strong> ${exportDate} à ${exportTime}</div>
            <div><strong>Exporté par :</strong> ${escapeHtml(userName)}</div>
            <div style="margin-top: 10px; font-size: 11px;">
                Rapport généré par E-GovProjetGB | Plateforme de gouvernance électronique
            </div>
        </div>
    </div>
</body>
</html>`;

  // Créer un Blob et déclencher le téléchargement
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `rapport-${projectSlug}-${exportDate}.html`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Échappe les caractères HTML pour éviter les injections XSS
 */
function escapeHtml(text: string | undefined): string {
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
