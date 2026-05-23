-- E-GovProjetGB BI - SQL Optimizations
-- Indexes et Materialized Views pour performance BI

-- ============================================================================
-- INDEXES: Optimiser requêtes BI fréquentes
-- ============================================================================

-- Index pour filtrer par région
CREATE INDEX IF NOT EXISTS idx_projects_region 
ON public.projects(region);

-- Index pour filtrer par secteur
CREATE INDEX IF NOT EXISTS idx_projects_sector 
ON public.projects(sector);

-- Index pour filtrer par statut
CREATE INDEX IF NOT EXISTS idx_projects_status 
ON public.projects(status);

-- Index composite pour queries courantes
CREATE INDEX IF NOT EXISTS idx_projects_region_status 
ON public.projects(region, status);

-- Index pour sorting par date
CREATE INDEX IF NOT EXISTS idx_projects_created_at 
ON public.projects(created_at DESC);

-- Index pour queries timeline
CREATE INDEX IF NOT EXISTS idx_projects_dates 
ON public.projects(start_date, end_date);

-- Index sur budget (pour KPI)
CREATE INDEX IF NOT EXISTS idx_projects_budget 
ON public.projects(budget_xof DESC);

-- Index sur tasks (projet scope)
CREATE INDEX IF NOT EXISTS idx_tasks_project_id 
ON public.tasks(project_id);

CREATE INDEX IF NOT EXISTS idx_tasks_status 
ON public.tasks(status);

-- Index sur metrics (KPI historiques)
CREATE INDEX IF NOT EXISTS idx_metrics_project_id 
ON public.metrics(project_id);

CREATE INDEX IF NOT EXISTS idx_metrics_recorded_at 
ON public.metrics(recorded_at DESC);

-- ============================================================================
-- MATERIALIZED VIEWS: Pré-calculer stats fréquentes
-- ============================================================================

-- Vue: Stats par région
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_stats_by_region AS
SELECT 
    region,
    COUNT(*) as project_count,
    SUM(budget_xof) as total_budget,
    SUM(spent_xof) as total_spent,
    AVG(progress) as avg_progress,
    SUM(beneficiaries) as total_beneficiaries,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count,
    MAX(updated_at) as last_update
FROM public.projects
WHERE is_archived = false
GROUP BY region;

CREATE INDEX idx_mv_stats_region ON mv_stats_by_region(region);

-- Vue: Stats par secteur
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_stats_by_sector AS
SELECT 
    sector,
    COUNT(*) as project_count,
    SUM(budget_xof) as total_budget,
    SUM(spent_xof) as total_spent,
    AVG(progress) as avg_progress,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count,
    MAX(updated_at) as last_update
FROM public.projects
WHERE is_archived = false
GROUP BY sector;

CREATE INDEX idx_mv_stats_sector ON mv_stats_by_sector(sector);

-- Vue: Stats par statut
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_stats_by_status AS
SELECT 
    status,
    COUNT(*) as project_count,
    SUM(budget_xof) as total_budget,
    SUM(spent_xof) as total_spent,
    AVG(progress) as avg_progress,
    MAX(updated_at) as last_update
FROM public.projects
WHERE is_archived = false
GROUP BY status;

CREATE INDEX idx_mv_stats_status ON mv_stats_by_status(status);

-- Vue: Projets en retard (fréquemment queryé)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_projects_overdue AS
SELECT 
    id,
    name,
    region,
    sector,
    end_date,
    (NOW()::date - end_date::date) as days_overdue,
    progress,
    status,
    budget_xof,
    spent_xof
FROM public.projects
WHERE is_archived = false
  AND status NOT IN ('COMPLETED', 'CANCELLED')
  AND end_date < NOW();

CREATE INDEX idx_mv_overdue_region ON mv_projects_overdue(region);

-- Vue: Budget variance par projet
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_budget_analysis AS
SELECT 
    id,
    name,
    region,
    sector,
    budget_xof,
    spent_xof,
    CASE 
        WHEN budget_xof = 0 THEN 0
        ELSE ((spent_xof - budget_xof) / budget_xof * 100)
    END as variance_pct,
    CASE 
        WHEN budget_xof = 0 THEN 'N/A'
        WHEN ((spent_xof - budget_xof) / budget_xof * 100) > 10 THEN 'CRITICAL'
        WHEN ((spent_xof - budget_xof) / budget_xof * 100) > 0 THEN 'WARNING'
        ELSE 'OK'
    END as budget_status,
    MAX(updated_at) as last_update
FROM public.projects
WHERE is_archived = false;

CREATE INDEX idx_mv_budget_status ON mv_budget_analysis(budget_status);

-- ============================================================================
-- REFRESH STRATEGY: Mettre à jour MV régulièrement
-- ============================================================================

-- Créer function pour rafraîchir toutes les MV
CREATE OR REPLACE FUNCTION refresh_bi_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_by_region;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_by_sector;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_by_status;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_projects_overdue;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_budget_analysis;
    
    RAISE NOTICE 'BI Views refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh toutes les heures (nécessite pg_cron extension)
-- SELECT cron.schedule('refresh_bi_views', '0 * * * *', 'SELECT refresh_bi_views();');

-- ============================================================================
-- QUERY OPTIMIZATION: Exemples requêtes optimisées pour BI
-- ============================================================================

-- ✅ OPTIMISÉE: Utilise index, aggregation SQL
SELECT 
    region,
    COUNT(*) as project_count,
    SUM(budget_xof) as total_budget
FROM public.projects
WHERE region = $1  -- Parameterized (utilise index)
  AND is_archived = false
GROUP BY region;

-- ✅ OPTIMISÉE: Utilise MV pré-calculée
SELECT * FROM mv_stats_by_region WHERE region = $1;

-- ✅ OPTIMISÉE: Avec LIMIT pour éviter trop de data
SELECT id, name, budget_xof, status
FROM public.projects
WHERE status = $1
  AND region = $2
ORDER BY created_at DESC
LIMIT 10000;

-- ❌ NON OPTIMISÉE: SELECT * sans limite
SELECT * FROM public.projects;

-- ❌ NON OPTIMISÉE: Pas d'index utilisé
SELECT * FROM public.projects WHERE LOWER(name) LIKE '%searchterm%';

-- ============================================================================
-- QUERY ANALYSIS: Analyser performance
-- ============================================================================

-- Voir le plan d'exécution (EXPLAIN)
EXPLAIN ANALYZE
SELECT region, COUNT(*), SUM(budget_xof)
FROM public.projects
WHERE region = 'Bissau'
GROUP BY region;

-- Voir tables les plus grandes (trouver bottleneck)
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Voir requêtes lentes (si pg_stat_statements enabled)
SELECT query, mean_time, calls, max_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_time DESC
LIMIT 10;

-- ============================================================================
-- MAINTENANCE: Optimiser performance généralement
-- ============================================================================

-- VACUUM: Nettoyer "dead" rows (run periodicallly)
VACUUM ANALYZE public.projects;

-- REINDEX: Reconstruire indexes fragmentés
REINDEX INDEX idx_projects_region;
REINDEX INDEX idx_projects_status;

-- Check table health
SELECT schemaname, tablename, last_vacuum, last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public';

-- ============================================================================
-- MONITORING: Métriques pour BI
-- ============================================================================

-- Nombre de projets par région (snapshot)
SELECT region, COUNT(*) FROM public.projects GROUP BY region;

-- Projet avec plus grand budget
SELECT name, region, budget_xof FROM public.projects ORDER BY budget_xof DESC LIMIT 5;

-- Projets en retard
SELECT name, end_date, (NOW()::date - end_date::date) as days_late
FROM public.projects
WHERE end_date < NOW() AND status != 'COMPLETED'
ORDER BY days_late DESC;

-- Average budget par secteur
SELECT sector, AVG(budget_xof) as avg_budget, COUNT(*) as project_count
FROM public.projects
GROUP BY sector
ORDER BY avg_budget DESC;

-- ============================================================================
-- NOTES POUR BI APP
-- ============================================================================

/*
1. INDEXES créent rapidement mais ralentissent INSERT/UPDATE
   → Acceptable pour BI (read-only)
   
2. MATERIALIZED VIEWS pré-calculent stats
   → Cache on disk, rapide queries
   → Refresh chaque heure (ou on-demand)
   
3. Streamlit cache @st.cache_data(ttl=3600)
   + DB MV cache = double layer optimization
   → Response < 100ms typiquement
   
4. Pour Supabase:
   - Se connecter avec role read_only
   - Indexes créés par migration
   - MV refreshed via cron job (si available)
   - Sinon: manual REFRESH dans admin panel
   
5. Si performance dégradée:
   - Vérifier EXPLAIN ANALYZE
   - Run VACUUM ANALYZE
   - Vérifier index fragmentation
   - Monitor avec pg_stat_statements
*/

-- ============================================================================
-- POST-INSTALLATION CHECKLIST
-- ============================================================================

-- ✅ Vérifier indexes créés
SELECT schemaname, tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public' AND indexname LIKE '%idx_%'
ORDER BY indexname;

-- ✅ Vérifier MV créées
SELECT schemaname, matviewname FROM pg_matviews 
WHERE schemaname = 'public' AND matviewname LIKE 'mv_%'
ORDER BY matviewname;

-- ✅ Test requête rapide
SELECT COUNT(*) FROM mv_stats_by_region;  -- doit être < 10ms

-- ✅ Tester filter
SELECT * FROM mv_stats_by_region WHERE region = 'Bissau';

-- ✅ Tester join
SELECT 
    r.region,
    r.project_count,
    s.project_count as sector_projects
FROM mv_stats_by_region r
CROSS JOIN mv_stats_by_sector s LIMIT 1;

-- Fin setup!
