/**
 * Project management constants
 * Centralized definitions for statuses, regions, sectors, etc.
 */
export const PROJECT_STATUSES = {
    PLANNED: {
        label: 'Planifié',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        icon: '📋',
        description: 'En attente de démarrage',
    },
    IN_PROGRESS: {
        label: 'En cours',
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        icon: '⚙️',
        description: 'Actuellement en exécution',
    },
    COMPLETED: {
        label: 'Terminé',
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        icon: '✅',
        description: 'Projet finalisé',
    },
    SUSPENDED: {
        label: 'Suspendu',
        color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        icon: '⏸️',
        description: 'Temporairement arrêté',
    },
    CANCELLED: {
        label: 'Annulé',
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        icon: '❌',
        description: 'Projet abandonné',
    },
};
export const TASK_STATUSES = {
    TODO: {
        label: 'À faire',
        color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
        icon: '📝',
    },
    IN_PROGRESS: {
        label: 'En cours',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        icon: '🔄',
    },
    REVIEW: {
        label: 'En revue',
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        icon: '👀',
    },
    DONE: {
        label: 'Terminé',
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        icon: '✨',
    },
    BLOCKED: {
        label: 'Bloqué',
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        icon: '🚫',
    },
};
export const TASK_PRIORITIES = {
    LOW: {
        label: 'Faible',
        color: 'bg-slate-100 text-slate-600',
        value: 1,
    },
    MEDIUM: {
        label: 'Moyen',
        color: 'bg-blue-100 text-blue-600',
        value: 2,
    },
    HIGH: {
        label: 'Élevé',
        color: 'bg-orange-100 text-orange-600',
        value: 3,
    },
    CRITICAL: {
        label: 'Critique',
        color: 'bg-red-100 text-red-600',
        value: 4,
    },
};
export const GUINEA_BISSAU_REGIONS = {
    Bissau: { label: 'Bissau', emoji: '🏛️', description: 'Région capitale' },
    Gabu: { label: 'Gabu', emoji: '🏘️', description: 'Région nord' },
    Bafata: { label: 'Bafata', emoji: '🌾', description: 'Région centrale' },
    Cacheu: { label: 'Cacheu', emoji: '🏞️', description: 'Région nord-ouest' },
    Oio: { label: 'Oio', emoji: '🌳', description: 'Région nord-est' },
    Quinara: { label: 'Quinara', emoji: '🏞️', description: 'Région sud' },
    Tombali: { label: 'Tombali', emoji: '🌊', description: 'Région sud-est' },
    Biombo: { label: 'Biombo', emoji: '🌴', description: 'Région ouest' },
    Bolama: { label: 'Bolama', emoji: '🏝️', description: 'Région insulaire' },
};
export const PROJECT_SECTORS = {
    Health: { label: 'Santé', emoji: '🏥', priority: 1 },
    Education: { label: 'Éducation', emoji: '📚', priority: 2 },
    Infrastructure: { label: 'Infrastructure', emoji: '🏗️', priority: 3 },
    Agriculture: { label: 'Agriculture', emoji: '🌾', priority: 4 },
    Energy: { label: 'Énergie', emoji: '⚡', priority: 5 },
    ICT: { label: 'TIC', emoji: '💻', priority: 6 },
    Finance: { label: 'Finance', emoji: '💰', priority: 7 },
    Governance: { label: 'Gouvernance', emoji: '🏛️', priority: 8 },
    Environment: { label: 'Environnement', emoji: '🌱', priority: 9 },
};
/**
 * Budget variance alert thresholds
 */
export const BUDGET_THRESHOLDS = {
    CRITICAL: 90, // 90% = alert
    WARNING: 70, // 70% = warning
    SAFE: 50, // 50% = safe
};
/**
 * Project timeline classification
 */
export const PROJECT_TIMELINE = {
    URGENT: 'Moins de 30 jours',
    SOON: '30-90 jours',
    NORMAL: '90-180 jours',
    LONG_TERM: 'Plus de 180 jours',
};
/**
 * Document type categories
 */
export const DOCUMENT_TYPES = {
    PROPOSAL: 'Proposition',
    PLAN: 'Plan',
    REPORT: 'Rapport',
    BUDGET: 'Budget',
    MEETING: 'Compte-rendu',
    CONTRACT: 'Contrat',
    OTHER: 'Autre',
};
export const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/zip',
];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
