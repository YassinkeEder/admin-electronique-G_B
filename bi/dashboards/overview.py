"""
Dashboard Overview - Vue générale KPI
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta

from data.connection import (
    get_projects, get_stats_by_region, get_stats_by_sector, get_stats_by_status
)
from kpis.core import (
    calculate_budget_variance, calculate_completion_rate,
    calculate_delay_index, calculate_efficiency_score,
    calculate_roi, calculate_cost_per_beneficiary,
    calculate_average_progress, get_projects_by_timeline
)
from utils.formatting import (
    format_xof, format_percentage, format_number, get_status_badge
)
from config import (
    STATUS_COLORS, REGION_COLORS, SECTOR_EMOJIS, COLOR_PALETTE
)

def show_overview():
    """Afficher dashboard overview"""
    
    st.title("📊 Dashboard Global")
    st.markdown("Vue d'ensemble des KPI et métriques clé")
    
    # Récupérer données
    projects = get_projects()
    
    if projects.empty:
        st.warning("⚠️ Aucun projet disponible")
        return
    
    # ========================================================================
    # ROW 1: KPI METRICS
    # ========================================================================
    
    col1, col2, col3, col4 = st.columns(4)
    
    # Budget Variance
    with col1:
        budget_var = calculate_budget_variance(projects)
        color = '🟢' if budget_var['status'] == 'success' else ('🟡' if budget_var['status'] == 'warning' else '🔴')
        st.metric(
            "Écart Budgétaire",
            f"{color} {format_percentage(budget_var['variance'])}",
            f"Dépensé: {format_xof(budget_var['total_spent'])}"
        )
    
    # Completion Rate
    with col2:
        comp_rate = calculate_completion_rate(projects)
        st.metric(
            "Taux de Complétion",
            format_percentage(comp_rate),
            f"{len(projects[projects['status'] == 'COMPLETED'])} projets terminés"
        )
    
    # Overdue Projects
    with col3:
        delay = calculate_delay_index(projects)
        st.metric(
            "Projets en Retard",
            f"⚠️ {delay['overdue_count']}",
            f"Moyenne: {format_percentage(delay['avg_days_overdue'])} jours"
        )
    
    # Efficiency Score
    with col4:
        efficiency = calculate_efficiency_score(projects)
        color = '🟢' if efficiency > 70 else ('🟡' if efficiency > 50 else '🔴')
        st.metric(
            "Score d'Efficacité",
            f"{color} {format_percentage(efficiency)}",
            "Métrique globale"
        )
    
    # ========================================================================
    # ROW 2: STATUS DISTRIBUTION
    # ========================================================================
    
    st.divider()
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Distribution par Statut")
        status_stats = get_stats_by_status()
        
        if not status_stats.empty:
            fig = px.pie(
                status_stats,
                values='project_count',
                names='status',
                color='status',
                color_discrete_map=STATUS_COLORS,
                hole=0.4
            )
            fig.update_traces(textposition='inside', textinfo='label+percent')
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Aucune donnée")
    
    with col2:
        st.subheader("Budget par Statut")
        
        if not status_stats.empty:
            fig = px.bar(
                status_stats,
                x='status',
                y='total_budget',
                color='status',
                color_discrete_map=STATUS_COLORS,
                labels={'total_budget': 'Budget (XOF)', 'status': 'Statut'}
            )
            fig.update_yaxes(tickformat="$,.0f")
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Aucune donnée")
    
    # ========================================================================
    # ROW 3: REGIONAL ANALYSIS
    # ========================================================================
    
    st.divider()
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Projets par Région")
        region_stats = get_stats_by_region()
        
        if not region_stats.empty:
            fig = px.bar(
                region_stats,
                x='region',
                y='project_count',
                color='region',
                color_discrete_map=REGION_COLORS,
                labels={'project_count': 'Nombre de projets', 'region': 'Région'}
            )
            fig.update_layout(xaxis_tickangle=-45)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Aucune donnée")
    
    with col2:
        st.subheader("Budget par Région")
        
        if not region_stats.empty:
            fig = px.bar(
                region_stats,
                x='region',
                y='total_budget',
                color='region',
                color_discrete_map=REGION_COLORS,
                labels={'total_budget': 'Budget total (XOF)', 'region': 'Région'}
            )
            fig.update_yaxes(tickformat="$,.0f")
            fig.update_layout(xaxis_tickangle=-45)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Aucune donnée")
    
    # ========================================================================
    # ROW 4: TIMELINE ANALYSIS
    # ========================================================================
    
    st.divider()
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Classification Timeline")
        timeline = get_projects_by_timeline(projects)
        
        timeline_df = pd.DataFrame([
            {'Label': '🚨 Urgent (<30j)', 'Projets': timeline['urgent']},
            {'Label': '🟡 Bientôt (30-90j)', 'Projets': timeline['soon']},
            {'Label': '🟢 Normal (90-180j)', 'Projets': timeline['normal']},
            {'Label': '📅 Long terme (>180j)', 'Projets': timeline['long_term']},
        ])
        
        fig = px.bar(
            timeline_df,
            x='Label',
            y='Projets',
            color='Label',
            color_discrete_sequence=['#ef4444', '#f59e0b', '#10b981', '#3b82f6']
        )
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        st.subheader("Avancement Moyen par Secteur")
        sector_stats = get_stats_by_sector()
        
        if not sector_stats.empty:
            sector_stats['avg_progress'] = sector_stats['avg_progress'].fillna(0)
            fig = px.bar(
                sector_stats,
                x='sector',
                y='avg_progress',
                color='sector',
                labels={'avg_progress': 'Avancement (%)', 'sector': 'Secteur'},
                range_y=[0, 100]
            )
            fig.update_layout(xaxis_tickangle=-45)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Aucune donnée")
    
    # ========================================================================
    # ROW 5: ADVANCED KPI
    # ========================================================================
    
    st.divider()
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.subheader("ROI Global")
        roi_data = calculate_roi(projects)
        color = '🟢' if roi_data['status'] == 'success' else ('🟡' if roi_data['status'] == 'warning' else '🔴')
        st.metric("ROI Score", f"{color} {format_percentage(roi_data['roi'])}")
        
        if roi_data['by_sector']:
            with st.expander("Par secteur"):
                for sector, roi_val in sorted(roi_data['by_sector'].items(), key=lambda x: x[1], reverse=True):
                    st.write(f"{sector}: {format_percentage(roi_val * 100)}")
    
    with col2:
        st.subheader("Coût par Bénéficiaire")
        cpb_data = calculate_cost_per_beneficiary(projects)
        st.metric(
            "Coût unitaire",
            format_xof(cpb_data['cost_per_beneficiary']),
            "Par bénéficiaire"
        )
        
        if cpb_data['by_sector']:
            with st.expander("Par secteur"):
                for sector, cost in sorted(cpb_data['by_sector'].items(), key=lambda x: x[1]):
                    st.write(f"{sector}: {format_xof(cost)}")
    
    with col3:
        st.subheader("Statistiques Globales")
        st.write(f"**Projets actifs:** {len(projects[~projects['status'].isin(['COMPLETED', 'CANCELLED'])])}")
        st.write(f"**Budget total:** {format_xof(projects['budget_xof'].sum())}")
        st.write(f"**Dépenses totales:** {format_xof(projects['spent_xof'].sum())}")
        st.write(f"**Bénéficiaires:** {format_number(projects['beneficiaries'].sum())}")
    
    # ========================================================================
    # ROW 6: TOP/BOTTOM PROJECTS
    # ========================================================================
    
    st.divider()
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("🏆 Top 5 Projets par Budget")
        top_projects = projects.nlargest(5, 'budget_xof')[['name', 'region', 'budget_xof', 'status']]
        top_projects['status'] = top_projects['status'].apply(get_status_badge)
        st.dataframe(
            top_projects.rename(columns={
                'name': 'Projet',
                'region': 'Région',
                'budget_xof': 'Budget',
                'status': 'Statut'
            }),
            hide_index=True
        )
    
    with col2:
        st.subheader("⚠️ Projets les plus loin du budget")
        projects['budget_variance'] = ((projects['spent_xof'] - projects['budget_xof']) / projects['budget_xof'] * 100).abs()
        overbudget = projects.nlargest(5, 'budget_variance')[['name', 'budget_xof', 'spent_xof', 'budget_variance']]
        overbudget['budget_variance'] = overbudget['budget_variance'].apply(lambda x: format_percentage(x))
        st.dataframe(
            overbudget.rename(columns={
                'name': 'Projet',
                'budget_xof': 'Budget',
                'spent_xof': 'Dépensé',
                'budget_variance': 'Écart'
            }),
            hide_index=True
        )
