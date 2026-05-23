# Tutoriel d'Utilisation - Module BI Streamlit

## 🎯 Objectif

Ce tutoriel vous guide pour utiliser et étendre le module BI de E-GovProjetGB.

---

## 📍 Démarrage Rapide

### 1. Installation (5 min)

```bash
cd project/bi
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configurer secrets

```bash
cp .streamlit/secrets.example.toml .streamlit/secrets.toml
# Éditer avec DATABASE_URL
```

### 3. Lancer l'app

```bash
streamlit run app.py
```

Accès: http://localhost:8501

---

## 🎮 Utilisation de Base

### Interface Principale

```
┌─────────────────────────────────────┐
│         🎯 FILTERS (Sidebar)       │  ← Filtrer région, secteur, statut
├─────────────────────────────────────┤
│       📑 NAVIGATION (Sidebar)       │  ← Choisir page
├─────────────────────────────────────┤
│          📊 MAIN DASHBOARD          │
│  - KPI Cards (4 métriques clé)      │
│  - Charts (Distribution, Regions)   │
│  - Tables (Top projects, Anomalies) │
└─────────────────────────────────────┘
```

### Filtrer les Données

**Sidebar Gauche** → Sélectionner:

```
🎯 Filtres
  ├─ Régions: □ Bissau □ Gabu ... (multiselect)
  ├─ Secteurs: □ Santé □ Éducation ... (multiselect)
  ├─ Statuts: □ PLANNED □ IN_PROGRESS ... (multiselect)
  └─ Période: [Date début] → [Date fin]
```

**L'app se recharge automatiquement** avec nouvelles données.

### Naviguer entre Pages

**Menu Navigation** (Sidebar):

- 📊 **Dashboard Global**: Vue d'ensemble KPI
- 🗺️ **Analyse Régionale**: Stats par région
- 🏭 **Analyse Secteurs**: Perf par secteur
- 💰 **Budget Tracking**: Détails budgets
- 📈 **Timeline & Gantt**: Calendrier projets
- 🤖 **Prédictions ML**: Forecasting
- 📋 **Données Brutes**: Export CSV

---

## 📊 Interpréter les Dashboards

### Dashboard Global (Page Par Défaut)

#### Row 1: KPI Cards
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  Écart Budget   │ Complétion (%)  │ Projets Retard  │ Score Efficacité│
│  -5% ✅         │  65% 🟡         │  2 ⚠️          │  72% 🟢         │
│  Bon            │  Moyen          │  Faible         │  Bon            │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘

KPI Meanings:
- Écart Budget: <0 = sous budget (bon), >0 = dépassement
- Complétion: % projets DONE
- Retard: Nombre en retard vs end_date
- Efficacité: Score global 0-100
```

#### Row 2-3: Charts

- **Pie Chart "Distribution Statut"**: Voir proportion PLANNED/IN_PROGRESS/etc
- **Bar "Budget Statut"**: Comparer budgets par statut
- **Map "Projets Région"**: Voir intensité par région
- **Bar "Budget Région"**: Où concentré budget

#### Row 4-5: Top/Bottom Projects

- **🏆 Top 5**: Projets plus grands (budget)
- **⚠️ Écart**: Projets les plus loin de budget (overspend)

### Exemple: Analyser Région Bissau

```
1. Sidebar: Région → Sélectionner "Bissau"
2. Page recharge → Données filtrées Bissau
3. Dashboard montre:
   - KPI: Budget total Bissau, completion rate
   - Charts: Distribution statuts (Bissau)
   - Table: Top 5 projets Bissau
4. Aller page "Analyse Régionale" pour stats détaillées
```

---

## 🔍 Cas d'Usage Courants

### UC1: Identifier Projets à Risque

**Objectif**: Trouver projets en difficulté pour intervention

**Étapes**:
1. Page "Budget Tracking"
2. Chercher colonnes `budget_status` rouge 🔴
3. Cliquer en détails → examine budget/dépenses
4. Page "Timeline & Gantt" → voir retards
5. Exporter CSV pour rapport

**Output**: Liste projets critiques + recommandations

### UC2: Comparer Régions

**Objectif**: Déterminer régions performantes vs faibles

**Étapes**:
1. Page "Analyse Régionale"
2. Comparer colonnes: `project_count`, `total_budget`, `avg_progress`
3. Identifier top 3 régions performantes
4. Identifier régions faibles → besoin support?

**Output**: Classement régions + profil

### UC3: Prévoir Fin Projets

**Objectif**: Prédire dates fin réalistes

**Étapes**:
1. Page "Timeline & Gantt"
2. Gantt chart affiche dates prévues
3. Progress bars montrent avancement
4. Page "Prédictions ML" (future):
   - Prophet: Prédit based on progress historique
   - Confidence interval: Range probable
5. Ajuster planning si nécessaire

**Output**: Forecast timeline

### UC4: Analyser Efficacité Secteurs

**Objectif**: Secteur santé est-il plus efficace que agriculture?

**Étapes**:
1. Page "Analyse Secteurs"
2. Comparer: `avg_progress`, `completion_rate`, `total_budget`
3. Calculer: Budget/bénéficiaire par secteur
4. Identifier secteurs à impact élevé

**Output**: Recommandations allocation budgets

---

## 🛠️ Étendre le Module

### Ajouter Nouveau KPI

**Étapes**:

1. **Créer fonction dans `kpis/core.py`**:

```python
def calculate_my_kpi(projects_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Ma nouvelle métrique
    
    Formule: ...
    """
    if projects_df.empty:
        return {'value': 0, 'status': 'neutral'}
    
    value = projects_df['col'].sum()
    status = 'success' if value > threshold else 'danger'
    
    return {
        'value': value,
        'status': status,
    }
```

2. **Importer dans `dashboards/overview.py`**:

```python
from kpis.core import calculate_my_kpi

# Dans show_overview():
my_kpi = calculate_my_kpi(projects)
st.metric("Mon KPI", f"{my_kpi['value']:.1f}")
```

3. **Tester locally**:

```bash
streamlit run app.py
# Vérifier "Dashboard Global" affiche nouveau KPI
```

### Ajouter Nouvelle Page Dashboard

**Étapes**:

1. **Créer `dashboards/my_dashboard.py`**:

```python
import streamlit as st
from data.connection import get_projects

def show_my_dashboard():
    st.title("🎯 Mon Nouveau Dashboard")
    
    projects = get_projects()
    st.dataframe(projects)
```

2. **Importer dans `app.py`**:

```python
from dashboards.overview import show_overview
from dashboards.my_dashboard import show_my_dashboard  # NEW

# Dans app.py navigation:
page = st.sidebar.radio(
    "...",
    ["📊 Dashboard Global", "🎯 Mon Dashboard"]  # Add
)

if page == "📊 Dashboard Global":
    show_overview()
elif page == "🎯 Mon Dashboard":
    show_my_dashboard()  # NEW
```

3. **Tester**:

```bash
streamlit run app.py
# Sidebar navigation doit afficher "🎯 Mon Dashboard"
```

### Ajouter Filter Avancé

**Étapes**:

1. **Dans `app.py` Sidebar**:

```python
# NEW FILTER
date_from = st.sidebar.date_input("De:")
date_to = st.sidebar.date_input("À:")

budget_min = st.sidebar.number_input("Budget min (XOF):", value=0)
budget_max = st.sidebar.number_input("Budget max (XOF):", value=1000000)
```

2. **Passer aux requêtes**:

```python
# Dans show_overview():
projects = get_projects(
    status=selected_statuses[0] if selected_statuses else None,
    region=selected_regions[0] if selected_regions else None,
)

# Filter localement
projects = projects[
    (projects['budget_xof'] >= budget_min) &
    (projects['budget_xof'] <= budget_max)
]
```

### Ajouter Graphe Plotly Custom

**Étapes**:

1. **Créer figure**:

```python
import plotly.express as px

df = get_projects()

fig = px.scatter(
    df,
    x='budget_xof',
    y='progress',
    color='region',
    size='beneficiaries',
    hover_name='name',
    title="Budget vs Progress (bubble = bénéficiaires)"
)

st.plotly_chart(fig, use_container_width=True)
```

2. **Customizer** (colors, labels, etc):

```python
fig.update_traces(marker=dict(size=10))
fig.update_xaxes(type='log')  # Log scale
fig.update_layout(height=600, hovermode='closest')
```

---

## 🧪 Debugging

### Problème: Pas de données affichées

**Debug**:
```python
# Ajouter temporairement:
st.write("DEBUG: Projects loaded")
st.dataframe(projects.head())
st.write(f"Rows: {len(projects)}")

# Vérifier:
# - Filters appliqués? Sidebar checks?
# - Database connectée? (sidebar doit dire ✅)
# - Dates correctes?
```

### Problème: Graphe vide

**Debug**:
```python
# Vérifier dataframe avant chart
st.write(df.describe())  # Check colonnes, types
st.write(df.head())

# Vérifier colonnes existent
assert 'region' in df.columns
assert 'budget_xof' in df.columns
```

### Problème: App très lente

**Causes**:
- Cache expiré (CACHE_TTL = 3600s)
- Requête SELECT * sans LIMIT
- Dataset 100k+ rows

**Solutions**:
```python
# 1. Vérifier cache
st.cache_data(ttl=300)  # 5 min instead 1h

# 2. Vérifier query
cur.execute(query + " LIMIT 5000")  # Add LIMIT

# 3. Profiler
import cProfile
cProfile.run('show_overview()')
```

---

## 📈 Bonnes Pratiques

### ✅ DO

- ✅ Utiliser DAL functions (`data/connection.py`)
- ✅ Cacher requêtes DB (`@st.cache_data`)
- ✅ Utiliser constantes (`config.COLORS_PALETTE`)
- ✅ Documenter code (docstrings)
- ✅ Valider input (empty checks)

### ❌ DON'T

- ❌ Requête SQL directe dans UI code
- ❌ Hardcoder couleurs/labels
- ❌ Ignorer erreurs exceptions
- ❌ SELECT * sans LIMIT
- ❌ Stocker secrets en plaintext

---

## 🚀 Déploiement

### Local Testing
```bash
streamlit run app.py --logger.level=debug
```

### Production (Streamlit Cloud)
```bash
# 1. Push code GitHub
git add .
git commit -m "Add BI features"
git push

# 2. Streamlit Cloud: https://share.streamlit.io
# 3. Ajouter DATABASE_URL dans "Secrets"
```

### Production (Serveur Propre)
```bash
# Nginx + Systemd service
# Voir: deployment/streamlit.service
```

---

## 📚 Ressources

- [Streamlit Docs](https://docs.streamlit.io/)
- [Plotly Python](https://plotly.com/python/)
- [Pandas Docs](https://pandas.pydata.org/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## ❓ FAQ

**Q: Comment ajouter colonne au dataframe?**
A: `df['new_col'] = df['col1'] + df['col2']`

**Q: Comment grouper données?**
A: `df.groupby('region')['budget_xof'].sum()`

**Q: Comment formater date?**
A: `pd.to_datetime(df['date']).dt.strftime('%d/%m/%Y')`

**Q: Comment changer couleurs chart?**
A: `color_discrete_map={'val1': '#FF0000', 'val2': '#00FF00'}`

**Q: Où ajouter nouveau secret?**
A: `.streamlit/secrets.toml` + redémarrer app

---

**Version**: 1.0  
**Dernière mise à jour**: April 2026
