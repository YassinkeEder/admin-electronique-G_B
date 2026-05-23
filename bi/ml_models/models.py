"""
ML Models pour Prédictions BI
Delay Prediction & Budget Forecasting
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score, accuracy_score,
    mean_absolute_error, mean_squared_error, r2_score
)
import joblib
from pathlib import Path
from typing import Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# MODEL 1: DELAY PREDICTION (Classification)
# ============================================================================

class DelayPredictionModel:
    """
    Prédire probabilité qu'un projet finisse en retard
    
    Input: État actuel du projet (jours écoulés, progress, budget)
    Output: Probabilité de retard (0-1) + classification (oui/non)
    
    Model: Random Forest Classifier (robust, interpretable)
    
    Limitations:
    - Données historiques limitées au démarrage
    - Assume pattern basé sur données existantes
    - Cold start problem (nouveaux projets)
    - Feature engineering basé sur progression linéaire
    """
    
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=50,           # Pas trop (risk overfitting)
            max_depth=8,               # Limité pour éviter overfitting
            min_samples_leaf=5,        # Min 5 projets par leaf
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        self.feature_names = None
        self.is_trained = False
        
    def train(
        self,
        X: np.ndarray,
        y: np.ndarray,
        feature_names: pd.Series = None,
        test_size: float = 0.2
    ) -> Dict[str, Any]:
        """
        Entraîner modèle avec cross-validation
        
        Args:
            X: Features (n_samples, n_features)
            y: Target (n_samples,) - 1 if overdue, 0 if not
            feature_names: Noms des features
            test_size: Proportion test set
        
        Returns:
            Metrics: accuracy, precision, recall, roc_auc
        """
        
        if len(X) < 20:
            logger.warning(f"Peu de données (n={len(X)}), risque overfitting")
        
        # Split train/test
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        # Normalize features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train
        self.model.fit(X_train_scaled, y_train)
        self.feature_names = feature_names
        self.is_trained = True
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]
        
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': np.mean([
                (y_pred[y_test == 1] == y_test[y_test == 1]).sum() / max((y_pred == 1).sum(), 1)
                if (y_pred == 1).sum() > 0 else 0
            ]),
            'recall': np.mean([
                (y_pred[y_test == 1] == y_test[y_test == 1]).sum() / max((y_test == 1).sum(), 1)
                if (y_test == 1).sum() > 0 else 0
            ]),
            'roc_auc': roc_auc_score(y_test, y_pred_proba) if len(np.unique(y_test)) > 1 else 0,
            'train_size': len(X_train),
            'test_size': len(X_test),
            'feature_importance': self._get_feature_importance()
        }
        
        logger.info(f"Delay model trained. Accuracy: {metrics['accuracy']:.2%}, ROC-AUC: {metrics['roc_auc']:.2%}")
        
        return metrics
    
    def predict(self, X: np.ndarray) -> Dict[str, Any]:
        """
        Prédire pour nouveau projet
        
        Returns:
            {
                'will_be_late': bool,
                'probability': float (0-1),
                'confidence': float (0-1)  # 1 = très sûr, 0.5 = incertain
            }
        """
        
        if not self.is_trained:
            raise ValueError("Model not trained yet")
        
        X_scaled = self.scaler.transform(X.reshape(1, -1))
        pred = self.model.predict(X_scaled)[0]
        proba = self.model.predict_proba(X_scaled)[0]
        
        return {
            'will_be_late': bool(pred),
            'probability': float(proba[1]),  # P(overdue=1)
            'confidence': float(max(proba))  # Max probability
        }
    
    def _get_feature_importance(self) -> Dict[str, float]:
        """Retourner importance de chaque feature"""
        if self.feature_names is None:
            return {}
        
        importances = self.model.feature_importances_
        return dict(zip(self.feature_names, importances))
    
    def save(self, filepath: str):
        """Sauvegarder model"""
        joblib.dump(self.model, filepath + '_model.joblib')
        joblib.dump(self.scaler, filepath + '_scaler.joblib')
        joblib.dump(self.feature_names, filepath + '_features.joblib')
    
    def load(self, filepath: str):
        """Charger model"""
        self.model = joblib.load(filepath + '_model.joblib')
        self.scaler = joblib.load(filepath + '_scaler.joblib')
        self.feature_names = joblib.load(filepath + '_features.joblib')
        self.is_trained = True

# ============================================================================
# MODEL 2: BUDGET FORECASTING (Classification)
# ============================================================================

class BudgetForecastingModel:
    """
    Prédire probabilité de dépassement budget
    
    Input: Trajectory actuelle (spending rate, progress)
    Output: Probabilité de dépassement (0-1)
    
    Model: Random Forest Classifier
    
    Limitations:
    - Assume spending rate reste constant
    - Budget final peut changer (réallocations)
    - Events externes non modélisés (crises)
    - Données historiques limitées initialement
    """
    
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=50,
            max_depth=8,
            min_samples_leaf=5,
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        self.feature_names = None
        self.is_trained = False
    
    def train(
        self,
        X: np.ndarray,
        y: np.ndarray,
        feature_names: pd.Series = None,
        test_size: float = 0.2
    ) -> Dict[str, Any]:
        """
        Entraîner modèle
        
        Args:
            X: Features (n_samples, n_features)
            y: Target (n_samples,) - 1 if budget overrun, 0 if ok
            feature_names: Noms features
        """
        
        if len(X) < 20:
            logger.warning(f"Peu de données (n={len(X)}), risque overfitting")
        
        # Split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        # Normalize
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train
        self.model.fit(X_train_scaled, y_train)
        self.feature_names = feature_names
        self.is_trained = True
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]
        
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'roc_auc': roc_auc_score(y_test, y_pred_proba) if len(np.unique(y_test)) > 1 else 0,
            'train_size': len(X_train),
            'test_size': len(X_test),
            'feature_importance': self._get_feature_importance()
        }
        
        logger.info(f"Budget model trained. Accuracy: {metrics['accuracy']:.2%}")
        
        return metrics
    
    def predict(self, X: np.ndarray) -> Dict[str, Any]:
        """Prédire dépassement budget"""
        
        if not self.is_trained:
            raise ValueError("Model not trained yet")
        
        X_scaled = self.scaler.transform(X.reshape(1, -1))
        pred = self.model.predict(X_scaled)[0]
        proba = self.model.predict_proba(X_scaled)[0]
        
        return {
            'will_overrun': bool(pred),
            'probability': float(proba[1]),
            'confidence': float(max(proba))
        }
    
    def _get_feature_importance(self) -> Dict[str, float]:
        """Retourner importance features"""
        if self.feature_names is None:
            return {}
        
        importances = self.model.feature_importances_
        return dict(zip(self.feature_names, importances))
    
    def save(self, filepath: str):
        """Sauvegarder"""
        joblib.dump(self.model, filepath + '_model.joblib')
        joblib.dump(self.scaler, filepath + '_scaler.joblib')
        joblib.dump(self.feature_names, filepath + '_features.joblib')
    
    def load(self, filepath: str):
        """Charger"""
        self.model = joblib.load(filepath + '_model.joblib')
        self.scaler = joblib.load(filepath + '_scaler.joblib')
        self.feature_names = joblib.load(filepath + '_features.joblib')
        self.is_trained = True
