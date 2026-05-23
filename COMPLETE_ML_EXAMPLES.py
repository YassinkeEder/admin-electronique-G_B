"""
Complete Example: End-to-End ML Pipeline Usage
Demonstrates the full workflow from data to predictions
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from bi.ml_models.training import MLPipeline, evaluate_model_performance
from bi.ml_models.data_preparation import (
    prepare_project_features,
    validate_features,
    get_ml_features_for_delay_prediction,
    get_ml_features_for_budget_prediction,
)


def example_1_basic_training():
    """
    Example 1: Basic Model Training
    Train models on all available projects
    """
    
    print("\n" + "="*70)
    print("EXAMPLE 1: BASIC MODEL TRAINING")
    print("="*70)
    
    print("""
    This example shows how to:
    1. Load projects from database
    2. Train delay prediction model
    3. Train budget forecasting model
    4. View performance metrics
    """)
    
    # In real scenario:
    # from bi.data.connection import get_projects
    # projects = get_projects()
    
    # For demo, we use synthetic data
    projects = _create_sample_projects(30)
    
    print(f"\n✓ Loaded {len(projects)} projects")
    print(f"  Regions: {projects['region'].nunique()}")
    print(f"  Sectors: {projects['sector'].nunique()}")
    
    # Create pipeline
    pipeline = MLPipeline()
    print("\n✓ Pipeline initialized")
    
    # Train models
    print("\n⏳ Training models...")
    report = pipeline.train_from_projects(projects, save_models=False)
    
    # Display results
    print("\n✓ TRAINING COMPLETE")
    print("\nDelay Prediction Model:")
    print(f"  Accuracy: {report['delay_model']['metrics']['accuracy']:.1%}")
    print(f"  ROC-AUC: {report['delay_model']['metrics']['roc_auc']:.1%}")
    
    print("\nBudget Forecasting Model:")
    print(f"  Accuracy: {report['budget_model']['metrics']['accuracy']:.1%}")
    print(f"  ROC-AUC: {report['budget_model']['metrics']['roc_auc']:.1%}")
    
    return pipeline, projects


def example_2_single_predictions():
    """
    Example 2: Making Individual Predictions
    Predict for specific projects
    """
    
    print("\n" + "="*70)
    print("EXAMPLE 2: MAKING INDIVIDUAL PREDICTIONS")
    print("="*70)
    
    print("""
    This example shows how to:
    1. Prepare features for a project
    2. Get delay prediction
    3. Get budget prediction
    4. Interpret confidence scores
    """)
    
    # Get trained pipeline
    projects = _create_sample_projects(30)
    pipeline = MLPipeline()
    pipeline.train_from_projects(projects, save_models=False)
    
    # Prepare data
    df_features = prepare_project_features(projects)
    df_clean, _ = validate_features(df_features)
    
    print(f"\n✓ Prepared features for {len(df_clean)} projects")
    
    # Make predictions for first project
    project = df_clean.iloc[0]
    print(f"\n📋 Project: {project['name']}")
    print(f"   Region: {project['region']}, Sector: {project['sector']}")
    print(f"   Progress: {project['progress']:.0f}%, Budget Variance: {project['budget_variance_current']:.1f}%")
    
    # Delay prediction
    delay_features = get_ml_features_for_delay_prediction()
    delay_features = [f for f in delay_features if f in df_clean.columns]
    X_delay = project[delay_features].values
    
    delay_pred = pipeline.delay_model.predict(X_delay)
    
    print("\n⏰ DELAY PREDICTION")
    print(f"  Will be late: {delay_pred['will_be_late']}")
    print(f"  Probability: {delay_pred['probability']:.1%}")
    print(f"  Confidence: {delay_pred['confidence']:.1%}")
    print(f"  → Interpretation: {_interpret_delay_prediction(delay_pred)}")
    
    # Budget prediction
    budget_features = get_ml_features_for_budget_prediction()
    budget_features = [f for f in budget_features if f in df_clean.columns]
    X_budget = project[budget_features].values
    
    budget_pred = pipeline.budget_model.predict(X_budget)
    
    print("\n💰 BUDGET PREDICTION")
    print(f"  Will overrun: {budget_pred['will_overrun']}")
    print(f"  Probability: {budget_pred['probability']:.1%}")
    print(f"  Confidence: {budget_pred['confidence']:.1%}")
    print(f"  → Interpretation: {_interpret_budget_prediction(budget_pred)}")
    
    # Risk level
    risk_level = _calculate_risk_level(delay_pred, budget_pred)
    print(f"\n🎯 OVERALL RISK LEVEL: {risk_level}")


def example_3_batch_predictions():
    """
    Example 3: Batch Predictions
    Predict for multiple projects and rank by risk
    """
    
    print("\n" + "="*70)
    print("EXAMPLE 3: BATCH PREDICTIONS & RISK RANKING")
    print("="*70)
    
    print("""
    This example shows how to:
    1. Make predictions for all projects
    2. Rank by delay risk
    3. Rank by budget risk
    4. Identify high-risk projects
    """)
    
    # Setup
    projects = _create_sample_projects(50)
    pipeline = MLPipeline()
    pipeline.train_from_projects(projects, save_models=False)
    
    df_features = prepare_project_features(projects)
    df_clean, _ = validate_features(df_features)
    
    # Make all predictions
    results = []
    
    delay_features = get_ml_features_for_delay_prediction()
    delay_features = [f for f in delay_features if f in df_clean.columns]
    
    budget_features = get_ml_features_for_budget_prediction()
    budget_features = [f for f in budget_features if f in df_clean.columns]
    
    for idx, row in df_clean.iterrows():
        delay_pred = pipeline.delay_model.predict(row[delay_features].values)
        budget_pred = pipeline.budget_model.predict(row[budget_features].values)
        
        results.append({
            'project': row['name'][:30],
            'region': row['region'],
            'delay_prob': delay_pred['probability'],
            'budget_prob': budget_pred['probability'],
            'risk_level': _calculate_risk_level(delay_pred, budget_pred),
        })
    
    df_results = pd.DataFrame(results)
    
    print(f"\n✓ Made predictions for {len(df_results)} projects")
    
    # Top projects by delay risk
    print("\n🔴 TOP 5 PROJECTS BY DELAY RISK:")
    print("-" * 70)
    top_delay = df_results.nlargest(5, 'delay_prob')
    for idx, row in top_delay.iterrows():
        print(f"  {idx+1}. {row['project']:30s} | Delay: {row['delay_prob']:.1%} | Region: {row['region']}")
    
    # Top projects by budget risk
    print("\n💰 TOP 5 PROJECTS BY BUDGET RISK:")
    print("-" * 70)
    top_budget = df_results.nlargest(5, 'budget_prob')
    for idx, row in top_budget.iterrows():
        print(f"  {idx+1}. {row['project']:30s} | Budget: {row['budget_prob']:.1%} | Region: {row['region']}")
    
    # Risk distribution
    print("\n📊 RISK DISTRIBUTION:")
    print("-" * 70)
    high_risk = len(df_results[df_results['delay_prob'] > 0.7])
    medium_risk = len(df_results[(df_results['delay_prob'] > 0.3) & (df_results['delay_prob'] <= 0.7)])
    low_risk = len(df_results[df_results['delay_prob'] <= 0.3])
    
    print(f"  🔴 High delay risk (>70%):    {high_risk} projects")
    print(f"  🟡 Medium delay risk (30-70%): {medium_risk} projects")
    print(f"  🟢 Low delay risk (<30%):      {low_risk} projects")


def example_4_feature_importance():
    """
    Example 4: Understanding Feature Importance
    Which factors matter most for predictions?
    """
    
    print("\n" + "="*70)
    print("EXAMPLE 4: FEATURE IMPORTANCE ANALYSIS")
    print("="*70)
    
    print("""
    This example shows how to:
    1. Get feature importance rankings
    2. Understand which factors drive predictions
    3. Validate model decisions
    4. Identify useful project metrics
    """)
    
    # Setup
    projects = _create_sample_projects(50)
    pipeline = MLPipeline()
    report = pipeline.train_from_projects(projects, save_models=False)
    
    # Delay model features
    print("\n⏰ DELAY PREDICTION - MOST IMPORTANT FEATURES:")
    print("-" * 70)
    
    delay_importance = report['delay_model']['metrics']['feature_importance']
    if delay_importance:
        sorted_features = sorted(delay_importance.items(), key=lambda x: x[1], reverse=True)
        for rank, (feature, importance) in enumerate(sorted_features[:5], 1):
            bar = "█" * int(importance * 50)
            print(f"  {rank}. {feature:30s} {bar} {importance:.3f}")
    
    # Budget model features
    print("\n💰 BUDGET PREDICTION - MOST IMPORTANT FEATURES:")
    print("-" * 70)
    
    budget_importance = report['budget_model']['metrics']['feature_importance']
    if budget_importance:
        sorted_features = sorted(budget_importance.items(), key=lambda x: x[1], reverse=True)
        for rank, (feature, importance) in enumerate(sorted_features[:5], 1):
            bar = "█" * int(importance * 50)
            print(f"  {rank}. {feature:30s} {bar} {importance:.3f}")
    
    # Interpretation
    print("\n💡 INTERPRETATION:")
    print("""
    The most important features show which project metrics matter most:
    
    Delay Model:
    - days_elapsed: How long has project been running?
    - progress_gap: Are we ahead/behind schedule?
    - budget_variance: Is spending aligned with budget?
    
    Budget Model:
    - spending_rate: How fast are we burning budget?
    - budget_variance: How far off budget are we?
    - progress: Are we spending according to progress?
    
    ✓ These features are interpretable (not black box!)
    ✓ Can guide project managers on what to monitor
    """)


def example_5_limitations():
    """
    Example 5: Understanding Model Limitations
    What can and cannot be predicted?
    """
    
    print("\n" + "="*70)
    print("EXAMPLE 5: MODEL LIMITATIONS & SAFEGUARDS")
    print("="*70)
    
    print("""
    This example shows:
    1. Academic limitations of the model
    2. When predictions are unreliable
    3. Mitigation strategies
    4. How to use model responsibly
    """)
    
    pipeline = MLPipeline()
    
    limitations = pipeline.get_model_limitations()
    
    for idx, limitation in enumerate(limitations, 1):
        print(f"\n⚠️ LIMITATION #{idx}: {limitation['category']}")
        print(f"   Problem: {limitation['issue']}")
        print(f"   Impact: {limitation['impact']}")
        print(f"   Fix: {limitation['mitigation']}")
    
    recommendations = pipeline.get_deployment_recommendations()
    
    print("\n\n🛡️ DEPLOYMENT SAFEGUARDS:")
    print("-" * 70)
    
    for category, items in recommendations.items():
        print(f"\n{category.upper()}:")
        for item in items:
            print(f"  ✓ {item}")


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _create_sample_projects(n: int) -> pd.DataFrame:
    """Create realistic sample projects for examples"""
    
    np.random.seed(42)
    
    regions = ['Bissau', 'Gabu', 'Bafata', 'Cacheu']
    sectors = ['Santé', 'Éducation', 'Infrastructure', 'Agriculture']
    
    projects = []
    for i in range(n):
        start = datetime.now() - timedelta(days=np.random.randint(30, 300))
        planned_end = start + timedelta(days=np.random.randint(60, 300))
        
        budget_xof = np.random.uniform(10_000_000, 200_000_000)
        spent_xof = budget_xof * np.random.uniform(0.3, 1.1)
        progress = np.random.uniform(10, 100)
        
        projects.append({
            'id': f'PRJ-{i+1:03d}',
            'name': f"Projet {i+1} - {np.random.choice(sectors)}",
            'region': np.random.choice(regions),
            'sector': np.random.choice(sectors),
            'status': 'IN_PROGRESS',
            'start_date': start,
            'end_date': planned_end,
            'budget_xof': budget_xof,
            'spent_xof': spent_xof,
            'progress': progress,
            'beneficiaries': np.random.randint(100, 50000),
            'created_at': start,
        })
    
    return pd.DataFrame(projects)


def _interpret_delay_prediction(pred: dict) -> str:
    """Interpret delay prediction for user"""
    
    prob = pred['probability']
    conf = pred['confidence']
    
    if prob > 0.7:
        if conf > 0.9:
            return "🔴 HIGH RISK: Project very likely to be late"
        else:
            return "🔴 MEDIUM-HIGH RISK: Project likely to be late (but model uncertain)"
    elif prob > 0.3:
        return "🟡 MEDIUM RISK: Project may be late (uncertain)"
    else:
        if conf > 0.9:
            return "🟢 LOW RISK: Project likely on time"
        else:
            return "🟡 LOW RISK: Project likely on time (but model uncertain)"


def _interpret_budget_prediction(pred: dict) -> str:
    """Interpret budget prediction for user"""
    
    prob = pred['probability']
    conf = pred['confidence']
    
    if prob > 0.7:
        if conf > 0.9:
            return "🔴 HIGH RISK: Budget overrun very likely"
        else:
            return "🔴 MEDIUM-HIGH RISK: Budget overrun likely (uncertain)"
    elif prob > 0.3:
        return "🟡 MEDIUM RISK: Budget may overrun"
    else:
        if conf > 0.9:
            return "🟢 LOW RISK: Budget likely OK"
        else:
            return "🟡 LOW RISK: Budget likely OK (uncertain)"


def _calculate_risk_level(delay_pred: dict, budget_pred: dict) -> str:
    """Calculate overall risk level"""
    
    delay_prob = delay_pred['probability']
    budget_prob = budget_pred['probability']
    
    avg_risk = (delay_prob + budget_prob) / 2
    
    if avg_risk > 0.7:
        return "🔴 CRITICAL"
    elif avg_risk > 0.5:
        return "🟠 HIGH"
    elif avg_risk > 0.3:
        return "🟡 MEDIUM"
    else:
        return "🟢 LOW"


# ============================================================================
# MAIN
# ============================================================================

def main():
    """Run all examples"""
    
    print("\n" + "█" * 70)
    print("  COMPLETE ML PIPELINE USAGE EXAMPLES")
    print("  E-GovProjetGB Decision Support System")
    print("█" * 70)
    
    # Example 1
    example_1_basic_training()
    
    # Example 2
    example_2_single_predictions()
    
    # Example 3
    example_3_batch_predictions()
    
    # Example 4
    example_4_feature_importance()
    
    # Example 5
    example_5_limitations()
    
    print("\n" + "█" * 70)
    print("  ✅ ALL EXAMPLES COMPLETED")
    print("█" * 70 + "\n")
    
    print("""
    NEXT STEPS:
    
    1. View Streamlit Dashboard:
       $ streamlit run bi/app.py
       → Click "🤖 Prédictions ML" tab
    
    2. Train with Real Data:
       → Update example code to use get_projects() from bi/data/connection
       → Run training pipeline with actual project data
    
    3. Deploy to Production:
       → Save trained models to disk
       → Set up monthly retraining schedule
       → Monitor model performance
    
    4. Academic Integration:
       → Reference ML_PIPELINE.md in thesis
       → Include feature importance analysis
       → Document model limitations
    """)


if __name__ == '__main__':
    main()
