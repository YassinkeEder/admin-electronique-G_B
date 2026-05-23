"""
E-GovProjetGB - Streamlit BI application.
Main entry point for the decision-support module.
"""

from pathlib import Path
import sys

import streamlit as st

# Add the current directory to the import path.
sys.path.insert(0, str(Path(__file__).parent))

from config import (
    init_streamlit,
    REGIONS,
    SECTORS,
    PROJECT_STATUSES,
    COLOR_PALETTE,
    get_status_color,
    get_region_color,
)
from dashboards.ml_predictions import show_ml_predictions
from dashboards.overview import show_overview
from dashboards.reporting_export import show_reporting_export
from data.connection import get_projects, get_stats_by_region


# ============================================================================
# PAGE CONFIG
# ============================================================================

init_streamlit()


# CSS Custom
st.markdown(
    """
    <style>
    .metric-card {
        background-color: #f0f2f6;
        padding: 20px;
        border-radius: 10px;
        border-left: 5px solid #0066cc;
    }
    .success { color: #10b981; }
    .warning { color: #f59e0b; }
    .danger { color: #ef4444; }
    </style>
    """,
    unsafe_allow_html=True,
)


# ============================================================================
# SIDEBAR - FILTERS
# ============================================================================

_ = COLOR_PALETTE

st.sidebar.title("🎯 Filtres")
st.sidebar.markdown("---")

selected_regions = st.sidebar.multiselect(
    "Régions",
    options=REGIONS,
    default=None,
    help="Sélectionner une ou plusieurs régions de Guinée-Bissau",
)

selected_sectors = st.sidebar.multiselect(
    "Secteurs",
    options=SECTORS,
    default=None,
    help="Sélectionner un ou plusieurs secteurs",
)

selected_statuses = st.sidebar.multiselect(
    "Statuts",
    options=PROJECT_STATUSES,
    default=None,
    help="Sélectionner un ou plusieurs statuts",
)

st.sidebar.markdown("### 📅 Période")
date_range = st.sidebar.date_input(
    "Sélectionner plage de dates",
    value=(None, None),
    help="Période de début à fin",
)

st.sidebar.markdown("---")

try:
    projects = get_projects()
    st.sidebar.success(f"✅ Connecté - {len(projects)} projets")
except Exception as exc:
    st.sidebar.error(f"❌ Erreur: {str(exc)}")

st.sidebar.markdown("---")
st.sidebar.info(
    "💡 **Guide**: Utilisez les filtres pour affiner votre analyse. "
    "Les données se mettent à jour toutes les 60 minutes."
)


# ============================================================================
# NAVIGATION
# ============================================================================

st.sidebar.markdown("### 📑 Navigation")

page = st.sidebar.radio(
    "Sélectionner page",
    options=[
        "📊 Dashboard Global",
        "🗺️ Analyse Régionale",
        "🏭 Analyse Secteurs",
        "💰 Budget Tracking",
        "📈 Timeline & Gantt",
        "🤖 Prédictions ML",
        "📑 Reporting & Export",
        "🧾 Données Brutes",
    ],
    label_visibility="collapsed",
)


# ============================================================================
# MAIN PAGE
# ============================================================================

if page == "📊 Dashboard Global":
    show_overview()

elif page == "🗺️ Analyse Régionale":
    st.title("🗺️ Analyse Régionale")
    st.markdown("Comparaison des 9 régions de Guinée-Bissau")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Projets par Région")
        stats = get_stats_by_region()
        if not stats.empty:
            import plotly.express as px

            fig = px.bar(
                stats.sort_values("project_count", ascending=False),
                x="region",
                y="project_count",
                color="region",
                color_discrete_map={region: get_region_color(region) for region in stats["region"]},
                labels={"project_count": "Nombre", "region": "Région"},
            )
            st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.subheader("Statistiques Régionales")
        if not stats.empty:
            st.dataframe(stats, hide_index=True, use_container_width=True)

elif page == "🏭 Analyse Secteurs":
    st.title("🏭 Analyse Secteurs")
    st.markdown("Performance par secteur d'activité")

    from data.connection import get_stats_by_sector

    sector_stats = get_stats_by_sector()

    if not sector_stats.empty:
        import plotly.express as px

        col1, col2 = st.columns(2)

        with col1:
            fig = px.bar(
                sector_stats.sort_values("total_budget", ascending=False),
                x="sector",
                y="project_count",
                color="sector",
                labels={"project_count": "Nombre", "sector": "Secteur"},
            )
            fig.update_layout(xaxis_tickangle=-45)
            st.plotly_chart(fig, use_container_width=True)

        with col2:
            st.dataframe(sector_stats, hide_index=True, use_container_width=True)

elif page == "💰 Budget Tracking":
    st.title("💰 Budget Tracking")
    st.markdown("Suivi détaillé des budgets et dépenses")

    projects = get_projects()
    if not projects.empty:
        from utils.formatting import add_budget_status_column, format_xof

        projects = add_budget_status_column(projects)

        col1, col2 = st.columns(2)

        with col1:
            st.subheader("Résumé Budget")
            st.metric("Budget Total", format_xof(projects["budget_xof"].sum()))
            st.metric("Dépensé", format_xof(projects["spent_xof"].sum()))
            st.metric("Restant", format_xof((projects["budget_xof"] - projects["spent_xof"]).sum()))

        with col2:
            st.subheader("Projets par Budget Status")
            import plotly.express as px

            status_count = projects["budget_status"].value_counts()
            fig = px.pie(
                values=status_count.values,
                names=status_count.index,
                hole=0.4,
            )
            st.plotly_chart(fig, use_container_width=True)

        st.subheader("Détail Projets")
        display_cols = ["name", "region", "sector", "budget_xof", "spent_xof", "progress", "budget_status"]
        st.dataframe(
            projects[display_cols].rename(
                columns={
                    "name": "Projet",
                    "region": "Région",
                    "sector": "Secteur",
                    "budget_xof": "Budget",
                    "spent_xof": "Dépensé",
                    "progress": "Avancement (%)",
                    "budget_status": "Status",
                }
            ),
            hide_index=True,
            use_container_width=True,
        )

elif page == "📈 Timeline & Gantt":
    st.title("📈 Timeline & Gantt Chart")
    st.markdown("Calendrier et chronologie des projets")

    projects = get_projects()
    if not projects.empty:
        from utils.formatting import add_delay_status_column

        projects = add_delay_status_column(projects)

        st.subheader("Timeline des Projets")
        import plotly.express as px

        projects_sorted = projects.sort_values("start_date")

        fig = px.timeline(
            projects_sorted[projects_sorted["start_date"].notna()],
            x_start="start_date",
            x_end="end_date",
            y="name",
            color="status",
            color_discrete_map={status: get_status_color(status) for status in projects["status"].unique()},
            hover_name="name",
            hover_data=["region", "sector", "progress"],
            title="Gantt Chart - Projets",
        )
        fig.update_layout(height=600)
        st.plotly_chart(fig, use_container_width=True)

        st.subheader("Projets par Statut Retard")
        delay_summary = projects["delay_status"].value_counts()
        if not delay_summary.empty:
            fig = px.bar(
                x=delay_summary.index,
                y=delay_summary.values,
                labels={"x": "Statut", "y": "Nombre"},
            )
            st.plotly_chart(fig, use_container_width=True)

elif page == "🤖 Prédictions ML":
    show_ml_predictions()

elif page == "📑 Reporting & Export":
    show_reporting_export()

elif page == "🧾 Données Brutes":
    st.title("🧾 Données Brutes")
    st.markdown("Export et exploration détaillée")

    projects = get_projects()

    col1, col2 = st.columns(2)
    with col1:
        st.metric("Total Projets", len(projects))
    with col2:
        st.metric("Projets Actifs", len(projects[~projects["status"].isin(["COMPLETED", "CANCELLED"])]))

    st.subheader("Export Données")

    if st.button("📥 Télécharger CSV"):
        csv = projects.to_csv(index=False)
        st.download_button(
            label="Télécharger",
            data=csv,
            file_name="egov_projets_export.csv",
            mime="text/csv",
        )

    st.subheader("Tableau Complet")
    st.dataframe(projects, use_container_width=True, height=600)


# ============================================================================
# FOOTER
# ============================================================================

st.markdown("---")
st.markdown(
    """
    <div style='text-align: center; color: #999; font-size: 12px;'>
        E-GovProjetGB v1.0 • Module BI • Guinée-Bissau • Master 2026
    </div>
    """,
    unsafe_allow_html=True,
)
