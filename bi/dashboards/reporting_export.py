"""
Dashboard Reporting & Export Avancé
Exports CSV/Excel/PDF et Audit
"""

import streamlit as st
import pandas as pd
from datetime import datetime, timedelta
import logging

from data.connection import get_projects, get_audit_logs
from kpis.core import (
    calculate_budget_variance,
    calculate_delay_index,
    calculate_completion_rate,
    calculate_roi,
    calculate_cost_per_beneficiary,
    calculate_efficiency_score,
)
from utils.exporters import CSVExporter, ExcelExporter, PDFExporter, get_export_filename
from utils.audit import AuditAction, AuditLevel, get_audit_logger, log_action, AuditContext
from utils.filters import AdvancedFilter, ProjectFilters, FilterPreset, FilterOperator
from utils.formatting import format_xof, format_percentage

logger = logging.getLogger(__name__)

# ============================================================================
# PAGE REPORTING & EXPORT
# ============================================================================

def show_reporting_export():
    """Afficher page reporting et export avancé"""
    
    st.title("📊 Reporting & Export Avancé")
    st.markdown("Exports propres, filtres avancés, audit logging")
    
    # Tabs
    tab1, tab2, tab3, tab4 = st.tabs([
        "📥 Exports",
        "🔍 Filtres Avancés",
        "📋 Audit Logs",
        "🎯 Presets"
    ])
    
    # ========================================================================
    # TAB 1: EXPORTS
    # ========================================================================
    
    with tab1:
        st.subheader("📥 Télécharger Données")
        
        # Load projects
        projects = get_projects()
        
        if projects.empty:
            st.warning("Aucun projet disponible")
            return
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.metric("Total Projets", len(projects))
        with col2:
            st.metric("Période", f"{projects['created_at'].min().strftime('%d/%m/%Y') if not projects.empty else 'N/A'} - {datetime.now().strftime('%d/%m/%Y')}")
        
        st.divider()
        
        # Export options
        export_type = st.radio(
            "Type d'export",
            options=["CSV", "Excel", "PDF Rapport"],
            horizontal=True
        )
        
        # Colonne selection
        st.subheader("Sélectionner colonnes à exporter")
        
        available_columns = [
            'id', 'name', 'region', 'sector', 'status',
            'budget_xof', 'spent_xof', 'progress', 'beneficiaries',
            'start_date', 'end_date', 'created_by', 'created_at'
        ]
        
        selected_columns = st.multiselect(
            "Colonnes",
            options=[col for col in available_columns if col in projects.columns],
            default=[col for col in available_columns if col in projects.columns][:6]
        )
        
        # Export CSV
        if export_type == "CSV":
            st.subheader("📄 Export CSV")
            
            col1, col2 = st.columns(2)
            
            with col1:
                include_formatting = st.checkbox("Formater (monnaie, dates)", value=True)
            
            with col2:
                encoding = st.selectbox("Encodage", options=["UTF-8 with BOM", "UTF-8", "ISO-8859-1"], index=0)
            
            # Preview
            with st.expander("Aperçu (10 premières lignes)"):
                preview_df = projects[selected_columns].head(10).copy()
                if include_formatting:
                    for col in preview_df.columns:
                        if 'xof' in col.lower():
                            preview_df[col] = preview_df[col].apply(lambda x: f"{x:,.0f}" if pd.notna(x) else "")
                st.dataframe(preview_df, use_container_width=True)
            
            # Export button
            if st.button("✅ Générer CSV", key="csv_export"):
                try:
                    with AuditContext(AuditAction.EXPORT_CSV, resource_type='projects', resource_id=str(len(projects))):
                        csv_data = CSVExporter.export_projects(
                            projects[selected_columns],
                            format_currency=include_formatting
                        )
                        
                        st.download_button(
                            label="📥 Télécharger CSV",
                            data=csv_data,
                            file_name=get_export_filename('csv'),
                            mime="text/csv"
                        )
                        
                        st.success(f"✅ CSV prêt: {len(projects)} lignes, {len(selected_columns)} colonnes")
                except Exception as e:
                    st.error(f"❌ Erreur: {e}")
        
        # Export Excel
        elif export_type == "Excel":
            st.subheader("📊 Export Excel")
            
            col1, col2 = st.columns(2)
            
            with col1:
                include_kpis = st.checkbox("Inclure feuille KPIs", value=True)
            
            with col2:
                include_summary = st.checkbox("Inclure résumé régional", value=True)
            
            # Preview
            with st.expander("Aperçu (10 premières lignes)"):
                st.dataframe(projects[selected_columns].head(10), use_container_width=True)
            
            # Export button
            if st.button("✅ Générer Excel", key="excel_export"):
                try:
                    with AuditContext(AuditAction.EXPORT_EXCEL, resource_type='projects', resource_id=str(len(projects))):
                        # Build report data
                        report_data = {'Projets': projects[selected_columns]}
                        
                        if include_kpis:
                            kpis = {
                                'Budget Variance': calculate_budget_variance(projects),
                                'Delay Index': calculate_delay_index(projects),
                                'Completion Rate': calculate_completion_rate(projects),
                                'ROI': calculate_roi(projects),
                                'Cost per Beneficiary': calculate_cost_per_beneficiary(projects),
                                'Efficiency Score': calculate_efficiency_score(projects),
                            }
                            
                            kpis_df = pd.DataFrame([
                                {'KPI': 'Budget Variance %', 'Value': kpis['Budget Variance'].get('variance', 0)},
                                {'KPI': 'Overdue Projects', 'Value': kpis['Delay Index'].get('overdue_count', 0)},
                                {'KPI': 'Completion Rate %', 'Value': kpis['Completion Rate'].get('rate', 0)},
                                {'KPI': 'ROI', 'Value': kpis['ROI'].get('roi', 0)},
                                {'KPI': 'Efficiency Score', 'Value': kpis['Efficiency Score'].get('score', 0)},
                            ])
                            report_data['KPIs'] = kpis_df
                        
                        if include_summary:
                            regional_summary = projects.groupby('region').agg({
                                'id': 'count',
                                'budget_xof': 'sum',
                                'spent_xof': 'sum',
                                'progress': 'mean'
                            }).rename(columns={'id': 'count'})
                            report_data['Régions'] = regional_summary
                        
                        excel_bytes = ExcelExporter.export_report(report_data, title="E-GovProjetGB")
                        
                        st.download_button(
                            label="📥 Télécharger Excel",
                            data=excel_bytes,
                            file_name=get_export_filename('excel'),
                            mime="application/vnd.ms-excel"
                        )
                        
                        sheets = len(report_data)
                        st.success(f"✅ Excel prêt: {sheets} feuilles, {len(projects)} projets")
                except Exception as e:
                    st.error(f"❌ Erreur Excel: {e}")
        
        # Export PDF
        elif export_type == "PDF Rapport":
            st.subheader("📄 Export PDF Synthétique")
            
            col1, col2 = st.columns(2)
            
            with col1:
                include_tables = st.checkbox("Inclure tableaux détaillés", value=True)
            
            with col2:
                report_title = st.text_input("Titre du rapport", value="Rapport E-GovProjetGB")
            
            # Export button
            if st.button("✅ Générer PDF", key="pdf_export"):
                try:
                    with AuditContext(AuditAction.EXPORT_PDF, resource_type='report', resource_id=report_title):
                        kpis = {
                            'Budget Variance %': calculate_budget_variance(projects).get('variance', 0),
                            'Overdue Projects': calculate_delay_index(projects).get('overdue_count', 0),
                            'Completion Rate %': calculate_completion_rate(projects).get('rate', 0),
                            'Efficiency Score': calculate_efficiency_score(projects).get('score', 0),
                        }
                        
                        pdf_bytes = PDFExporter.export_summary_report(
                            projects[selected_columns],
                            kpis,
                            title=report_title,
                            subtitle=f"Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}",
                            include_tables=include_tables
                        )
                        
                        st.download_button(
                            label="📥 Télécharger PDF",
                            data=pdf_bytes,
                            file_name=get_export_filename('pdf'),
                            mime="application/pdf"
                        )
                        
                        st.success(f"✅ PDF prêt: Rapport synthétique {len(projects)} projets")
                except ImportError:
                    st.error("❌ reportlab non installé. Installez avec: pip install reportlab")
                except Exception as e:
                    st.error(f"❌ Erreur PDF: {e}")
    
    # ========================================================================
    # TAB 2: ADVANCED FILTERS
    # ========================================================================
    
    with tab2:
        st.subheader("🔍 Filtres Avancés")
        st.markdown("Créer des filtres personnalisés pour vos rapports")
        
        projects = get_projects()
        
        if projects.empty:
            st.warning("Aucun projet disponible")
            return
        
        # Quick filters
        col1, col2, col3 = st.columns(3)
        
        with col1:
            regions = st.multiselect(
                "Régions",
                options=sorted(projects['region'].unique()),
                default=[]
            )
        
        with col2:
            sectors = st.multiselect(
                "Secteurs",
                options=sorted(projects['sector'].unique()),
                default=[]
            )
        
        with col3:
            statuses = st.multiselect(
                "Statuts",
                options=sorted(projects['status'].unique()),
                default=[]
            )
        
        # Date range
        col1, col2 = st.columns(2)
        
        with col1:
            start_date = st.date_input("Date début", value=projects['start_date'].min())
        
        with col2:
            end_date = st.date_input("Date fin", value=datetime.now())
        
        # Budget range
        col1, col2 = st.columns(2)
        
        with col1:
            min_budget = st.number_input(
                "Budget minimum (XOF)",
                value=0,
                min_value=0,
                step=1_000_000
            )
        
        with col2:
            max_budget = st.number_input(
                "Budget maximum (XOF)",
                value=int(projects['budget_xof'].max()),
                min_value=0,
                step=1_000_000
            )
        
        # Progress range
        col1, col2 = st.columns(2)
        
        with col1:
            min_progress = st.slider("Min Avancement %", 0, 100, 0)
        
        with col2:
            max_progress = st.slider("Max Avancement %", 0, 100, 100)
        
        # Apply filters
        if st.button("🔍 Appliquer Filtres", key="apply_filters"):
            filtered = projects.copy()
            
            if regions:
                filtered = ProjectFilters.by_region(filtered, regions)
            if sectors:
                filtered = ProjectFilters.by_sector(filtered, sectors)
            if statuses:
                filtered = ProjectFilters.by_status(filtered, statuses)
            
            filtered = ProjectFilters.by_date_range(
                filtered,
                start_date=pd.Timestamp(start_date),
                end_date=pd.Timestamp(end_date)
            )
            
            filtered = ProjectFilters.by_budget_range(
                filtered,
                min_budget=min_budget,
                max_budget=max_budget
            )
            
            filtered = ProjectFilters.by_progress_range(
                filtered,
                min_progress=min_progress,
                max_progress=max_progress
            )
            
            # Results
            st.success(f"✅ Filtrage appliqué: {len(filtered)} projets trouvés (de {len(projects)})")
            
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Projets", len(filtered))
            with col2:
                st.metric("Budget Total", format_xof(filtered['budget_xof'].sum()))
            with col3:
                st.metric("Avancement Moyen", f"{filtered['progress'].mean():.1f}%")
            
            # Display table
            st.subheader("Résultats")
            st.dataframe(
                filtered[[
                    'name', 'region', 'sector', 'status', 'progress', 'budget_xof', 'spent_xof'
                ]].rename(columns={
                    'name': 'Projet',
                    'region': 'Région',
                    'sector': 'Secteur',
                    'status': 'Statut',
                    'progress': 'Avancement %',
                    'budget_xof': 'Budget',
                    'spent_xof': 'Dépensé'
                }),
                use_container_width=True,
                height=400
            )
            
            # Export filtered
            if st.button("💾 Exporter Résultats Filtrés", key="export_filtered"):
                csv_data = CSVExporter.export_projects(filtered)
                st.download_button(
                    label="Télécharger CSV",
                    data=csv_data,
                    file_name=f"egov_filtered_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                    mime="text/csv"
                )
    
    # ========================================================================
    # TAB 3: AUDIT LOGS
    # ========================================================================
    
    with tab3:
        st.subheader("📋 Journaux d'Audit")
        st.markdown("Traçabilité complète des actions")
        
        audit_logger = get_audit_logger()
        
        # Summary
        stats = audit_logger.get_statistics()
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Total Entrées", stats.get('total_entries', 0))
        with col2:
            st.metric("Utilisateurs Uniques", stats.get('unique_users', 0))
        with col3:
            st.metric("Actions Différentes", len(stats.get('actions_count', {})))
        
        st.divider()
        
        # Filters
        col1, col2, col3 = st.columns(3)
        
        with col1:
            action_filter = st.selectbox(
                "Action",
                options=['TOUTES'] + list(stats.get('actions_count', {}).keys()),
                index=0
            )
        
        with col2:
            user_filter = st.text_input("Utilisateur (vide = tous)", "")
        
        with col3:
            level_filter = st.selectbox(
                "Niveau",
                options=['TOUS', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
            )
        
        # Get logs
        logs_df = audit_logger.get_logs()
        
        if not logs_df.empty:
            # Apply filters
            if action_filter != 'TOUTES':
                logs_df = logs_df[logs_df['action'] == action_filter]
            
            if user_filter:
                logs_df = logs_df[logs_df['user_id'] == user_filter]
            
            if level_filter != 'TOUS':
                logs_df = logs_df[logs_df['level'] == level_filter]
            
            st.subheader("Logs Récents")
            st.dataframe(
                logs_df[[
                    'timestamp', 'action', 'user_id', 'resource_type', 'level'
                ]].rename(columns={
                    'timestamp': 'Heure',
                    'action': 'Action',
                    'user_id': 'Utilisateur',
                    'resource_type': 'Ressource',
                    'level': 'Niveau'
                }).sort_values('Heure', ascending=False),
                use_container_width=True,
                height=400
            )
            
            # Integrity check
            st.divider()
            
            if st.button("🔐 Vérifier Intégrité"):
                integrity = audit_logger.verify_integrity()
                
                if integrity['valid']:
                    st.success(f"✅ Audit logs intacts ({integrity['total_entries']} entrées)")
                else:
                    st.error(f"⚠️ {integrity['tampered_count']} entrées falsifiées détectées!")
                    with st.expander("Détails"):
                        st.json(integrity['tampered_entries'])
            
            # Export logs
            col1, col2 = st.columns(2)
            
            with col1:
                if st.button("💾 Exporter en CSV"):
                    csv_data = audit_logger.export_logs(format_type='csv')
                    st.download_button(
                        label="Télécharger",
                        data=csv_data,
                        file_name=f"audit_logs_{datetime.now().strftime('%Y%m%d')}.csv",
                        mime="text/csv"
                    )
            
            with col2:
                if st.button("💾 Exporter en JSON"):
                    json_data = audit_logger.export_logs(format_type='json')
                    st.download_button(
                        label="Télécharger",
                        data=json_data,
                        file_name=f"audit_logs_{datetime.now().strftime('%Y%m%d')}.json",
                        mime="application/json"
                    )
        else:
            st.info("Aucun log d'audit disponible")
    
    # ========================================================================
    # TAB 4: PRESETS
    # ========================================================================
    
    with tab4:
        st.subheader("🎯 Presets de Rapports")
        st.markdown("Rapports pré-configurés pour cas d'usage courants")
        
        projects = get_projects()
        
        if projects.empty:
            st.warning("Aucun projet disponible")
            return
        
        preset_choice = st.radio(
            "Sélectionner rapport",
            options=[
                "Rapport Risques",
                "Rapport Performance",
                "Analyse Régionale",
                "Analyse Sectorielle"
            ]
        )
        
        # Risk Report
        if preset_choice == "Rapport Risques":
            st.subheader("🔴 Rapport Risques")
            st.markdown("Projets en retard et/ou en dépassement budgétaire")
            
            at_risk = FilterPreset.risk_report(projects)
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.metric("Projets à Risque", len(at_risk))
            with col2:
                st.metric("Budget à Risque", format_xof(at_risk['budget_xof'].sum()))
            
            st.dataframe(at_risk[[
                'name', 'region', 'sector', 'status', 'budget_xof', 'spent_xof', 'progress'
            ]], use_container_width=True)
        
        # Performance Report
        elif preset_choice == "Rapport Performance":
            st.subheader("📈 Rapport Performance")
            st.markdown("Projets complétés avec analyse budgétaire")
            
            perf = FilterPreset.performance_report(projects)
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.metric("Projets Complétés", len(perf))
            with col2:
                avg_variance = perf['budget_variance'].mean() if 'budget_variance' in perf.columns else 0
                st.metric("Variance Budget Moy.", f"{avg_variance:.1f}%")
            
            st.dataframe(perf[[
                'name', 'region', 'sector', 'budget_xof', 'spent_xof', 'progress'
            ]], use_container_width=True)
        
        # Regional Analysis
        elif preset_choice == "Analyse Régionale":
            st.subheader("🗺️ Analyse Régionale")
            
            region = st.selectbox(
                "Sélectionner région",
                options=sorted(projects['region'].unique())
            )
            
            regional = FilterPreset.regional_summary(projects, region)
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric("Projets", len(regional))
            with col2:
                st.metric("Budget Total", format_xof(regional['budget_xof'].sum()))
            with col3:
                st.metric("Avancement Moyen", f"{regional['progress'].mean():.1f}%")
            
            st.dataframe(regional[[
                'name', 'sector', 'status', 'budget_xof', 'spent_xof', 'progress'
            ]], use_container_width=True)
        
        # Sector Analysis
        elif preset_choice == "Analyse Sectorielle":
            st.subheader("🏭 Analyse Sectorielle")
            
            sector = st.selectbox(
                "Sélectionner secteur",
                options=sorted(projects['sector'].unique())
            )
            
            sectoral = FilterPreset.sector_analysis(projects, sector)
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric("Projets", len(sectoral))
            with col2:
                st.metric("Budget Total", format_xof(sectoral['budget_xof'].sum()))
            with col3:
                st.metric("Bénéficiaires", int(sectoral['beneficiaries'].sum()))
            
            st.dataframe(sectoral[[
                'name', 'region', 'status', 'budget_xof', 'spent_xof', 'progress'
            ]], use_container_width=True)
