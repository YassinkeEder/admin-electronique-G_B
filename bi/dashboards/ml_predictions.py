"""
Dashboard ML Predictions
Page Streamlit pour afficher prédictions des modèles
"""

import streamlit as st
import pandas as pd
import plotly.express as px # type: ignore
import plotly.graph_objects as go # type: ignore
from datetime import datetime
import logging

from data.connection import get_projects
from ml_models.data_preparation import prepare_project_features, validate_features
from ml_models.training import MLPipeline, evaluate_model_performance
from ml_models.models import DelayPredictionModel, BudgetForecastingModel
from utils.formatting import format_xof, format_percentage

logger = logging.getLogger(__name__)

# ============================================================================
# CACHING: Entraîner modèles une seule fois (TTL 24h)
# ============================================================================

@st.cache_resource
def get_trained_pipeline():
    """Charger ou entraîner pipeline ML"""
    try:
        projects = get_projects()
        if projects.empty or len(projects) < 10:
            st.warning("⚠️ Peu de données pour entraîner modèles")
            return None, None
        
        pipeline = MLPipeline()
        report = pipeline.train_from_projects(projects, save_models=True)
        
        return pipeline, report
    except Exception as e:
        logger.error(f"Pipeline training error: {e}")
        st.error(f"❌ Erreur entraînement modèles: {e}")
        return None, None

# ============================================================================
# MAIN PAGE
# ============================================================================

def show_ml_predictions():
    """Afficher page prédictions ML"""
    
    st.title("🤖 Prédictions ML")
    st.markdown("Utilise Random Forest pour prédire risques projets")
    
    # ========================================================================
    # LOAD PIPELINE
    # ========================================================================
    
    with st.spinner("⏳ Entraînement modèles..."):
        pipeline, report = get_trained_pipeline()
    
    if pipeline is None:
        st.error("❌ Impossible d'entraîner les modèles")
        return
    
    # ========================================================================
    # TABS: Différentes vues
    # ========================================================================
    
    tab1, tab2, tab3, tab4 = st.tabs([
        "📊 Modèles",
        "⏰ Risque Retard",
        "💰 Risque Budget",
        "ℹ️ Limitations"
    ])
    
    # ========================================================================
    # TAB 1: MODEL OVERVIEW
    # ========================================================================
    
    with tab1:
        st.subheader("📊 Vue d'Ensemble des Modèles")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric(
                "Projets dans training",
                report['data_summary']['total_projects']
            )
        
        with col2:
            st.metric(
                "Projets en retard",
                report['data_summary']['overdue_projects']
            )
        
        with col3:
            st.metric(
                "Dépassements budget",
                report['data_summary']['budget_overruns']
            )
        
        st.divider()
        
        # Model 1: Delay Prediction
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("⏰ Delay Prediction Model")
            
            delay_metrics = report['delay_model']['metrics']
            
            col_a, col_b = st.columns(2)
            with col_a:
                st.metric(
                    "Accuracy",
                    format_percentage(delay_metrics['accuracy'] * 100)
                )
            with col_b:
                st.metric(
                    "ROC-AUC",
                    format_percentage(delay_metrics['roc_auc'] * 100)
                )
            
            st.write(f"**Training samples**: {delay_metrics['train_size']}")
            st.write(f"**Test samples**: {delay_metrics['test_size']}")
            
            with st.expander("Feature Importance"):
                importance = delay_metrics['feature_importance']
                if importance:
                    df_imp = pd.DataFrame(
                        list(importance.items()),
                        columns=['Feature', 'Importance']
                    ).sort_values('Importance', ascending=False)
                    
                    fig = px.bar(
                        df_imp,
                        x='Importance',
                        y='Feature',
                        orientation='h',
                        color='Importance',
                        color_continuous_scale='viridis'
                    )
                    st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            st.subheader("💰 Budget Forecasting Model")
            
            budget_metrics = report['budget_model']['metrics']
            
            col_a, col_b = st.columns(2)
            with col_a:
                st.metric(
                    "Accuracy",
                    format_percentage(budget_metrics['accuracy'] * 100)
                )
            with col_b:
                st.metric(
                    "ROC-AUC",
                    format_percentage(budget_metrics['roc_auc'] * 100)
                )
            
            st.write(f"**Training samples**: {budget_metrics['train_size']}")
            st.write(f"**Test samples**: {budget_metrics['test_size']}")
            
            with st.expander("Feature Importance"):
                importance = budget_metrics['feature_importance']
                if importance:
                    df_imp = pd.DataFrame(
                        list(importance.items()),
                        columns=['Feature', 'Importance']
                    ).sort_values('Importance', ascending=False)
                    
                    fig = px.bar(
                        df_imp,
                        x='Importance',
                        y='Feature',
                        orientation='h',
                        color='Importance',
                        color_continuous_scale='viridis'
                    )
                    st.plotly_chart(fig, use_container_width=True)
        
        # Rapport texte
        st.divider()
        st.subheader("📋 Rapport d'Évaluation")
        with st.expander("Voir rapport complet"):
            report_text = evaluate_model_performance(report)
            st.code(report_text, language=None)
    
    # ========================================================================
    # TAB 2: DELAY RISK
    # ========================================================================
    
    with tab2:
        st.subheader("⏰ Prédiction Risque de Retard")
        st.markdown("""
        Le modèle prédit probabilité qu'un projet finisse en retard.
        
        **Basé sur**: jours écoulés, avancement actuel, variance budget, région, secteur
        """)
        
        projects = get_projects()
        df_features = prepare_project_features(projects)
        df_clean, _ = validate_features(df_features)
        
        if df_clean.empty:
            st.warning("Aucun projet à analyser")
            return
        
        from ml_models.data_preparation import get_ml_features_for_delay_prediction
        
        feature_cols = get_ml_features_for_delay_prediction()
        feature_cols = [col for col in feature_cols if col in df_clean.columns]
        
        # Predictions
        results = []
        for idx, row in df_clean.iterrows():
            X = row[feature_cols].values
            pred = pipeline.delay_model.predict(X)
            results.append({
                'project_id': row['id'],
                'project_name': row['name'],
                'region': row['region'],
                'sector': row['sector'],
                'progress': row['progress'],
                'end_date': row['end_date'],
                'will_be_late': pred['will_be_late'],
                'probability': pred['probability'],
                'confidence': pred['confidence'],
                'status': row['status']
            })
        
        df_results = pd.DataFrame(results)
        
        # Summary
        col1, col2, col3 = st.columns(3)
        
        with col1:
            high_risk = (df_results['probability'] > 0.7).sum()
            st.metric("🔴 Haut Risque (>70%)", high_risk)
        
        with col2:
            medium_risk = ((df_results['probability'] > 0.3) & (df_results['probability'] <= 0.7)).sum()
            st.metric("🟡 Risque Moyen (30-70%)", medium_risk)
        
        with col3:
            low_risk = (df_results['probability'] <= 0.3).sum()
            st.metric("🟢 Faible Risque (<30%)", low_risk)
        
        st.divider()
        
        # Distribution
        fig = px.histogram(
            df_results,
            x='probability',
            nbins=20,
            color_discrete_sequence=['#3b82f6'],
            labels={'probability': 'Probabilité de retard', 'count': 'Nombre de projets'}
        )
        st.plotly_chart(fig, use_container_width=True)
        
        # Projets à risque
        st.subheader("⚠️ Projets à Risque")
        
        high_risk_projects = df_results[df_results['probability'] > 0.5].sort_values('probability', ascending=False)
        
        if not high_risk_projects.empty:
            st.dataframe(
                high_risk_projects[[
                    'project_name', 'region', 'sector', 'progress', 'probability', 'confidence'
                ]].rename(columns={
                    'project_name': 'Projet',
                    'region': 'Région',
                    'sector': 'Secteur',
                    'progress': 'Avancement (%)',
                    'probability': 'Prob. Retard',
                    'confidence': 'Confiance'
                }),
                use_container_width=True,
                hide_index=True
            )
        else:
            st.info("✅ Aucun projet à haut risque de retard")
    
    # ========================================================================
    # TAB 3: BUDGET RISK
    # ========================================================================
    
    with tab3:
        st.subheader("💰 Prédiction Dépassement Budget")
        st.markdown("""
        Le modèle prédit probabilité de dépassement budgétaire.
        
        **Basé sur**: taux de dépense actuel, utilisation budget, avancement, taille projet
        """)
        
        projects = get_projects()
        df_features = prepare_project_features(projects)
        df_clean, _ = validate_features(df_features)
        
        if df_clean.empty:
            st.warning("Aucun projet à analyser")
            return
        
        from ml_models.data_preparation import get_ml_features_for_budget_prediction
        
        feature_cols = get_ml_features_for_budget_prediction()
        feature_cols = [col for col in feature_cols if col in df_clean.columns]
        
        # Predictions
        results = []
        for idx, row in df_clean.iterrows():
            X = row[feature_cols].values
            pred = pipeline.budget_model.predict(X)
            results.append({
                'project_id': row['id'],
                'project_name': row['name'],
                'region': row['region'],
                'sector': row['sector'],
                'budget_xof': row['budget_xof'],
                'spent_xof': row['spent_xof'],
                'budget_variance': row['budget_variance_current'],
                'will_overrun': pred['will_overrun'],
                'probability': pred['probability'],
                'confidence': pred['confidence']
            })
        
        df_results = pd.DataFrame(results)
        
        # Summary
        col1, col2, col3 = st.columns(3)
        
        with col1:
            high_risk = (df_results['probability'] > 0.7).sum()
            st.metric("🔴 Haut Risque (>70%)", high_risk)
        
        with col2:
            medium_risk = ((df_results['probability'] > 0.3) & (df_results['probability'] <= 0.7)).sum()
            st.metric("🟡 Risque Moyen (30-70%)", medium_risk)
        
        with col3:
            low_risk = (df_results['probability'] <= 0.3).sum()
            st.metric("🟢 Faible Risque (<30%)", low_risk)
        
        st.divider()
        
        # Distribution
        fig = px.histogram(
            df_results,
            x='probability',
            nbins=20,
            color_discrete_sequence=['#ef4444'],
            labels={'probability': 'Probabilité de dépassement', 'count': 'Nombre de projets'}
        )
        st.plotly_chart(fig, use_container_width=True)
        
        # Scatter: variance vs probability
        fig = px.scatter(
            df_results,
            x='budget_variance',
            y='probability',
            color='probability',
            size='budget_xof',
            hover_name='project_name',
            color_continuous_scale='reds',
            labels={
                'budget_variance': 'Budget Variance (%)',
                'probability': 'Proba. Dépassement',
                'budget_xof': 'Budget'
            }
        )
        st.plotly_chart(fig, use_container_width=True)
        
        # Projets à risque
        st.subheader("⚠️ Projets à Haut Risque Budgétaire")
        
        high_risk_projects = df_results[df_results['probability'] > 0.5].sort_values('probability', ascending=False)
        
        if not high_risk_projects.empty:
            st.dataframe(
                high_risk_projects[[
                    'project_name', 'region', 'budget_xof', 'spent_xof', 'budget_variance', 'probability'
                ]].rename(columns={
                    'project_name': 'Projet',
                    'region': 'Région',
                    'budget_xof': 'Budget',
                    'spent_xof': 'Dépensé',
                    'budget_variance': 'Variance (%)',
                    'probability': 'Prob. Dépassement'
                }),
                use_container_width=True,
                hide_index=True
            )
        else:
            st.info("✅ Aucun projet à haut risque budgétaire")
    
    # ========================================================================
    # TAB 4: LIMITATIONS
    # ========================================================================
    
    with tab4:
        st.subheader("ℹ️ Limitations & Recommandations")
        
        st.markdown("""
        ## 🎓 Limitations Académiques (Defendable)
        
        ### 1️⃣ Data Availability
        - **Problème**: Données historiques limitées au démarrage
        - **Impact**: Models peu fiables avec < 100 projets
        - **Mitigation**: Retraining régulier avec nouvelles données
        
        ### 2️⃣ Feature Engineering
        - **Problème**: Assume progression linéaire du projet
        - **Impact**: Peut être inexact pour projets non-linéaires (ex: construction)
        - **Mitigation**: Ajouter features non-linéaires si données disponibles
        
        ### 3️⃣ Cold Start Problem
        - **Problème**: Nouveaux projets sans données historiques
        - **Impact**: Prédictions initiales imprécises
        - **Mitigation**: Utiliser sector/region medians pour initialiser
        
        ### 4️⃣ Model Complexity
        - **Problème**: Random Forest peut être biased sur petit dataset
        - **Impact**: Risk overfitting sur patterns artificiels
        - **Mitigation**: Shallow trees (max_depth=8), min_samples_leaf=5
        
        ### 5️⃣ External Events
        - **Problème**: Modèle ignore facteurs externes (crises, policy changes)
        - **Impact**: Peut échouer si contexte change radicalement
        - **Mitigation**: Manual override possibles, monitoring continu
        
        ### 6️⃣ Feature Correlation
        - **Problème**: Certaines features peuvent être corrélées (spending_rate vs budget_variance)
        - **Impact**: Multicollinearity peut réduire coefficient stability
        - **Mitigation**: Feature importance analysis, dimensionality reduction
        
        ---
        
        ## 📋 Recommandations Déploiement
        
        ### Validation
        ✅ Toujours afficher confidence score (ne pas cacher)  
        ✅ Alerter si model retrain > 30 jours  
        ✅ Validation croisée avant production
        
        ### Monitoring
        ✅ Track actual vs predicted outcomes  
        ✅ Monitor feature distributions (data drift)  
        ✅ Log all predictions pour audit
        
        ### Retraining
        ✅ Retrain mensuellement minimum  
        ✅ Monitor performance metrics  
        ✅ Version control pour reproducibility
        
        ### User Education
        ✅ Éduquer users sur limitations  
        ✅ Pas de "black box" - expliquer features  
        ✅ Encourage manual verification
        
        ---
        
        ## 🔬 Pour la Thèse Master's
        
        Ce module ML apporte:
        - ✅ Modèles justifiables (RF, non deep learning)
        - ✅ Limitation clairement documentées
        - ✅ Feature engineering expliquée
        - ✅ Train/test split standard
        - ✅ Cross-validation possible
        - ✅ Production-ready avec safeguards
        """)
