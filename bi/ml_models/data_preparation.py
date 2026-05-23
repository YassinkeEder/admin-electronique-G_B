"""
Data Preparation - Feature Engineering pour ML Models
Crée features à partir des données projects pour prédictions
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# FEATURE ENGINEERING: Transformer données brutes en features utiles
# ============================================================================

def prepare_project_features(projects_df: pd.DataFrame) -> pd.DataFrame:
    """
    Créer features à partir de projet data pour ML models
    
    Features créées:
    - Timeline: days_elapsed, days_remaining, project_duration
    - Budget: budget_variance, spending_rate, budget_per_day
    - Progress: progress_ratio, completion_rate
    - Context: region_encoded, sector_encoded, status_encoded
    
    Args:
        projects_df: DataFrame avec colonnes projects
    
    Returns:
        DataFrame avec features + original columns
    """
    
    if projects_df.empty:
        return pd.DataFrame()
    
    df = projects_df.copy()
    today = datetime.now()
    
    # Convertir dates en datetime
    for col in ['start_date', 'end_date', 'created_at', 'updated_at']:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col])
    
    # ========================================================================
    # TIMELINE FEATURES
    # ========================================================================
    
    # Days elapsed depuis start_date
    df['days_elapsed'] = (today - df['start_date']).dt.days.clip(lower=0)
    
    # Days remaining jusqu'à end_date
    df['days_remaining'] = (df['end_date'] - today).dt.days.clip(lower=0)
    
    # Total project duration en jours
    df['project_duration_days'] = (df['end_date'] - df['start_date']).dt.days.clip(lower=1)
    
    # Progress ratio (0-1 instead of 0-100)
    df['progress_ratio'] = df['progress'].clip(0, 100) / 100
    
    # Expected progress given time elapsed (linear assumption)
    df['expected_progress_ratio'] = (df['days_elapsed'] / df['project_duration_days']).clip(0, 1)
    
    # Progress gap: actual vs expected (negative = behind, positive = ahead)
    df['progress_gap'] = df['progress_ratio'] - df['expected_progress_ratio']
    
    # ========================================================================
    # BUDGET FEATURES
    # ========================================================================
    
    # Current budget variance (%)
    df['budget_variance_current'] = np.where(
        df['budget_xof'] > 0,
        ((df['spent_xof'] - df['budget_xof']) / df['budget_xof']) * 100,
        0
    )
    
    # Spending rate (XOF per day)
    df['spending_rate_per_day'] = np.where(
        df['days_elapsed'] > 0,
        df['spent_xof'] / df['days_elapsed'],
        df['spent_xof'] / 1  # Si days_elapsed = 0, utiliser spent directement
    )
    
    # Projected spending at end of project
    df['projected_spending'] = df['spending_rate_per_day'] * df['project_duration_days']
    
    # Projected budget variance at end
    df['projected_budget_variance'] = np.where(
        df['budget_xof'] > 0,
        ((df['projected_spending'] - df['budget_xof']) / df['budget_xof']) * 100,
        df['budget_variance_current']
    )
    
    # Budget health (0-1, 1 = perfect)
    df['budget_health'] = (1 - np.abs(df['budget_variance_current']) / 100).clip(0, 1)
    
    # Budget utilization (0-1, 0 = nothing spent, 1 = fully spent)
    df['budget_utilization'] = np.where(
        df['budget_xof'] > 0,
        df['spent_xof'] / df['budget_xof'],
        0
    ).clip(0, 1)
    
    # ========================================================================
    # SCALE & IMPACT FEATURES
    # ========================================================================
    
    # Project size categories (log scale)
    df['project_size_log'] = np.log1p(df['budget_xof'])  # log(1 + budget)
    
    # Beneficiary impact per XOF spent
    df['beneficiary_impact'] = np.where(
        df['budget_xof'] > 0,
        df['beneficiaries'] / df['budget_xof'],
        0
    )
    
    # ========================================================================
    # ENCODED CATEGORICAL FEATURES (pour ML)
    # ========================================================================
    
    # Encode status: 0=PLANNED, 1=IN_PROGRESS, 2=COMPLETED, 3=SUSPENDED, 4=CANCELLED
    status_mapping = {
        'PLANNED': 0,
        'IN_PROGRESS': 1,
        'COMPLETED': 2,
        'SUSPENDED': 3,
        'CANCELLED': 4
    }
    df['status_encoded'] = df['status'].map(status_mapping).fillna(0)
    
    # Encode region: 0-8 (alphabetically)
    regions = sorted(df['region'].unique())
    region_mapping = {region: idx for idx, region in enumerate(regions)}
    df['region_encoded'] = df['region'].map(region_mapping).fillna(0)
    
    # Encode sector
    sectors = sorted(df['sector'].unique())
    sector_mapping = {sector: idx for idx, sector in enumerate(sectors)}
    df['sector_encoded'] = df['sector'].map(sector_mapping).fillna(0)
    
    # ========================================================================
    # TARGET VARIABLES (pour supervised learning)
    # ========================================================================
    
    # Target 1: Delay Risk (binary classification)
    # 1 = projet en retard, 0 = à l'heure
    df['is_overdue'] = (
        (df['end_date'] < today) & 
        (~df['status'].isin(['COMPLETED', 'CANCELLED']))
    ).astype(int)
    
    # Target 2: Budget Overrun Risk (binary classification)
    # 1 = dépassement détecté/projeté, 0 = normal
    df['is_budget_overrun'] = (df['projected_budget_variance'] > 10).astype(int)
    
    # Target 3: Budget Variance (regression)
    # Valeur continue: overspend % (peut être négatif si sous-budget)
    df['target_budget_variance'] = df['projected_budget_variance']
    
    return df

# ============================================================================
# DATA VALIDATION & CLEANING
# ============================================================================

def validate_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Valider et nettoyer les features créées
    
    Returns:
        (df_cleaned, validation_report)
    """
    
    report = {
        'total_rows': len(df),
        'dropped_rows': 0,
        'missing_values': {},
        'errors': []
    }
    
    df_clean = df.copy()
    
    # Vérifier colonnes essentielles
    required_cols = [
        'days_elapsed', 'days_remaining', 'progress_ratio',
        'budget_variance_current', 'spending_rate_per_day',
        'status_encoded', 'region_encoded', 'sector_encoded'
    ]
    
    for col in required_cols:
        if col not in df_clean.columns:
            report['errors'].append(f"Colonne manquante: {col}")
            continue
        
        # Compter NaN/Inf
        missing = df_clean[col].isna().sum() + np.isinf(df_clean[col]).sum()
        if missing > 0:
            report['missing_values'][col] = missing
            # Remplir NaN/Inf
            df_clean[col] = df_clean[col].replace([np.inf, -np.inf], np.nan)
            df_clean[col].fillna(df_clean[col].median(), inplace=True)
    
    # Supprimer rows avec trop de NaN
    df_clean = df_clean.dropna(subset=required_cols)
    report['dropped_rows'] = report['total_rows'] - len(df_clean)
    
    return df_clean, report

# ============================================================================
# FEATURE SELECTION: Choisir features importantes
# ============================================================================

def get_ml_features_for_delay_prediction() -> list:
    """Features pour prédire retards"""
    return [
        'days_elapsed',
        'progress_ratio',
        'expected_progress_ratio',
        'progress_gap',
        'budget_variance_current',
        'spending_rate_per_day',
        'region_encoded',
        'sector_encoded',
        'beneficiary_impact',
    ]

def get_ml_features_for_budget_prediction() -> list:
    """Features pour prédire dépassement budget"""
    return [
        'days_elapsed',
        'project_duration_days',
        'spending_rate_per_day',
        'budget_utilization',
        'progress_ratio',
        'project_size_log',
        'region_encoded',
        'sector_encoded',
    ]

# ============================================================================
# DATA SUMMARY & STATISTICS
# ============================================================================

def get_data_summary(df_features: pd.DataFrame) -> Dict[str, Any]:
    """
    Résumé statistique des features pour rapport ML
    """
    
    summary = {
        'total_projects': len(df_features),
        'completed_projects': len(df_features[df_features['status_encoded'] == 2]),
        'overdue_projects': df_features['is_overdue'].sum(),
        'budget_overruns': df_features['is_budget_overrun'].sum(),
        'avg_progress': df_features['progress_ratio'].mean() * 100,
        'avg_budget_variance': df_features['budget_variance_current'].mean(),
        'avg_days_elapsed': df_features['days_elapsed'].mean(),
        'feature_statistics': df_features[[
            'days_elapsed', 'progress_ratio', 'budget_variance_current',
            'spending_rate_per_day'
        ]].describe().to_dict()
    }
    
    return summary

# ============================================================================
# EXPORT FEATURES POUR MODEL TRAINING
# ============================================================================

def get_training_data(
    projects_df: pd.DataFrame,
    target: str = 'delay'
) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
    """
    Préparer X, y, df pour model training
    
    Args:
        projects_df: DataFrame projects brut
        target: 'delay' ou 'budget'
    
    Returns:
        (X_features, y_target, feature_names)
    """
    
    # Feature engineering
    df_features = prepare_project_features(projects_df)
    df_clean, _ = validate_features(df_features)
    
    # Sélectionner features selon target
    if target == 'delay':
        feature_cols = get_ml_features_for_delay_prediction()
        y = df_clean['is_overdue'].values
    elif target == 'budget':
        feature_cols = get_ml_features_for_budget_prediction()
        y = df_clean['is_budget_overrun'].values
    else:
        raise ValueError(f"Target inconnu: {target}")
    
    # Vérifier que toutes les features existent
    feature_cols = [col for col in feature_cols if col in df_clean.columns]
    
    X = df_clean[feature_cols].values
    
    return X, y, pd.Series(feature_cols)
