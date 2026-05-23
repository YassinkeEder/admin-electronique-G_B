# Architecture & Design du Module BI

## 📐 Vue d'ensemble Architecturale

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND NEXTJS                          │
│              (Dashboard gestion projets)                    │
└───────────────────────────────────────────────────────────┘
                            ↓ REST API
┌─────────────────────────────────────────────────────────────┐
│               SUPABASE POSTGRESQL                           │
│    (Single source of truth - Projects, Tasks, Metrics)     │
└───────────────────────────────────────────────────────────┘
        ↑ READ-ONLY                    ↑ READ-ONLY
        │                              │
┌───────────────────────┐    ┌─────────────────────┐
│  STREAMLIT BI APP     │    │   ETL/ML Pipeline   │
│  (Analytics)          │    │   (Forecasting)     │
└───────────────────────┘    └─────────────────────┘
```

---

## 🏗️ Couches Architecturales

### Layer 1: Data Access (data/)
**Responsabilité**: Accès sécurisé à la base de données

- `connection.py`: Singleton PostgreSQL + cache Streamlit
- Requêtes optimisées avec indexes
- Lecture seule (RLS policy `read_only` role)
- Caching TTL configurable (default 3600s)

```python
# Pattern DAL
@st.cache_data(ttl=CACHE_TTL)
def get_projects(filters) -> pd.DataFrame:
    """Requête optimisée avec filtre"""
    # Connection pool via get_db_connection()
    # Retourner DataFrame typeé
```

### Layer 2: KPI Calculation (kpis/)
**Responsabilité**: Calcul des indicateurs métier

Chaque KPI suit pattern identique:
```python
def calculate_xxx(projects_df: pd.DataFrame) -> Dict[str, Any]:
    """
    1. Valider input (vérifier colonnes)
    2. Appliquer formule métier
    3. Déterminer status (success/warning/danger)
    4. Retourner dict typé
    """
```

**KPI implémentés**:
1. **Budget Variance** = (Spent - Budget) / Budget × 100
2. **Delay Index** = Jours après end_date prévue
3. **Completion Rate** = Projects DONE / Total
4. **ROI** = (Beneficiaries × Sector_Weight) / Budget
5. **Cost per Beneficiary** = Budget / Beneficiaries
6. **Efficiency Score** = Combo (completion + budget + progress)

### Layer 3: Visualization (dashboards/)
**Responsabilité**: Composants Streamlit + Plotly

- `overview.py`: Vue générale (6 onglets)
- Filtres sidebar (région, secteur, statut, dates)
- Drill-down: Cliquer sur graphe → affiche détails
- Responsive design (Streamlit wide layout)

```python
# Pattern Streamlit
st.metric("Label", value, delta)
st.plotly_chart(fig, use_container_width=True)
st.dataframe(df, hide_index=True)
```

### Layer 4: Utils (utils/)
**Responsabilité**: Helpers réutilisables

- Formatage: XOF, %, dates
- Colonnes calculées: budget_status, delay_status
- Filtrage multi-critères

---

## 📊 Flux de Données

### 1. Lancer Streamlit
```
streamlit run app.py
  → Charge config.py (constantes GB, couleurs)
  → Initialise Sidebar (filtres)
  → Affiche page sélectionnée
```

### 2. Sélectionner Page (e.g., "Dashboard Global")
```
user clicks "📊 Dashboard Global"
  → show_overview()
  → get_projects() [DAL]
    → @st.cache_data check
    → get_db_connection() [Singleton]
    → Execute SQL avec filtres
    → Retourner pd.DataFrame
  → Calculer KPI (kpis/core.py)
    → calculate_budget_variance(df)
    → calculate_roi(df)
    → ...
  → Afficher via Streamlit + Plotly
```

### 3. Filtrer (Sidebar)
```
user selects region="Bissau"
  → Sidebar capture value
  → Page se rerend (Streamlit reactivity)
  → get_projects(region='Bissau') [cache key change]
  → Nouvelles données
  → Graphes mis à jour
```

---

## 🔐 Sécurité

### Database Level
- Role `read_only` autorisé SELECT seulement
- RLS policies protègent données sensibles
- Pas de INSERT/UPDATE/DELETE depuis BI

### Application Level
- Secrets dans `.streamlit/secrets.toml` (git-ignored)
- CONNECTION_STRING jamais en code
- Validation input (parameterized queries)
- Cache timeout limité

### Deployment Level
- HTTPS requis
- Auth Streamlit Cloud optional
- Secrets gérés par platform (AWS Secrets Manager, etc.)

---

## 📈 Performance

### Optimizations
| Technique | Bénéfice | Config |
|-----------|----------|--------|
| st.cache_data | Requête DB faite 1x | TTL=3600s |
| Index DB | Requête rapide | Voir migrations |
| LIMIT 10k | Pas de crash | Configurable |
| Aggregation SQL | Moins de data | GROUP BY native |

### Monitoring
```python
# Ajouter dans queries:
import time
start = time.time()
result = cur.fetchall()
duration = time.time() - start
logger.info(f"Query took {duration}ms")  # Slow query alert si >5s
```

---

## 🎨 UI/UX Decisions

### Layout Streamlit
```
┌─────────────────────────────────────┐
│  [APP TITLE + SUMMARY METRICS]     │
├─────────────────────────────────────┤
│  [ROW 1] [4 KPI CARDS]             │
├─────────────────────────────────────┤
│  [ROW 2] [STATUS CHARTS] [BUDGET]  │
├─────────────────────────────────────┤
│  [ROW 3] [REGION ANALYSIS] [SECTOR]│
├─────────────────────────────────────┤
│  [ROW 4] [TIMELINE] [PROGRESS]     │
└─────────────────────────────────────┘
```

### Color Scheme
- **Primary**: Bleu gouvernemental (#0066cc)
- **Success**: Vert (#10b981)
- **Warning**: Orange (#f59e0b)
- **Danger**: Rouge (#ef4444)
- **Region-specific**: Couleur unique par région (GB context)

### Filters
- **Location**: Sidebar gauche (toujours visible)
- **Type**: Multiselect (région, secteur), Date range, Status chips
- **UX**: Filtres appliquent immédiatement (reactivity)

---

## 🚀 Évolutivité

### Version 1.0 (Actuelle)
- ✅ 6 KPI principaux
- ✅ 7 pages dashboards
- ✅ Filtres basiques

### Version 1.1 (Prochaine)
- 🚧 ML: Prophet forecasting (fin projets)
- 🚧 ML: Clustering (régions similaires)
- 🚧 Anomaly detection (budget anormal)
- 🚧 Comparaisons année-à-année

### Version 2.0 (Future)
- 📋 Real-time data push (Supabase subscriptions)
- 📋 Export PDF rapports
- 📋 API REST pour mobile app
- 📋 Webhooks vers Slack/Teams

---

## 📝 Code Patterns

### Pattern 1: DAL Query
```python
@st.cache_data(ttl=CACHE_TTL)
def get_projects(status: str = None) -> pd.DataFrame:
    """Reusable, cached, typed"""
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = "SELECT * FROM projects WHERE 1=1"
            params = []
            if status:
                query += " AND status = %s"
                params.append(status)
            cur.execute(query, params)
            df = pd.DataFrame(cur.fetchall())
            return df
    except Exception as e:
        logger.error(f"Query error: {e}")
        return pd.DataFrame()
    finally:
        conn.close()
```

### Pattern 2: KPI Calculation
```python
def calculate_xxx(df: pd.DataFrame) -> Dict[str, Any]:
    """Pure function, no side effects"""
    if df.empty:
        return {'value': 0, 'status': 'neutral'}
    
    # Computation
    value = df['col'].sum() / df['other'].sum()
    
    # Determine status
    status = 'success' if value > threshold else 'danger'
    
    return {
        'value': value,
        'status': status,
        'details': {...}
    }
```

### Pattern 3: Streamlit Display
```python
# Metrics
st.metric("Label", f"{value:.1f}%", f"Delta: +5%")

# Charts
fig = px.bar(df, x='col', y='val', color_discrete_map=COLORS)
st.plotly_chart(fig, use_container_width=True)

# Tables
st.dataframe(df, hide_index=True, use_container_width=True)

# Filter
region = st.sidebar.selectbox("Region", options=REGIONS)
filtered = df[df['region'] == region]
```

---

## 🧪 Testing

### Unit Tests (kpis/)
```python
# test_kpis.py
def test_calculate_budget_variance():
    df = pd.DataFrame({
        'budget_xof': [100, 200],
        'spent_xof': [80, 250]  # One under, one over
    })
    result = calculate_budget_variance(df)
    assert result['variance'] > 0  # Overall overspent
    assert result['status'] == 'warning'
```

### Integration Tests (data/)
```python
def test_get_projects_with_filter():
    df = get_projects(region='Bissau')
    assert all(df['region'] == 'Bissau')
    assert not df.empty  # Assuming data exists
```

---

## 📚 Documentation

- **README.md**: Overview & features
- **INSTALLATION_GUIDE.md**: Setup steps
- **ARCHITECTURE.md**: This file
- **Docstrings**: Chaque fonction a docstring
- **Inline comments**: Pour logique complexe

---

## 🔗 Connexion avec Next.js

### Current State
- Streamlit BI = App indépendante
- Partagent BD (Supabase PostgreSQL)
- Pas de communication directe

### Future Integration
```python
# Option 1: iframe dans Next.js
# <iframe src="http://localhost:8501"></iframe>

# Option 2: API REST Bridge
# Next.js → API → Streamlit API

# Option 3: Webhooks
# BD change → Trigger → Update BI cache
```

---

## 🎓 Pour le Mémoire

### Points forts
1. ✅ Architecture modulaire (séparation concerns)
2. ✅ Performance (cache, indexes, aggregation DB)
3. ✅ Sécurité (read-only, parameterized queries)
4. ✅ Scalabilité (stateless app, easy horizontal)
5. ✅ UX (responsive, intuitive, bien documenté)

### Critères Master's Level
- Conception bien documentée ✓
- Code professionnel et maintenable ✓
- Gestion d'erreurs robuste ✓
- Context Guinée-Bissau préservé ✓
- Tests possibles ✓

---

**Version**: 1.0  
**Date**: April 2026  
**Auteur**: E-GovProjetGB Team
