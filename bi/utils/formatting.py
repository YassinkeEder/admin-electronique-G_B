"""
Utilitaires de formatage et constantes de couleurs
"""

import pandas as pd
from typing import Dict

# ============================================================================
# FORMATAGE DES DONNÉES
# ============================================================================

def format_xof(value: float) -> str:
    """
    Formater montant en XOF (Franc de Guinée-Bissau)
    Exemple: 1500000 → '₣ 1,500,000'
    """
    if pd.isna(value):
        return "₣ -"
    return f"₣ {value:,.0f}"

def format_percentage(value: float, decimals: int = 1) -> str:
    """
    Formater pourcentage
    Exemple: 45.234 → '45.2%'
    """
    if pd.isna(value):
        return "-"
    return f"{value:.{decimals}f}%"

def format_number(value: float, decimals: int = 0) -> str:
    """
    Formater nombre avec séparateurs
    Exemple: 1500000 → '1,500,000'
    """
    if pd.isna(value):
        return "-"
    if decimals == 0:
        return f"{value:,.0f}"
    return f"{value:,.{decimals}f}"

def format_date(date_str: str) -> str:
    """
    Formater date
    Exemple: '2026-04-19' → '19 avril 2026'
    """
    try:
        date_obj = pd.to_datetime(date_str)
        return date_obj.strftime('%d %b %Y')
    except:
        return str(date_str)

def get_status_badge(status: str) -> str:
    """
    Retourner emoji + label pour statut
    """
    status_map = {
        'PLANNED': '📋 Planifié',
        'IN_PROGRESS': '⚙️ En cours',
        'COMPLETED': '✅ Terminé',
        'SUSPENDED': '⏸️ Suspendu',
        'CANCELLED': '❌ Annulé',
    }
    return status_map.get(status, status)

# ============================================================================
# STATISTIQUES
# ============================================================================

def summarize_numeric(series: pd.Series) -> Dict[str, float]:
    """
    Résumé statistique d'une colonne numérique
    """
    return {
        'min': series.min(),
        'max': series.max(),
        'mean': series.mean(),
        'median': series.median(),
        'std': series.std(),
        'total': series.sum()
    }

def calculate_percentage_change(current: float, previous: float) -> float:
    """
    Calculer % changement entre deux valeurs
    """
    if previous == 0:
        return 0.0
    return ((current - previous) / abs(previous)) * 100

# ============================================================================
# HELPERS DATAFRAME
# ============================================================================

def add_budget_status_column(df: pd.DataFrame) -> pd.DataFrame:
    """
    Ajouter colonne 'budget_status' selon utilisation
    """
    df_copy = df.copy()
    
    def get_status(row):
        if row['budget_xof'] == 0:
            return 'N/A'
        util = (row['spent_xof'] / row['budget_xof']) * 100
        if util > 90:
            return '🔴 Critique'
        elif util > 70:
            return '🟡 Alerte'
        elif util > 50:
            return '🟢 Normal'
        else:
            return '🟢 Bon'
    
    df_copy['budget_status'] = df_copy.apply(get_status, axis=1)
    return df_copy

def add_delay_status_column(df: pd.DataFrame) -> pd.DataFrame:
    """
    Ajouter colonne 'delay_status' selon date fin
    """
    df_copy = df.copy()
    today = pd.Timestamp.now()
    
    def get_status(row):
        if pd.isna(row['end_date']):
            return 'N/A'
        
        end = pd.to_datetime(row['end_date'])
        days_diff = (end - today).days
        
        if days_diff < 0:
            return f"🔴 {abs(days_diff)}j en retard"
        elif days_diff < 30:
            return f"🟡 {days_diff}j restants"
        else:
            return f"🟢 {days_diff}j"
    
    df_copy['delay_status'] = df_copy.apply(get_status, axis=1)
    return df_copy

def filter_dataframe(df: pd.DataFrame, **kwargs) -> pd.DataFrame:
    """
    Filtrer dataframe selon critères multiples
    
    Exemple:
        filter_dataframe(df, region='Bissau', status='IN_PROGRESS')
    """
    result = df.copy()
    
    for column, value in kwargs.items():
        if column in result.columns and value is not None:
            if isinstance(value, list):
                result = result[result[column].isin(value)]
            else:
                result = result[result[column] == value]
    
    return result
