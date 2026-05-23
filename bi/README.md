# E-GovProjetGB - Module Décisionnel (BI)

## Vue d'ensemble

Module d'analyse et de business intelligence pour la plateforme E-GovProjetGB. 
Connecté à la base Supabase, ce dashboard Streamlit fournit des analyses avancées 
sur les projets, budgets, et performance des initiatives gouvernementales en Guinée-Bissau.

## Architecture

```
bi/
├── app.py              → Point d'entrée Streamlit
├── config.py           → Configuration centralisée
├── data/               → Accès aux données (Supabase)
├── kpis/               → Calculs d'indicateurs métier
├── dashboards/         → Pages Streamlit
├── utils/              → Utilitaires
└── ml_models/          → Modèles prédictifs
```

## Installation

```bash
cd bi
pip install -r requirements.txt
```

## Lancement

```bash
streamlit run app.py
```

L'application est accessible sur http://localhost:8501

## Fonctionnalités

### 📊 Dashboards
- **Overview** : Vue globale KPI (budget, avancement, retards)
- **Régions** : Comparaison des 9 régions GB
- **Secteurs** : Performance par secteur (santé, éducation, etc.)
- **Budget** : Tracking détaillé budget vs dépenses
- **Timeline** : Gantt chart, prévisions de fin
- **Prédictions ML** : Forecasting, détection anomalies

### 🔍 Filtres
- Région (9 régions GB)
- Secteur (9 secteurs)
- Statut projet (PLANNED, IN_PROGRESS, COMPLETED, SUSPENDED, CANCELLED)
- Plage de dates
- Budget min/max

### 📈 KPI Disponibles
- **Budget Variance** : Budget prévu vs réel
- **ROI** : Retour sur investissement
- **Delay Index** : Indice de retard
- **Completion Rate** : Taux de complétion
- **Cost per Beneficiary** : Coût unitaire par bénéficiaire
- **Efficiency Score** : Score d'efficacité global

### 🤖 ML Features
- Prédiction de fin de projet (Prophet/ARIMA)
- Clustering régional (K-means)
- Détection d'anomalies (Isolation Forest)

## Configuration

### Secrets (`.streamlit/secrets.toml`)
```toml
[database]
url = "postgresql://user:pass@host:5432/db"
supabase_url = "https://project.supabase.co"
supabase_key = "your-anon-key"
```

## Dépendances

- **streamlit** : Framework UI
- **pandas** : Manipulation données
- **psycopg2** : Driver PostgreSQL
- **plotly** : Visualisations interactives
- **scikit-learn** : ML models
- **statsmodels** : Time series (ARIMA)
- **prophet** : Facebook forecasting

## Performance

- Caching Streamlit pour requêtes fréquentes
- Requêtes optimisées avec indexes DB
- Limit 10k lignes par défaut (configurable)

## Sécurité

- Lecture seule sur BD (role `read_only`)
- Pas de modification données depuis BI
- Secrets via `.streamlit/secrets.toml` (git-ignored)

## Structure de données (Supabase)

### Tables utilisées
- `profiles` → Utilisateurs et rôles
- `projects` → Projets avec budgets et régions
- `tasks` → Tâches et statuts
- `metrics` → KPI historiques
- `audit_logs` → Traçabilité actions

### Schéma exemple
```sql
SELECT 
  p.id, p.name, p.region, p.sector, 
  p.budget_xof, p.spent_xof, p.progress, 
  p.status, p.start_date, p.end_date,
  COUNT(t.id) as total_tasks,
  SUM(CASE WHEN t.status='DONE' THEN 1 ELSE 0 END) as completed_tasks
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY p.id
```

## Développement

### Ajouter une nouvelle page de dashboard
1. Créer `dashboards/my_dashboard.py`
2. Importer dans `app.py`
3. Ajouter au menu `st.sidebar.radio()`

### Ajouter un nouveau KPI
1. Créer `kpis/my_kpi.py` avec fonction `calculate_my_kpi(df)`
2. Importer dans les dashboards
3. Afficher avec `st.metric()` ou `st.plotly_chart()`

## Troubleshooting

| Erreur | Cause | Solution |
|--------|-------|----------|
| "DependencyNotFound" | Dépendances manquantes | `pip install -r requirements.txt` |
| "Connection refused" | BD inaccessible | Vérifier DATABASE_URL dans secrets |
| "No data" | Requête retourne rien | Vérifier filtres, dates, permissions RLS |
| "Slow performance" | Trop de données | Ajouter filtres, augmenter cache |

## Contribution

Pour modifier/ajouter des features BI :
1. Tester localement (`streamlit run app.py`)
2. Vérifier les données avec `st.write(df.head())` temporairement
3. Documenter les calculs (formules KPI)
4. Commiter avec message clair

## License

Projet universitaire - E-GovProjetGB (Mémoire de Master 2026)

---

**Dernière mise à jour** : April 2026
