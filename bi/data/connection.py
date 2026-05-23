"""
Couche d'accès aux données
Connexion Supabase et requêtes optimisées
"""

import streamlit as st
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging

from config import DATABASE_URL, CACHE_TTL, DEFAULT_LIMIT

logger = logging.getLogger(__name__)

# ============================================================================
# CONNEXION DATABASE
# ============================================================================

@st.cache_resource
def get_db_connection():
    """
    Créer et cacher connexion PostgreSQL
    Utilisé pour toutes les requêtes
    """
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except psycopg2.Error as e:
        st.error(f"❌ Erreur connexion DB: {e}")
        logger.error(f"DB connection error: {e}")
        return None

# ============================================================================
# REQUÊTES PROJETS
# ============================================================================

@st.cache_data(ttl=CACHE_TTL)
def get_projects(
    status: Optional[str] = None,
    region: Optional[str] = None,
    sector: Optional[str] = None,
    limit: int = DEFAULT_LIMIT
) -> pd.DataFrame:
    """
    Récupérer tous les projets avec filtres optionnels
    
    Args:
        status: Statut (PLANNED, IN_PROGRESS, ...)
        region: Région GB
        sector: Secteur
        limit: Limite résultats
    
    Returns:
        DataFrame avec colonnes: id, name, region, sector, budget_xof, spent_xof, etc.
    """
    conn = get_db_connection()
    if not conn:
        return pd.DataFrame()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = """
            SELECT 
                id, name, description, region, sector, status,
                budget_xof, spent_xof, progress, beneficiaries,
                start_date, end_date, is_archived,
                created_at, created_by, updated_at, updated_by
            FROM projects
            WHERE is_archived = false
            """
            params = []

            if status:
                query += " AND status = %s"
                params.append(status)
            if region:
                query += " AND region = %s"
                params.append(region)
            if sector:
                query += " AND sector = %s"
                params.append(sector)

            query += f" ORDER BY created_at DESC LIMIT {limit}"
            
            cur.execute(query, params)
            result = cur.fetchall()
            
            df = pd.DataFrame(result)
            if df.empty:
                return df
            
            # Convertir dates
            for col in ['start_date', 'end_date', 'created_at', 'updated_at']:
                if col in df.columns:
                    df[col] = pd.to_datetime(df[col])
            
            return df
    except Exception as e:
        st.error(f"❌ Erreur requête projets: {e}")
        logger.error(f"Projects query error: {e}")
        return pd.DataFrame()
    finally:
        conn.close()

# ============================================================================
# REQUÊTES TÂCHES
# ============================================================================

@st.cache_data(ttl=CACHE_TTL)
def get_tasks(
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = DEFAULT_LIMIT
) -> pd.DataFrame:
    """
    Récupérer tâches avec filtres
    """
    conn = get_db_connection()
    if not conn:
        return pd.DataFrame()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = "SELECT * FROM tasks WHERE 1=1"
            params = []

            if project_id:
                query += " AND project_id = %s"
                params.append(project_id)
            if status:
                query += " AND status = %s"
                params.append(status)

            query += f" ORDER BY due_date ASC LIMIT {limit}"
            
            cur.execute(query, params)
            result = cur.fetchall()
            
            df = pd.DataFrame(result)
            if not df.empty:
                for col in ['start_date', 'due_date', 'completed_at', 'created_at', 'updated_at']:
                    if col in df.columns:
                        df[col] = pd.to_datetime(df[col])
            
            return df
    except Exception as e:
        st.error(f"❌ Erreur requête tâches: {e}")
        logger.error(f"Tasks query error: {e}")
        return pd.DataFrame()
    finally:
        conn.close()

# ============================================================================
# REQUÊTES MÉTRIQUES/KPI
# ============================================================================

@st.cache_data(ttl=CACHE_TTL)
def get_metrics(
    project_id: Optional[str] = None,
    kpi_type: Optional[str] = None,
) -> pd.DataFrame:
    """
    Récupérer métriques/KPI historiques
    """
    conn = get_db_connection()
    if not conn:
        return pd.DataFrame()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = "SELECT * FROM metrics WHERE 1=1"
            params = []

            if project_id:
                query += " AND project_id = %s"
                params.append(project_id)
            if kpi_type:
                query += " AND kpi_type = %s"
                params.append(kpi_type)

            query += " ORDER BY recorded_at DESC LIMIT 5000"
            
            cur.execute(query, params)
            result = cur.fetchall()
            
            df = pd.DataFrame(result)
            if not df.empty:
                df['recorded_at'] = pd.to_datetime(df['recorded_at'])
            
            return df
    except Exception as e:
        st.error(f"❌ Erreur requête métriques: {e}")
        logger.error(f"Metrics query error: {e}")
        return pd.DataFrame()
    finally:
        conn.close()

# ============================================================================
# REQUÊTES STATISTIQUES AGRÉGÉES
# ============================================================================

@st.cache_data(ttl=CACHE_TTL)
def get_stats_by_region() -> pd.DataFrame:
    """
    Statistiques agrégées par région
    """
    conn = get_db_connection()
    if not conn:
        return pd.DataFrame()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = """
            SELECT 
                region,
                COUNT(*) as project_count,
                SUM(budget_xof) as total_budget,
                SUM(spent_xof) as total_spent,
                AVG(progress) as avg_progress,
                SUM(beneficiaries) as total_beneficiaries,
                COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count
            FROM projects
            WHERE is_archived = false
            GROUP BY region
            ORDER BY total_budget DESC
            """
            
            cur.execute(query)
            result = cur.fetchall()
            return pd.DataFrame(result)
    except Exception as e:
        logger.error(f"Stats by region error: {e}")
        return pd.DataFrame()
    finally:
        conn.close()

@st.cache_data(ttl=CACHE_TTL)
def get_stats_by_sector() -> pd.DataFrame:
    """
    Statistiques agrégées par secteur
    """
    conn = get_db_connection()
    if not conn:
        return pd.DataFrame()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = """
            SELECT 
                sector,
                COUNT(*) as project_count,
                SUM(budget_xof) as total_budget,
                SUM(spent_xof) as total_spent,
                AVG(progress) as avg_progress,
                COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count
            FROM projects
            WHERE is_archived = false
            GROUP BY sector
            ORDER BY total_budget DESC
            """
            
            cur.execute(query)
            result = cur.fetchall()
            return pd.DataFrame(result)
    except Exception as e:
        logger.error(f"Stats by sector error: {e}")
        return pd.DataFrame()
    finally:
        conn.close()

@st.cache_data(ttl=CACHE_TTL)
def get_stats_by_status() -> pd.DataFrame:
    """
    Statistiques agrégées par statut
    """
    conn = get_db_connection()
    if not conn:
        return pd.DataFrame()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = """
            SELECT 
                status,
                COUNT(*) as project_count,
                SUM(budget_xof) as total_budget,
                SUM(spent_xof) as total_spent,
                AVG(progress) as avg_progress
            FROM projects
            WHERE is_archived = false
            GROUP BY status
            """
            
            cur.execute(query)
            result = cur.fetchall()
            return pd.DataFrame(result)
    except Exception as e:
        logger.error(f"Stats by status error: {e}")
        return pd.DataFrame()
    finally:
        conn.close()

# ============================================================================
# REQUÊTES AUDIT
# ============================================================================

def get_audit_logs(limit: int = 1000) -> pd.DataFrame:
    """
    Récupérer les logs d'audit
    Note: Retourne DataFrame vide pour maintenant (stub)
    À implémenter avec table audit_logs en production
    """
    return pd.DataFrame()
