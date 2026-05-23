"""
Data Access Layer
Connexion et requêtes Supabase/PostgreSQL
"""

from .connection import (
    get_db_connection,
    get_projects,
    get_tasks,
    get_metrics,
    get_stats_by_region,
    get_stats_by_sector,
    get_stats_by_status,
)

__all__ = [
    'get_db_connection',
    'get_projects',
    'get_tasks',
    'get_metrics',
    'get_stats_by_region',
    'get_stats_by_sector',
    'get_stats_by_status',
]
