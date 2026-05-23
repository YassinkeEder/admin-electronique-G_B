"""
Calcul des KPI - Indicateurs de performance clé
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple

# ============================================================================
# KPI BUDGET
# ============================================================================

def calculate_budget_variance(projects_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Budget Variance (Écart budgétaire)
    Formule: (Spent - Budget) / Budget * 100
    
    Négatif = sous budget (bon)
    Positif = dépassement (mauvais)
    """
    if projects_df.empty:
        return {'variance': 0, 'status': 'neutral'}
    
    total_budget = projects_df['budget_xof'].sum()
    total_spent = projects_df['spent_xof'].sum()
    
    if total_budget == 0:
        return {'variance': 0, 'status': 'neutral'}
    
    variance = ((total_spent - total_budget) / total_budget) * 100
    
    # Déterminer status
    if variance > 10:
        status = 'danger'   # +10% dépassement
    elif variance > 0:
        status = 'warning'  # Petit dépassement
    else:
        status = 'success'  # Sous budget
    
    return {
        'variance': variance,
        'status': status,
        'total_budget': total_budget,
        'total_spent': total_spent,
        'remaining': total_budget - total_spent
    }

def calculate_budget_utilization(projects_df: pd.DataFrame) -> pd.DataFrame:
    """
    Utilisation du budget par projet
    Retourne DF avec colonnes: id, name, utilization_rate
    """
    df = projects_df[['id', 'name', 'budget_xof', 'spent_xof']].copy()
    df['utilization_rate'] = (df['spent_xof'] / df['budget_xof'] * 100).round(1)
    df['utilization_rate'] = df['utilization_rate'].clip(0, 100)  # Max 100%
    df = df[df['budget_xof'] > 0].sort_values('utilization_rate', ascending=False)
    return df

# ============================================================================
# KPI TIMELINE / DÉLAIS
# ============================================================================

def calculate_delay_index(projects_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Delay Index (Indice de retard)
    Compare date fin prévue vs aujourd'hui
    
    Retourne liste projets en retard
    """
    today = datetime.now()
    df = projects_df.copy()
    
    # Convertir dates
    df['end_date'] = pd.to_datetime(df['end_date'])
    
    # Filtrer projets non terminés/annulés
    active = df[~df['status'].isin(['COMPLETED', 'CANCELLED'])]
    
    if active.empty:
        return {'overdue_count': 0, 'avg_days_overdue': 0, 'projects': []}
    
    active['days_overdue'] = (today - active['end_date']).dt.days
    overdue = active[active['days_overdue'] > 0].sort_values('days_overdue', ascending=False)
    
    return {
        'overdue_count': len(overdue),
        'avg_days_overdue': overdue['days_overdue'].mean() if len(overdue) > 0 else 0,
        'projects': overdue[['id', 'name', 'end_date', 'days_overdue']].to_dict('records')
    }

def get_projects_by_timeline(projects_df: pd.DataFrame) -> Dict[str, int]:
    """
    Classement projets par timeline (urgent, soon, normal, long_term)
    """
    today = datetime.now()
    df = projects_df.copy()
    df['end_date'] = pd.to_datetime(df['end_date'])
    
    # Filtrer actifs
    active = df[~df['status'].isin(['COMPLETED', 'CANCELLED'])]
    
    urgent = len(active[active['end_date'] <= today + timedelta(days=30)])
    soon = len(active[(active['end_date'] > today + timedelta(days=30)) & 
                      (active['end_date'] <= today + timedelta(days=90))])
    normal = len(active[(active['end_date'] > today + timedelta(days=90)) & 
                        (active['end_date'] <= today + timedelta(days=180))])
    long_term = len(active[active['end_date'] > today + timedelta(days=180)])
    
    return {
        'urgent': urgent,
        'soon': soon,
        'normal': normal,
        'long_term': long_term
    }

# ============================================================================
# KPI AVANCEMENT / COMPLETION
# ============================================================================

def calculate_completion_rate(projects_df: pd.DataFrame) -> float:
    """
    Taux de complétion global
    Projets COMPLETED / Total projets actifs
    """
    if projects_df.empty:
        return 0.0
    
    total = len(projects_df)
    completed = len(projects_df[projects_df['status'] == 'COMPLETED'])
    
    return (completed / total * 100) if total > 0 else 0.0

def calculate_average_progress(projects_df: pd.DataFrame) -> float:
    """
    Avancement moyen (%)
    Moyenne colonne 'progress'
    """
    if projects_df.empty:
        return 0.0
    
    return projects_df['progress'].mean()

# ============================================================================
# KPI ROI - RETOUR SUR INVESTISSEMENT
# ============================================================================

def calculate_roi(projects_df: pd.DataFrame) -> Dict[str, Any]:
    """
    ROI (Return on Investment)
    Formule: (Bénéficiaires * Secteur_Weight) / Budget * 100
    
    ROI élevé = bon investissement
    """
    if projects_df.empty:
        return {'roi': 0, 'status': 'neutral'}
    
    # Poids par secteur (importance gouvernementale)
    sector_weights = {
        'Health': 1.5,
        'Education': 1.5,
        'Infrastructure': 1.3,
        'Agriculture': 1.0,
        'Energy': 1.2,
        'ICT': 1.1,
        'Finance': 0.9,
        'Governance': 1.4,
        'Environment': 1.1,
    }
    
    df = projects_df.copy()
    df['sector_weight'] = df['sector'].map(sector_weights).fillna(1.0)
    
    # ROI = Bénéficiaires * poids / Budget
    df['roi_score'] = (df['beneficiaries'] * df['sector_weight']) / (df['budget_xof'] + 1)  # +1 évite division par 0
    
    global_roi = df['roi_score'].sum() * 100
    
    if global_roi > 10:
        status = 'success'
    elif global_roi > 5:
        status = 'warning'
    else:
        status = 'danger'
    
    return {
        'roi': global_roi,
        'status': status,
        'by_sector': df.groupby('sector')['roi_score'].mean().to_dict()
    }

# ============================================================================
# KPI COÛT PAR BÉNÉFICIAIRE
# ============================================================================

def calculate_cost_per_beneficiary(projects_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Cost per Beneficiary (Coût par bénéficiaire)
    Formule: Budget / Bénéficiaires
    
    Moins c'est cher par bénéficiaire, mieux c'est
    """
    if projects_df.empty:
        return {'cost_per_beneficiary': 0, 'by_sector': {}}
    
    df = projects_df[projects_df['beneficiaries'] > 0].copy()
    
    if df.empty:
        return {'cost_per_beneficiary': 0, 'by_sector': {}}
    
    df['cost_per_beneficiary'] = df['budget_xof'] / df['beneficiaries']
    
    total_cost_per_beneficiary = df['budget_xof'].sum() / df['beneficiaries'].sum()
    
    by_sector = df.groupby('sector').apply(
        lambda x: (x['budget_xof'].sum() / x['beneficiaries'].sum()) if x['beneficiaries'].sum() > 0 else 0
    ).to_dict()
    
    return {
        'cost_per_beneficiary': total_cost_per_beneficiary,
        'by_sector': by_sector
    }

# ============================================================================
# KPI EFFICIENCY SCORE
# ============================================================================

def calculate_efficiency_score(projects_df: pd.DataFrame) -> float:
    """
    Efficiency Score (Score d'efficacité global)
    Combine: completion_rate, budget_variance, progress
    
    Score 0-100, plus haut = mieux
    """
    if projects_df.empty:
        return 0.0
    
    # 1. Taux de complétion (0-40)
    completion_rate = calculate_completion_rate(projects_df)
    score_completion = completion_rate * 0.4
    
    # 2. Budget (0-30) - Pénalité si dépassement
    budget_var = calculate_budget_variance(projects_df)['variance']
    score_budget = max(0, (30 - abs(budget_var)))  # -1 pour chaque 1% de dépassement
    
    # 3. Avancement moyen (0-30)
    avg_progress = calculate_average_progress(projects_df)
    score_progress = (avg_progress / 100) * 30
    
    total_score = score_completion + score_budget + score_progress
    
    return min(100, total_score)
