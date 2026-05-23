"""
Test Script for ML Pipeline
Démonstration et validation des modèles
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from ml_models.data_preparation import prepare_project_features, validate_features
from ml_models.models import DelayPredictionModel, BudgetForecastingModel
from ml_models.training import MLPipeline, evaluate_model_performance


def create_synthetic_projects(n_projects: int = 50) -> pd.DataFrame:
    """
    Créer données de test réalistes pour démonstration
    
    Args:
        n_projects: Nombre de projets à générer
    
    Returns:
        DataFrame avec projets réalistes
    """
    
    np.random.seed(42)
    
    regions = ['Bissau', 'Gabu', 'Bafata', 'Cacheu', 'Biombo', 'Oio', 'Tombali', 'Quinara']
    sectors = ['Santé', 'Éducation', 'Infrastructure', 'Agriculture', 'Eau', 'Énergie', 'Transport', 'Justice', 'Autre']
    statuses = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE']
    
    projects = []
    
    for i in range(n_projects):
        # Timeline
        start_date = datetime.now() - timedelta(days=np.random.randint(30, 500))
        planned_duration = np.random.randint(60, 480)  # 2-16 months
        planned_end = start_date + timedelta(days=planned_duration)
        
        days_elapsed = (datetime.now() - start_date).days
        days_remaining_planned = (planned_end - datetime.now()).days
        
        # Budget in XOF (Guinea-Bissau currency)
        budget_xof = np.random.uniform(5_000_000, 500_000_000)  # 5M to 500M XOF
        
        # Progress (incomplete projects less likely to be 100%)
        if np.random.random() < 0.3:  # 30% complete
            progress = 100
            spent_ratio = np.random.uniform(0.95, 1.05)  # 95-105% spent
        else:  # Ongoing
            progress = np.random.uniform(10, 90)
            spent_ratio = progress / 100 + np.random.normal(0, 0.15)  # Spending aligned with progress ± noise
        
        spent_xof = budget_xof * spent_ratio
        
        # Other metrics
        beneficiaries = np.random.randint(100, 100_000)
        region = np.random.choice(regions)
        sector = np.random.choice(sectors)
        status = np.random.choice(statuses)
        
        projects.append({
            'id': f'PRJ-{i+1:03d}',
            'name': f'Projet {sector} - {region}',
            'region': region,
            'sector': sector,
            'status': status,
            'start_date': start_date,
            'end_date': planned_end,
            'budget_xof': budget_xof,
            'spent_xof': spent_xof,
            'progress': progress,
            'beneficiaries': beneficiaries,
            'description': f'Projet {sector} région {region}',
            'created_at': start_date,
        })
    
    return pd.DataFrame(projects)


def test_data_preparation():
    """Test feature engineering"""
    print("\n" + "="*60)
    print("TEST 1: DATA PREPARATION")
    print("="*60)
    
    # Create synthetic data
    projects = create_synthetic_projects(n_projects=50)
    print(f"\n✓ Created {len(projects)} synthetic projects")
    
    # Feature engineering
    df_features = prepare_project_features(projects)
    print(f"✓ Generated features shape: {df_features.shape}")
    print(f"  Columns: {', '.join(df_features.columns[:5])}...")
    
    # Validation
    df_clean, report = validate_features(df_features)
    print(f"✓ Data validation: {len(df_clean)} valid projects")
    print(f"  Dropped rows: {report['dropped_rows']}")
    print(f"  NaN issues: {report['nan_count']}")
    
    return df_clean


def test_model_training(df_clean: pd.DataFrame):
    """Test model training"""
    print("\n" + "="*60)
    print("TEST 2: MODEL TRAINING")
    print("="*60)
    
    pipeline = MLPipeline()
    
    print("\n⏳ Training delay and budget models...")
    report = pipeline.train_from_projects(df_clean, save_models=False)
    
    # Delay model metrics
    print("\n✓ DELAY PREDICTION MODEL")
    delay_metrics = report['delay_model']['metrics']
    print(f"  Accuracy: {delay_metrics['accuracy']:.2%}")
    print(f"  ROC-AUC: {delay_metrics['roc_auc']:.2%}")
    print(f"  Train samples: {delay_metrics['train_size']}")
    print(f"  Test samples: {delay_metrics['test_size']}")
    
    if delay_metrics['feature_importance']:
        top_features = sorted(
            delay_metrics['feature_importance'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:3]
        print("  Top features:")
        for feat, imp in top_features:
            print(f"    - {feat}: {imp:.3f}")
    
    # Budget model metrics
    print("\n✓ BUDGET FORECASTING MODEL")
    budget_metrics = report['budget_model']['metrics']
    print(f"  Accuracy: {budget_metrics['accuracy']:.2%}")
    print(f"  ROC-AUC: {budget_metrics['roc_auc']:.2%}")
    print(f"  Train samples: {budget_metrics['train_size']}")
    print(f"  Test samples: {budget_metrics['test_size']}")
    
    if budget_metrics['feature_importance']:
        top_features = sorted(
            budget_metrics['feature_importance'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:3]
        print("  Top features:")
        for feat, imp in top_features:
            print(f"    - {feat}: {imp:.3f}")
    
    # Data summary
    print("\n✓ DATA SUMMARY")
    summary = report['data_summary']
    print(f"  Total projects: {summary['total_projects']}")
    print(f"  Overdue projects: {summary['overdue_projects']}")
    print(f"  Budget overruns: {summary['budget_overruns']}")
    print(f"  Avg budget variance: {summary['avg_budget_variance']:.1f}%")
    
    return pipeline, report


def test_predictions(pipeline: MLPipeline, df_clean: pd.DataFrame):
    """Test individual predictions"""
    print("\n" + "="*60)
    print("TEST 3: PREDICTIONS")
    print("="*60)
    
    from ml_models.data_preparation import (
        get_ml_features_for_delay_prediction,
        get_ml_features_for_budget_prediction
    )
    
    # Delay predictions
    print("\n✓ DELAY PREDICTIONS (sample of 5 projects)")
    feature_cols = get_ml_features_for_delay_prediction()
    feature_cols = [col for col in feature_cols if col in df_clean.columns]
    
    for idx, row in df_clean.head(5).iterrows():
        X = row[feature_cols].values
        pred = pipeline.delay_model.predict(X)
        status = "🔴 LATE" if pred['will_be_late'] else "🟢 OK"
        print(f"  {status} | {row['name'][:30]:30s} | Prob: {pred['probability']:.1%} | Conf: {pred['confidence']:.1%}")
    
    # Budget predictions
    print("\n✓ BUDGET PREDICTIONS (sample of 5 projects)")
    feature_cols = get_ml_features_for_budget_prediction()
    feature_cols = [col for col in feature_cols if col in df_clean.columns]
    
    for idx, row in df_clean.head(5).iterrows():
        X = row[feature_cols].values
        pred = pipeline.budget_model.predict(X)
        status = "🔴 OVERRUN" if pred['will_overrun'] else "🟢 OK"
        print(f"  {status} | {row['name'][:30]:30s} | Prob: {pred['probability']:.1%} | Conf: {pred['confidence']:.1%}")


def test_limitations():
    """Display model limitations"""
    print("\n" + "="*60)
    print("TEST 4: MODEL LIMITATIONS (Academic)")
    print("="*60)
    
    pipeline = MLPipeline()
    limitations = pipeline.get_model_limitations()
    
    for limitation in limitations:
        print(f"\n⚠️ {limitation['category']}")
        print(f"  Issue: {limitation['issue']}")
        print(f"  Impact: {limitation['impact']}")
        print(f"  Mitigation: {limitation['mitigation']}")


def main():
    """Run all tests"""
    print("\n")
    print("█" * 60)
    print("  ML PIPELINE TEST SUITE")
    print("█" * 60)
    
    # Test 1
    df_clean = test_data_preparation()
    
    # Test 2
    pipeline, report = test_model_training(df_clean)
    
    # Test 3
    test_predictions(pipeline, df_clean)
    
    # Test 4
    test_limitations()
    
    # Final report
    print("\n" + "="*60)
    print("EVALUATION REPORT")
    print("="*60)
    report_text = evaluate_model_performance(report)
    print(report_text)
    
    print("\n✅ ALL TESTS PASSED")
    print("█" * 60 + "\n")


if __name__ == '__main__':
    main()
