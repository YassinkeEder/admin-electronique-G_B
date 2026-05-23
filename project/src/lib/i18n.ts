export type Locale = 'fr' | 'pt';

const translations: Record<Locale, Record<string, string>> = {
  fr: {
    // Nav
    'nav.dashboard': 'Tableau de bord',
    'nav.projects': 'Projets',
    'nav.tasks': 'Tâches',
    'nav.highRisk': 'Projets à risque',
    'nav.gantt': 'Gantt',
    'nav.bi': 'Analytique BI',
    'nav.admin': 'Administration',
    'nav.logout': 'Déconnexion',

    // Auth
    'auth.login': 'Connexion',
    'auth.register': 'Inscription',
    'auth.email': 'Adresse email',
    'auth.password': 'Mot de passe',
    'auth.fullName': 'Nom complet',
    'auth.signIn': 'Se connecter',
    'auth.signUp': "S'inscrire",
    'auth.noAccount': 'Pas de compte ?',
    'auth.hasAccount': 'Déjà un compte ?',
    'auth.forgotPassword': 'Mot de passe oublié ?',

    // Dashboard
    'dash.totalBudget': 'Budget Total',
    'dash.activeProjects': 'Projets Actifs',
    'dash.avgProgress': 'Avancement Moyen',
    'dash.delayedProjects': 'Projets en Retard',
    'dash.recentProjects': 'Projets Récents',
    'dash.budgetByRegion': 'Budget par Région',
    'dash.statusOverview': 'Statut des Projets',
    'dash.progressOverTime': 'Avancement dans le Temps',

    // Projects
    'proj.new': 'Nouveau Projet',
    'proj.edit': 'Modifier Projet',
    'proj.delete': 'Supprimer',
    'proj.name': 'Nom du projet',
    'proj.description': 'Description',
    'proj.budget': 'Budget (XOF)',
    'proj.spent': 'Dépenses (XOF)',
    'proj.startDate': 'Date de début',
    'proj.endDate': 'Date de fin',
    'proj.status': 'Statut',
    'proj.region': 'Région',
    'proj.sector': 'Secteur',
    'proj.progress': 'Avancement',
    'proj.beneficiaries': 'Bénéficiaires',
    'proj.save': 'Enregistrer',
    'proj.cancel': 'Annuler',
    'proj.details': 'Détails du projet',
    'proj.tasks': 'Tâches',
    'proj.metrics': 'Indicateurs KPI',

    // Status labels
    'status.PLANNED': 'Planifié',
    'status.IN_PROGRESS': 'En cours',
    'status.COMPLETED': 'Terminé',
    'status.SUSPENDED': 'Suspendu',
    'status.CANCELLED': 'Annulé',

    // Task status
    'task.TODO': 'À faire',
    'task.IN_PROGRESS': 'En cours',
    'task.REVIEW': 'En revue',
    'task.DONE': 'Terminé',
    'task.BLOCKED': 'Bloqué',

    // Priority
    'priority.LOW': 'Faible',
    'priority.MEDIUM': 'Moyen',
    'priority.HIGH': 'Élevé',
    'priority.CRITICAL': 'Critique',

    // Sectors
    'sector.Health': 'Santé',
    'sector.Education': 'Éducation',
    'sector.Infrastructure': 'Infrastructure',
    'sector.Agriculture': 'Agriculture',
    'sector.Energy': 'Énergie',
    'sector.ICT': 'TIC',
    'sector.Finance': 'Finance',
    'sector.Governance': 'Gouvernance',
    'sector.Environment': 'Environnement',

    // Roles
    'role.admin': 'Administrateur',
    'role.chef_projet': 'Chef de Projet',
    'role.decideur': 'Décideur',
    'role.public': 'Public',

    // KPI
    'kpi.budget_variance': 'Variance Budgétaire',
    'kpi.roi': 'Retour sur Investissement',
    'kpi.delay_index': 'Indice de Retard',
    'kpi.completion_rate': 'Taux de Complétion',
    'kpi.cost_per_beneficiary': 'Coût par Bénéficiaire',
    'kpi.efficiency_score': 'Score d\'Efficacité',

    // General
    'general.loading': 'Chargement...',
    'general.error': 'Erreur',
    'general.success': 'Succès',
    'general.confirm': 'Confirmer',
    'general.actions': 'Actions',
    'general.search': 'Rechercher...',
    'general.filter': 'Filtrer',
    'general.export': 'Exporter',
    'general.all': 'Tous',
    'general.noData': 'Aucune donnée disponible',
    'general.close': 'Fermer',

    // BI
    'bi.title': 'Analytique & BI',
    'bi.predictions': 'Prévisions ML',
    'bi.budgetAnalysis': 'Analyse Budgétaire',
    'bi.performanceMatrix': 'Matrice Performance',
    'bi.regionComparison': 'Comparaison Régionale',

    // Admin
    'admin.users': 'Gestion Utilisateurs',
    'admin.audit': 'Journal d\'Audit',
    'admin.settings': 'Paramètres',
  },
  pt: {
    'nav.dashboard': 'Painel de Controle',
    'nav.projects': 'Projetos',
    'nav.tasks': 'Tarefas',
    'nav.highRisk': 'Projetos de Risco',
    'nav.gantt': 'Gantt',
    'nav.bi': 'Análise BI',
    'nav.admin': 'Administração',
    'nav.logout': 'Sair',
    'auth.login': 'Entrar',
    'auth.register': 'Registar',
    'auth.email': 'Endereço de email',
    'auth.password': 'Senha',
    'auth.fullName': 'Nome completo',
    'auth.signIn': 'Entrar',
    'auth.signUp': 'Registar',
    'auth.noAccount': 'Sem conta?',
    'auth.hasAccount': 'Já tem conta?',
    'auth.forgotPassword': 'Esqueceu a senha?',
    'dash.totalBudget': 'Orçamento Total',
    'dash.activeProjects': 'Projetos Ativos',
    'dash.avgProgress': 'Progresso Médio',
    'dash.delayedProjects': 'Projetos Atrasados',
    'dash.recentProjects': 'Projetos Recentes',
    'dash.budgetByRegion': 'Orçamento por Região',
    'dash.statusOverview': 'Visão Geral do Status',
    'dash.progressOverTime': 'Progresso ao Longo do Tempo',
    'proj.new': 'Novo Projeto',
    'proj.edit': 'Editar Projeto',
    'proj.delete': 'Eliminar',
    'proj.name': 'Nome do projeto',
    'proj.description': 'Descrição',
    'proj.budget': 'Orçamento (XOF)',
    'proj.spent': 'Despesas (XOF)',
    'proj.startDate': 'Data de início',
    'proj.endDate': 'Data de fim',
    'proj.status': 'Estado',
    'proj.region': 'Região',
    'proj.sector': 'Setor',
    'proj.progress': 'Progresso',
    'proj.beneficiaries': 'Beneficiários',
    'proj.save': 'Guardar',
    'proj.cancel': 'Cancelar',
    'proj.details': 'Detalhes do Projeto',
    'proj.tasks': 'Tarefas',
    'proj.metrics': 'Indicadores KPI',
    'status.PLANNED': 'Planeado',
    'status.IN_PROGRESS': 'Em Curso',
    'status.COMPLETED': 'Concluído',
    'status.SUSPENDED': 'Suspenso',
    'status.CANCELLED': 'Cancelado',
    'task.TODO': 'A Fazer',
    'task.IN_PROGRESS': 'Em Curso',
    'task.REVIEW': 'Em Revisão',
    'task.DONE': 'Concluído',
    'task.BLOCKED': 'Bloqueado',
    'priority.LOW': 'Baixo',
    'priority.MEDIUM': 'Médio',
    'priority.HIGH': 'Alto',
    'priority.CRITICAL': 'Crítico',
    'sector.Health': 'Saúde',
    'sector.Education': 'Educação',
    'sector.Infrastructure': 'Infraestrutura',
    'sector.Agriculture': 'Agricultura',
    'sector.Energy': 'Energia',
    'sector.ICT': 'TIC',
    'sector.Finance': 'Finanças',
    'sector.Governance': 'Governação',
    'sector.Environment': 'Ambiente',
    'role.admin': 'Administrador',
    'role.chef_projet': 'Chefe de Projeto',
    'role.decideur': 'Decisor',
    'role.public': 'Público',
    'kpi.budget_variance': 'Variância Orçamental',
    'kpi.roi': 'Retorno do Investimento',
    'kpi.delay_index': 'Índice de Atraso',
    'kpi.completion_rate': 'Taxa de Conclusão',
    'kpi.cost_per_beneficiary': 'Custo por Beneficiário',
    'kpi.efficiency_score': 'Pontuação de Eficiência',
    'general.loading': 'A carregar...',
    'general.error': 'Erro',
    'general.success': 'Sucesso',
    'general.confirm': 'Confirmar',
    'general.actions': 'Ações',
    'general.search': 'Pesquisar...',
    'general.filter': 'Filtrar',
    'general.export': 'Exportar',
    'general.all': 'Todos',
    'general.noData': 'Sem dados disponíveis',
    'general.close': 'Fechar',
    'bi.title': 'Análise & BI',
    'bi.predictions': 'Previsões ML',
    'bi.budgetAnalysis': 'Análise Orçamental',
    'bi.performanceMatrix': 'Matriz de Desempenho',
    'bi.regionComparison': 'Comparação Regional',
    'admin.users': 'Gestão de Utilizadores',
    'admin.audit': 'Registo de Auditoria',
    'admin.settings': 'Configurações',
  },
};

export function getTranslation(locale: Locale, key: string, fallback: Locale = 'fr'): string {
  const localeMap = translations[locale] || {};
  if (key in localeMap) return localeMap[key];

  // Fallback to the default locale if available
  const fallbackValue = translations[fallback]?.[key];
  if (fallbackValue) {
    if (import.meta.env.DEV) {
      // Log missing translation for dev visibility
      // eslint-disable-next-line no-console
      console.warn(`[i18n] Missing translation for key "${key}" in locale "${locale}", falling back to "${fallback}"`);
    }
    return fallbackValue;
  }

  // If still missing, log and return a visible marker
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(`[i18n] Missing translation for key "${key}" in locale "${locale}" and fallback "${fallback}"`);
  }

  return `[${locale}] ${key}`;
}

export { translations };
