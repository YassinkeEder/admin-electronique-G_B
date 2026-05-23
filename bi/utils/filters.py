"""
Système de Filtres Avancés
Filtrage fonctionnel pour rapports et exports
"""

import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# FILTER TYPES
# ============================================================================

class FilterOperator(str, Enum):
    """Opérateurs de filtrage"""
    EQUALS = "="
    NOT_EQUALS = "!="
    GREATER_THAN = ">"
    LESS_THAN = "<"
    GREATER_EQUAL = ">="
    LESS_EQUAL = "<="
    CONTAINS = "contains"
    NOT_CONTAINS = "!contains"
    IN = "in"
    NOT_IN = "!in"
    BETWEEN = "between"
    IS_NULL = "is_null"
    IS_NOT_NULL = "is_not_null"

# ============================================================================
# FILTER BUILDER
# ============================================================================

@dataclass
class FilterCondition:
    """Une condition de filtrage"""
    field: str
    operator: FilterOperator
    value: Any
    label: Optional[str] = None
    
    def apply(self, df: pd.DataFrame) -> pd.DataFrame:
        """Appliquer la condition à un DataFrame"""
        
        if self.field not in df.columns:
            logger.warning(f"Field {self.field} not in DataFrame")
            return df
        
        col = df[self.field]
        
        # Opérateurs
        if self.operator == FilterOperator.EQUALS:
            return df[col == self.value]
        
        elif self.operator == FilterOperator.NOT_EQUALS:
            return df[col != self.value]
        
        elif self.operator == FilterOperator.GREATER_THAN:
            return df[col > self.value]
        
        elif self.operator == FilterOperator.LESS_THAN:
            return df[col < self.value]
        
        elif self.operator == FilterOperator.GREATER_EQUAL:
            return df[col >= self.value]
        
        elif self.operator == FilterOperator.LESS_EQUAL:
            return df[col <= self.value]
        
        elif self.operator == FilterOperator.CONTAINS:
            return df[col.astype(str).str.contains(str(self.value), case=False, na=False)]
        
        elif self.operator == FilterOperator.NOT_CONTAINS:
            return df[~col.astype(str).str.contains(str(self.value), case=False, na=False)]
        
        elif self.operator == FilterOperator.IN:
            return df[col.isin(self.value)]
        
        elif self.operator == FilterOperator.NOT_IN:
            return df[~col.isin(self.value)]
        
        elif self.operator == FilterOperator.BETWEEN:
            if isinstance(self.value, (list, tuple)) and len(self.value) == 2:
                return df[(col >= self.value[0]) & (col <= self.value[1])]
            else:
                logger.warning(f"BETWEEN requires 2-element list/tuple, got {self.value}")
                return df
        
        elif self.operator == FilterOperator.IS_NULL:
            return df[col.isna()]
        
        elif self.operator == FilterOperator.IS_NOT_NULL:
            return df[col.notna()]
        
        else:
            logger.warning(f"Unknown operator: {self.operator}")
            return df

# ============================================================================
# ADVANCED FILTER
# ============================================================================

class AdvancedFilter:
    """Moteur de filtrage avancé"""
    
    def __init__(self, df: pd.DataFrame):
        """
        Initialiser le filtre
        
        Args:
            df: DataFrame à filtrer
        """
        self.original_df = df.copy()
        self.current_df = df.copy()
        self.conditions: List[FilterCondition] = []
        self.applied_filters: List[Dict[str, Any]] = []
    
    def add_condition(
        self,
        field: str,
        operator: FilterOperator,
        value: Any,
        label: Optional[str] = None
    ) -> 'AdvancedFilter':
        """
        Ajouter une condition de filtrage
        
        Args:
            field: Nom du champ
            operator: Opérateur de filtrage
            value: Valeur de comparaison
            label: Label optionnel pour affichage
        
        Returns:
            self (pour chaining)
        """
        
        condition = FilterCondition(field, operator, value, label)
        self.conditions.append(condition)
        
        logger.debug(f"Added condition: {field} {operator.value} {value}")
        
        return self
    
    def apply(self) -> pd.DataFrame:
        """Appliquer tous les filtres"""
        
        result = self.original_df.copy()
        
        for condition in self.conditions:
            result = condition.apply(result)
            self.applied_filters.append({
                'field': condition.field,
                'operator': condition.operator.value,
                'value': condition.value,
                'rows_before': len(self.current_df),
                'rows_after': len(result)
            })
        
        self.current_df = result
        
        logger.info(f"Filters applied. Result: {len(result)} rows from {len(self.original_df)}")
        
        return result
    
    def reset(self) -> 'AdvancedFilter':
        """Réinitialiser tous les filtres"""
        self.conditions = []
        self.applied_filters = []
        self.current_df = self.original_df.copy()
        return self
    
    def get_result(self) -> pd.DataFrame:
        """Obtenir le DataFrame filtré actuel"""
        return self.current_df
    
    def get_summary(self) -> Dict[str, Any]:
        """Obtenir résumé des filtres appliqués"""
        
        return {
            'original_rows': len(self.original_df),
            'filtered_rows': len(self.current_df),
            'reduction_percent': (1 - len(self.current_df) / len(self.original_df) * 100) if len(self.original_df) > 0 else 0,
            'conditions_count': len(self.conditions),
            'filters_applied': self.applied_filters
        }

# ============================================================================
# COMMON FILTERS
# ============================================================================

class ProjectFilters:
    """Filtres courantes pour projets"""
    
    @staticmethod
    def by_region(df: pd.DataFrame, regions: List[str]) -> pd.DataFrame:
        """Filtrer par région"""
        if not regions or len(regions) == 0:
            return df
        return df[df['region'].isin(regions)]
    
    @staticmethod
    def by_sector(df: pd.DataFrame, sectors: List[str]) -> pd.DataFrame:
        """Filtrer par secteur"""
        if not sectors or len(sectors) == 0:
            return df
        return df[df['sector'].isin(sectors)]
    
    @staticmethod
    def by_status(df: pd.DataFrame, statuses: List[str]) -> pd.DataFrame:
        """Filtrer par statut"""
        if not statuses or len(statuses) == 0:
            return df
        return df[df['status'].isin(statuses)]
    
    @staticmethod
    def by_date_range(
        df: pd.DataFrame,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        date_field: str = 'start_date'
    ) -> pd.DataFrame:
        """Filtrer par plage de dates"""
        
        if date_field not in df.columns:
            logger.warning(f"Date field {date_field} not found")
            return df
        
        result = df.copy()
        
        if start_date:
            result = result[result[date_field] >= start_date]
        
        if end_date:
            result = result[result[date_field] <= end_date]
        
        return result
    
    @staticmethod
    def by_budget_range(
        df: pd.DataFrame,
        min_budget: Optional[float] = None,
        max_budget: Optional[float] = None
    ) -> pd.DataFrame:
        """Filtrer par plage de budget"""
        
        result = df.copy()
        
        if min_budget is not None:
            result = result[result['budget_xof'] >= min_budget]
        
        if max_budget is not None:
            result = result[result['budget_xof'] <= max_budget]
        
        return result
    
    @staticmethod
    def by_progress_range(
        df: pd.DataFrame,
        min_progress: float = 0,
        max_progress: float = 100
    ) -> pd.DataFrame:
        """Filtrer par plage de progression"""
        
        return df[(df['progress'] >= min_progress) & (df['progress'] <= max_progress)]
    
    @staticmethod
    def overdue_projects(df: pd.DataFrame) -> pd.DataFrame:
        """Obtenir projets en retard"""
        
        if 'end_date' not in df.columns:
            return pd.DataFrame()
        
        now = datetime.now()
        result = df[
            (df['end_date'] < now) & 
            (~df['status'].isin(['COMPLETED', 'CANCELLED']))
        ]
        
        return result
    
    @staticmethod
    def budget_overrun_projects(df: pd.DataFrame) -> pd.DataFrame:
        """Obtenir projets en dépassement budgétaire"""
        
        if 'budget_xof' not in df.columns or 'spent_xof' not in df.columns:
            return pd.DataFrame()
        
        return df[df['spent_xof'] > df['budget_xof']]
    
    @staticmethod
    def at_risk_projects(df: pd.DataFrame) -> pd.DataFrame:
        """Obtenir projets à risque (retard ET budget)"""
        
        overdue = ProjectFilters.overdue_projects(df)
        budget_overrun = ProjectFilters.budget_overrun_projects(df)
        
        # Projets dans les deux catégories
        at_risk_ids = set(overdue.get('id', [])).intersection(set(budget_overrun.get('id', [])))
        
        return df[df['id'].isin(at_risk_ids)]
    
    @staticmethod
    def active_projects(df: pd.DataFrame) -> pd.DataFrame:
        """Obtenir projets actifs"""
        
        active_statuses = ['PLANNED', 'IN_PROGRESS', 'BLOCKED', 'REVIEW']
        return df[df['status'].isin(active_statuses)]

# ============================================================================
# FILTER PRESETS
# ============================================================================

class FilterPreset:
    """Presets de filtres pour rapports courants"""
    
    @staticmethod
    def risk_report(df: pd.DataFrame) -> pd.DataFrame:
        """Rapport risques: projets overdue et budget overrun"""
        
        filter_obj = AdvancedFilter(df)
        
        # Projets actifs en retard ou budget overrun
        active_statuses = ['PLANNED', 'IN_PROGRESS', 'BLOCKED']
        filter_obj.add_condition('status', FilterOperator.IN, active_statuses, 'Status actif')
        
        # Retard
        overdue = ProjectFilters.overdue_projects(df)
        budget_overrun = ProjectFilters.budget_overrun_projects(df)
        
        # Union des deux
        at_risk = pd.concat([overdue, budget_overrun]).drop_duplicates()
        
        return at_risk
    
    @staticmethod
    def performance_report(df: pd.DataFrame) -> pd.DataFrame:
        """Rapport performance: projets complétés avec variances"""
        
        filter_obj = AdvancedFilter(df)
        filter_obj.add_condition('status', FilterOperator.EQUALS, 'COMPLETED', 'Complétés')
        result = filter_obj.apply()
        
        # Ajouter variance budget
        if not result.empty and 'budget_xof' in result.columns and 'spent_xof' in result.columns:
            result['budget_variance'] = ((result['spent_xof'] - result['budget_xof']) / result['budget_xof'] * 100)
        
        return result
    
    @staticmethod
    def regional_summary(df: pd.DataFrame, region: str) -> pd.DataFrame:
        """Résumé régional"""
        
        return ProjectFilters.by_region(df, [region])
    
    @staticmethod
    def sector_analysis(df: pd.DataFrame, sector: str) -> pd.DataFrame:
        """Analyse sectorielle"""
        
        return ProjectFilters.by_sector(df, [sector])

# ============================================================================
# FILTER EXPORT/IMPORT
# ============================================================================

def save_filter_preset(name: str, conditions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Sauvegarder un preset de filtre"""
    
    return {
        'name': name,
        'created_at': datetime.now().isoformat(),
        'conditions': conditions
    }

def apply_preset(df: pd.DataFrame, preset: Dict[str, Any]) -> pd.DataFrame:
    """Appliquer un preset de filtre"""
    
    filter_obj = AdvancedFilter(df)
    
    for condition in preset.get('conditions', []):
        filter_obj.add_condition(
            condition['field'],
            FilterOperator(condition['operator']),
            condition['value'],
            condition.get('label')
        )
    
    return filter_obj.apply()
