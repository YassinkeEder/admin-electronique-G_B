"""
KPI & Metrics Module
Calcul des indicateurs de performance
"""

from .core import (
    calculate_budget_variance,
    calculate_budget_utilization,
    calculate_delay_index,
    get_projects_by_timeline,
    calculate_completion_rate,
    calculate_average_progress,
    calculate_roi,
    calculate_cost_per_beneficiary,
    calculate_efficiency_score,
)

__all__ = [
    'calculate_budget_variance',
    'calculate_budget_utilization',
    'calculate_delay_index',
    'get_projects_by_timeline',
    'calculate_completion_rate',
    'calculate_average_progress',
    'calculate_roi',
    'calculate_cost_per_beneficiary',
    'calculate_efficiency_score',
]
