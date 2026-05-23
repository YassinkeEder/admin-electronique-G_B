"""
Système d'Audit Logging
Suivi des accès et modifications pour gouvernance
"""

import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from enum import Enum
import logging
import hashlib
import json

logger = logging.getLogger(__name__)

# ============================================================================
# ENUMS
# ============================================================================

class AuditAction(str, Enum):
    """Actions auditables"""
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    VIEW_DASHBOARD = "VIEW_DASHBOARD"
    EXPORT_CSV = "EXPORT_CSV"
    EXPORT_EXCEL = "EXPORT_EXCEL"
    EXPORT_PDF = "EXPORT_PDF"
    CREATE_PROJECT = "CREATE_PROJECT"
    UPDATE_PROJECT = "UPDATE_PROJECT"
    DELETE_PROJECT = "DELETE_PROJECT"
    VIEW_PROJECT = "VIEW_PROJECT"
    FILTER_APPLIED = "FILTER_APPLIED"
    ML_PREDICTION = "ML_PREDICTION"
    REPORT_GENERATED = "REPORT_GENERATED"
    AUDIT_LOG_VIEWED = "AUDIT_LOG_VIEWED"
    UNKNOWN = "UNKNOWN"

class AuditLevel(str, Enum):
    """Niveau de criticité"""
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

# ============================================================================
# AUDIT LOG
# ============================================================================

class AuditLogger:
    """Gère le logging d'audit"""
    
    def __init__(self):
        self.logs: List[Dict[str, Any]] = []
    
    def log(
        self,
        action: AuditAction,
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        level: AuditLevel = AuditLevel.INFO,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Enregistrer une action d'audit
        
        Args:
            action: Type d'action (AuditAction enum)
            user_id: ID de l'utilisateur
            resource_type: Type de ressource (project, report, export, etc.)
            resource_id: ID de la ressource
            details: Détails additionnels (dict)
            level: Niveau de criticité
            ip_address: Adresse IP
        
        Returns:
            Log entry
        """
        
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'action': action.value if isinstance(action, AuditAction) else action,
            'user_id': user_id or 'SYSTEM',
            'resource_type': resource_type,
            'resource_id': resource_id,
            'level': level.value if isinstance(level, AuditLevel) else level,
            'ip_address': ip_address or 'UNKNOWN',
            'details': details or {},
            'entry_hash': None  # Will be computed
        }
        
        # Compute hash for integrity
        log_entry['entry_hash'] = self._compute_hash(log_entry)
        
        self.logs.append(log_entry)
        logger.info(f"Audit: {action.value} by {user_id or 'SYSTEM'}")
        
        return log_entry
    
    def get_logs(
        self,
        action: Optional[AuditAction] = None,
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        level: Optional[AuditLevel] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 1000
    ) -> pd.DataFrame:
        """
        Récupérer les logs d'audit filtrés
        
        Args:
            action: Filtrer par action
            user_id: Filtrer par utilisateur
            resource_type: Filtrer par type de ressource
            level: Filtrer par niveau
            start_date: Début de la période
            end_date: Fin de la période
            limit: Nombre maximum de logs
        
        Returns:
            DataFrame avec logs
        """
        
        filtered_logs = self.logs.copy()
        
        # Appliquer filtres
        if action:
            action_val = action.value if isinstance(action, AuditAction) else action
            filtered_logs = [l for l in filtered_logs if l['action'] == action_val]
        
        if user_id:
            filtered_logs = [l for l in filtered_logs if l['user_id'] == user_id]
        
        if resource_type:
            filtered_logs = [l for l in filtered_logs if l['resource_type'] == resource_type]
        
        if level:
            level_val = level.value if isinstance(level, AuditLevel) else level
            filtered_logs = [l for l in filtered_logs if l['level'] == level_val]
        
        if start_date or end_date:
            filtered_logs_with_dates = []
            for log in filtered_logs:
                log_date = datetime.fromisoformat(log['timestamp'])
                
                if start_date and log_date < start_date:
                    continue
                if end_date and log_date > end_date:
                    continue
                
                filtered_logs_with_dates.append(log)
            
            filtered_logs = filtered_logs_with_dates
        
        # Limiter résultats
        filtered_logs = filtered_logs[-limit:]
        
        # Convertir en DataFrame
        if not filtered_logs:
            return pd.DataFrame()
        
        df = pd.DataFrame(filtered_logs)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        return df
    
    def get_statistics(self) -> Dict[str, Any]:
        """Obtenir statistiques d'audit"""
        
        if not self.logs:
            return {}
        
        df = pd.DataFrame(self.logs)
        
        return {
            'total_entries': len(df),
            'unique_users': df['user_id'].nunique(),
            'actions_count': df['action'].value_counts().to_dict(),
            'levels_count': df['level'].value_counts().to_dict(),
            'date_range': {
                'start': df['timestamp'].min(),
                'end': df['timestamp'].max()
            }
        }
    
    def export_logs(
        self,
        format_type: str = 'csv',
        **filters
    ) -> Any:
        """
        Exporter les logs d'audit
        
        Args:
            format_type: Format d'export (csv, excel, json, pandas)
            **filters: Filtres à appliquer
        
        Returns:
            Données exportées
        """
        
        df = self.get_logs(**filters)
        
        if df.empty:
            logger.warning("No audit logs to export")
            return None
        
        if format_type == 'csv':
            return df.to_csv(index=False)
        
        elif format_type == 'json':
            return df.to_json(orient='records', date_format='iso')
        
        elif format_type == 'excel':
            from io import BytesIO
            output = BytesIO()
            df.to_excel(output, index=False)
            output.seek(0)
            return output.getvalue()
        
        elif format_type == 'pandas':
            return df
        
        else:
            raise ValueError(f"Unknown export format: {format_type}")
    
    def verify_integrity(self) -> Dict[str, Any]:
        """Vérifier l'intégrité des logs (détection de falsification)"""
        
        if not self.logs:
            return {'status': 'empty', 'valid': True}
        
        tampered = []
        valid = True
        
        for idx, log in enumerate(self.logs):
            original_hash = log.get('entry_hash')
            
            # Recalculer le hash sans le hash lui-même
            log_copy = log.copy()
            log_copy['entry_hash'] = None
            computed_hash = self._compute_hash(log_copy)
            
            if original_hash != computed_hash:
                tampered.append({
                    'index': idx,
                    'action': log['action'],
                    'timestamp': log['timestamp'],
                    'reason': 'Hash mismatch'
                })
                valid = False
        
        return {
            'status': 'valid' if valid else 'tampered',
            'valid': valid,
            'total_entries': len(self.logs),
            'tampered_count': len(tampered),
            'tampered_entries': tampered
        }
    
    @staticmethod
    def _compute_hash(log_entry: Dict[str, Any]) -> str:
        """Calculer hash d'une entrée de log"""
        
        # Exclure le hash lui-même
        log_copy = log_entry.copy()
        log_copy.pop('entry_hash', None)
        
        # Sérialiser en JSON (ordre stable)
        serialized = json.dumps(log_copy, sort_keys=True, default=str)
        
        # Calculer SHA256
        return hashlib.sha256(serialized.encode()).hexdigest()

# ============================================================================
# GLOBAL AUDIT LOGGER (Singleton)
# ============================================================================

_audit_logger = None

def get_audit_logger() -> AuditLogger:
    """Obtenir instance globale d'audit logger"""
    global _audit_logger
    if _audit_logger is None:
        _audit_logger = AuditLogger()
    return _audit_logger

def log_action(
    action: AuditAction,
    user_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    level: AuditLevel = AuditLevel.INFO
) -> Dict[str, Any]:
    """Raccourci pour enregistrer une action"""
    logger = get_audit_logger()
    return logger.log(action, user_id, resource_type, resource_id, details, level)

# ============================================================================
# AUDIT CONTEXT MANAGER
# ============================================================================

class AuditContext:
    """Context manager pour logger les actions avec métadonnées automatiques"""
    
    def __init__(
        self,
        action: AuditAction,
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None
    ):
        self.action = action
        self.user_id = user_id
        self.resource_type = resource_type
        self.resource_id = resource_id
        self.details = {
            'start_time': datetime.now(),
            'status': 'pending'
        }
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.details['end_time'] = datetime.now()
        self.details['duration_seconds'] = (
            self.details['end_time'] - self.details['start_time']
        ).total_seconds()
        
        if exc_type:
            self.details['status'] = 'error'
            self.details['error'] = str(exc_val)
            level = AuditLevel.ERROR
        else:
            self.details['status'] = 'success'
            level = AuditLevel.INFO
        
        log_action(
            self.action,
            user_id=self.user_id,
            resource_type=self.resource_type,
            resource_id=self.resource_id,
            details=self.details,
            level=level
        )
