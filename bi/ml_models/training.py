"""
Model Training Pipeline
Entraîner et évaluer les modèles ML
"""

import pandas as pd
import numpy as np
import logging
from pathlib import Path
from typing import Dict, Any, Tuple

from .data_preparation import (
    prepare_project_features,
    validate_features,
    get_ml_features_for_delay_prediction,
    get_ml_features_for_budget_prediction
)
from .models import DelayPredictionModel, BudgetForecastingModel

logger = logging.getLogger(__name__)

# ============================================================================
# TRAINING PIPELINE
# ============================================================================

class MLPipeline:
    """
    Pipeline complet: data prep → training → evaluation → saving
    """
    
    def __init__(self, model_dir: str = None):
        """
        Args:
            model_dir: Directory pour sauvegarder les modèles
        """
        self.model_dir = Path(model_dir) if model_dir else Path(__file__).parent / 'models'
        self.model_dir.mkdir(exist_ok=True)
        
        self.delay_model = DelayPredictionModel()
        self.budget_model = BudgetForecastingModel()
        self.training_report = {}
    
    def train_from_projects(
        self,
        projects_df: pd.DataFrame,
        save_models: bool = True
    ) -> Dict[str, Any]:
        """
        Entraîner les deux modèles à partir de données projects
        
        Args:
            projects_df: DataFrame avec tous les projets
            save_models: Sauvegarder après training
        
        Returns:
            Report avec metrics et recommendations
        """
        
        logger.info(f"Training pipeline start avec {len(projects_df)} projets")
        
        # ====================================================================
        # PREPARATION DES DONNEES
        # ====================================================================
        
        # Feature engineering
        df_features = prepare_project_features(projects_df)
        df_clean, data_report = validate_features(df_features)
        
        logger.info(f"Data prep: {data_report['dropped_rows']} rows dropped")
        
        if len(df_clean) < 20:
            logger.warning(f"⚠️ Peu de données ({len(df_clean)} projets). Models peu fiables.")
        
        self.training_report['data_quality'] = data_report
        self.training_report['data_summary'] = {
            'total_projects': len(df_clean),
            'overdue_projects': (df_clean['is_overdue'] == 1).sum(),
            'budget_overruns': (df_clean['is_budget_overrun'] == 1).sum(),
            'avg_budget_variance': df_clean['budget_variance_current'].mean(),
        }
        
        # ====================================================================
        # MODEL 1: DELAY PREDICTION
        # ====================================================================
        
        logger.info("Training Delay Prediction Model...")
        
        feature_cols = get_ml_features_for_delay_prediction()
        feature_cols = [col for col in feature_cols if col in df_clean.columns]
        
        X_delay = df_clean[feature_cols].values
        y_delay = df_clean['is_overdue'].values
        
        if len(np.unique(y_delay)) < 2:
            logger.warning("⚠️ Pas assez de variance dans target delay (tous 0 ou tous 1)")
        
        delay_metrics = self.delay_model.train(
            X_delay,
            y_delay,
            feature_names=pd.Series(feature_cols)
        )
        
        self.training_report['delay_model'] = {
            'metrics': delay_metrics,
            'features': feature_cols,
            'model_class': 'RandomForestClassifier',
            'hyperparams': {
                'n_estimators': 50,
                'max_depth': 8,
                'min_samples_leaf': 5
            }
        }
        
        logger.info(f"Delay Model - Accuracy: {delay_metrics['accuracy']:.2%}")
        
        # ====================================================================
        # MODEL 2: BUDGET FORECASTING
        # ====================================================================
        
        logger.info("Training Budget Forecasting Model...")
        
        feature_cols = get_ml_features_for_budget_prediction()
        feature_cols = [col for col in feature_cols if col in df_clean.columns]
        
        X_budget = df_clean[feature_cols].values
        y_budget = df_clean['is_budget_overrun'].values
        
        if len(np.unique(y_budget)) < 2:
            logger.warning("⚠️ Pas assez de variance dans target budget")
        
        budget_metrics = self.budget_model.train(
            X_budget,
            y_budget,
            feature_names=pd.Series(feature_cols)
        )
        
        self.training_report['budget_model'] = {
            'metrics': budget_metrics,
            'features': feature_cols,
            'model_class': 'RandomForestClassifier',
            'hyperparams': {
                'n_estimators': 50,
                'max_depth': 8,
                'min_samples_leaf': 5
            }
        }
        
        logger.info(f"Budget Model - Accuracy: {budget_metrics['accuracy']:.2%}")
        
        # ====================================================================
        # SAVE MODELS
        # ====================================================================
        
        if save_models:
            self.delay_model.save(str(self.model_dir / 'delay'))
            self.budget_model.save(str(self.model_dir / 'budget'))
            logger.info(f"Models saved to {self.model_dir}")
        
        return self.training_report
    
    def get_model_limitations(self) -> list:
        """
        Limites académiquement défendables
        Important pour mémoire master's
        """
        
        limitations = [
            {
                'category': 'Data Availability',
                'issue': 'Données historiques limitées au démarrage',
                'impact': 'Models peu fiables sur petits datasets (< 100 projets)',
                'mitigation': 'Retraining régulier avec nouvelles données'
            },
            {
                'category': 'Feature Engineering',
                'issue': 'Assume progression linéaire du projet',
                'impact': 'Peut être inexact pour projets non-linéaires',
                'mitigation': 'Ajouter features non-linéaires si données disponibles'
            },
            {
                'category': 'Cold Start',
                'issue': 'Nouveaux projets sans données historiques',
                'impact': 'Prédictions initiales imprécises',
                'mitigation': 'Utiliser sector/region medians pour initialiser'
            },
            {
                'category': 'Model Complexity',
                'issue': 'Random Forest peut être biased avec peu de data',
                'impact': 'Peut overfitter sur patterns artificiels',
                'mitigation': 'Shallow trees (max_depth=8), regularization'
            },
            {
                'category': 'External Events',
                'issue': 'Modèle ignore facteurs externes (crises, policy changes)',
                'impact': 'Peut échouer si contexte change radicalement',
                'mitigation': 'Manual override possibles, monitoring'
            },
            {
                'category': 'Feature Correlation',
                'issue': 'Certaines features peuvent être fortement corrélées',
                'impact': 'Multicollinearity peut réduire coefficient stability',
                'mitigation': 'Feature importance analysis, dimensionality reduction'
            }
        ]
        
        return limitations
    
    def get_deployment_recommendations(self) -> Dict[str, Any]:
        """
        Recommandations pour déploiement responsable
        """
        
        return {
            'validation': [
                'Toujours afficher confidence score (ne pas cacher)',
                'Alerter si model retrain > 30 jours',
                'Validation croisée avant production'
            ],
            'monitoring': [
                'Track actual vs predicted outcomes',
                'Monitor feature distributions (data drift)',
                'Log all predictions pour audit'
            ],
            'retraining': [
                'Retrain mensuellement minimum',
                'Monitor performance metrics',
                'Version control pour reproducibility'
            ],
            'user_education': [
                'Éduquer users sur limitations',
                'Pas de "black box" - expliquer features',
                'Encourage manual verification'
            ]
        }

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def evaluate_model_performance(
    report: Dict[str, Any]
) -> str:
    """
    Générer rapport d'évaluation texte
    """
    
    text = "="*60 + "\n"
    text += "🤖 ML MODELS EVALUATION REPORT\n"
    text += "="*60 + "\n\n"
    
    # Data summary
    if 'data_summary' in report:
        text += "📊 DATA SUMMARY\n"
        text += "-"*40 + "\n"
        for key, val in report['data_summary'].items():
            if isinstance(val, float):
                text += f"{key}: {val:.2f}\n"
            else:
                text += f"{key}: {val}\n"
        text += "\n"
    
    # Delay model
    if 'delay_model' in report:
        text += "⏰ DELAY PREDICTION MODEL\n"
        text += "-"*40 + "\n"
        metrics = report['delay_model']['metrics']
        text += f"Accuracy: {metrics['accuracy']:.2%}\n"
        text += f"ROC-AUC: {metrics['roc_auc']:.2%}\n"
        text += f"Training samples: {metrics['train_size']}\n"
        text += f"Test samples: {metrics['test_size']}\n"
        if 'feature_importance' in metrics:
            text += "Top features:\n"
            top_features = sorted(
                metrics['feature_importance'].items(),
                key=lambda x: x[1],
                reverse=True
            )[:3]
            for feat, imp in top_features:
                text += f"  - {feat}: {imp:.3f}\n"
        text += "\n"
    
    # Budget model
    if 'budget_model' in report:
        text += "💰 BUDGET FORECASTING MODEL\n"
        text += "-"*40 + "\n"
        metrics = report['budget_model']['metrics']
        text += f"Accuracy: {metrics['accuracy']:.2%}\n"
        text += f"ROC-AUC: {metrics['roc_auc']:.2%}\n"
        text += f"Training samples: {metrics['train_size']}\n"
        text += f"Test samples: {metrics['test_size']}\n"
        if 'feature_importance' in metrics:
            text += "Top features:\n"
            top_features = sorted(
                metrics['feature_importance'].items(),
                key=lambda x: x[1],
                reverse=True
            )[:3]
            for feat, imp in top_features:
                text += f"  - {feat}: {imp:.3f}\n"
        text += "\n"
    
    text += "⚠️  ACADEMIC LIMITATIONS\n"
    text += "-"*40 + "\n"
    text += "See get_model_limitations() for details\n"
    text += "\n"
    
    return text
