# ML Pipeline Documentation

## 🎯 Overview

The ML pipeline provides predictive models for the E-GovProjetGB platform using scikit-learn's Random Forest classifier. Two models are implemented:

1. **Delay Prediction Model** - Predicts if a project will finish late
2. **Budget Forecasting Model** - Predicts if a project will exceed budget

## 🏗️ Architecture

```
bi/
├── ml_models/
│   ├── data_preparation.py    # Feature engineering & validation
│   ├── models.py              # ML model classes
│   ├── training.py            # Training pipeline & utilities
│   └── predictions.py         # Existing prediction functions
├── dashboards/
│   └── ml_predictions.py      # Streamlit dashboard
└── test_ml_pipeline.py        # Test suite
```

## 📚 Core Components

### 1. Data Preparation (`ml_models/data_preparation.py`)

**Purpose**: Transform raw project data into ML-ready features

**Key Functions**:
- `prepare_project_features(projects_df)` - Engineer 20+ features
- `validate_features(df)` - Clean data, handle NaN/Inf
- `get_ml_features_for_delay_prediction()` - Select 9 features for delay model
- `get_ml_features_for_budget_prediction()` - Select 8 features for budget model

**Features Generated**:
- Timeline: days_elapsed, days_remaining, delay_index
- Progress: progress, progress_gap, overdue_status
- Budget: budget_variance, spending_rate, spending_rate_per_day
- Scale: budget_category, beneficiary_category
- Categorical: region_encoded, sector_encoded, status_encoded

### 2. Model Classes (`ml_models/models.py`)

#### DelayPredictionModel
```python
model = DelayPredictionModel()
metrics = model.train(X_train, y_train, feature_names)
prediction = model.predict(X_sample)
# Returns: {will_be_late: bool, probability: float, confidence: float}
```

#### BudgetForecastingModel
```python
model = BudgetForecastingModel()
metrics = model.train(X_train, y_train, feature_names)
prediction = model.predict(X_sample)
# Returns: {will_overrun: bool, probability: float, confidence: float}
```

**Model Details**:
- Algorithm: RandomForestClassifier
- n_estimators: 50
- max_depth: 8 (prevents overfitting on small datasets)
- min_samples_leaf: 5
- Scaling: StandardScaler applied before training

### 3. Training Pipeline (`ml_models/training.py`)

**MLPipeline Class**:
```python
pipeline = MLPipeline(model_dir='/path/to/models')
report = pipeline.train_from_projects(projects_df)
```

**Report Structure**:
```python
{
    'data_summary': {
        'total_projects': int,
        'overdue_projects': int,
        'budget_overruns': int,
        'avg_budget_variance': float
    },
    'delay_model': {
        'metrics': {'accuracy', 'roc_auc', 'train_size', 'test_size'},
        'features': [list of feature names],
        'feature_importance': {feature: importance}
    },
    'budget_model': {
        'metrics': {...},
        'features': [...],
        'feature_importance': {...}
    }
}
```

**Methods**:
- `train_from_projects()` - Complete pipeline: prep → train → evaluate
- `get_model_limitations()` - Academic defensibility checklist
- `get_deployment_recommendations()` - Production safeguards

### 4. Streamlit Dashboard (`dashboards/ml_predictions.py`)

**Tabs**:
1. **Models Overview** - Metrics, feature importance, reports
2. **Delay Risk** - Risk distribution, high-risk projects
3. **Budget Risk** - Probability distribution, scatter plots
4. **Limitations** - Academic documentation, recommendations

**Caching**:
- `@st.cache_resource` for model training (TTL: 24 hours)
- `@st.cache_data` for data queries (TTL: 1 hour)

## 🚀 Quick Start

### Basic Usage

```python
from bi.ml_models.training import MLPipeline
from bi.data.connection import get_projects

# Load data
projects = get_projects()

# Train models
pipeline = MLPipeline()
report = pipeline.train_from_projects(projects)

# Make predictions
from bi.ml_models.data_preparation import get_ml_features_for_delay_prediction
feature_cols = get_ml_features_for_delay_prediction()
features = projects.iloc[0][feature_cols].values

prediction = pipeline.delay_model.predict(features)
print(f"Will be late: {prediction['will_be_late']} ({prediction['probability']:.1%})")
```

### Streamlit Integration

```python
# bi/app.py already imports and calls it
from dashboards.ml_predictions import show_ml_predictions

# In your page handler:
if page == "🤖 Prédictions ML":
    show_ml_predictions()
```

## 📊 Model Performance

### Expected Metrics

With 50+ projects:
- **Accuracy**: 65-80% (depends on data quality)
- **ROC-AUC**: 0.65-0.85
- **Precision/Recall**: Balanced (70-80% each)

With <20 projects:
- Models still work but may overfit
- Use confidence score cautiously
- Retraining important as data grows

## 🎓 Academic Considerations

### Model Justification
1. **Random Forest chosen over Deep Learning**
   - Better interpretability (feature importance)
   - Works well with small-medium datasets
   - No need for GPU
   - Faster training

2. **Feature Engineering Transparent**
   - All features explicitly defined
   - Rationale documented in code
   - Can be modified/extended easily

3. **Limitations Documented**
   - Cold start problem acknowledged
   - Linearity assumptions stated
   - External events limitation noted

### Deployment Recommendations
1. Always show confidence scores
2. Alert if model not retrained >30 days
3. Track actual vs predicted outcomes
4. Monitor feature distributions
5. Retrain monthly minimum
6. Maintain version control

## ⚠️ Limitations

### Data-Related
- **Cold Start**: Few predictions initially (<20 projects)
- **Linear Progression Assumption**: May fail for non-linear projects
- **External Events**: Crises, policy changes not captured

### Model-Related
- **Class Imbalance**: If few overdue/budget overrun projects
- **Feature Correlation**: Some features may be collinear
- **Small Dataset**: Random Forest can overfit with <50 projects

### Mitigation Strategies
- Use sector/region medians for new projects
- Retrain frequently as data grows
- Monitor actual vs predicted divergence
- Allow manual overrides for known exceptions
- Use confidence scores for decision support

## 🔧 Configuration

### Hyperparameters (in `models.py`)
```python
RandomForestClassifier(
    n_estimators=50,        # Balance: more = slower, less = underfitting
    max_depth=8,            # Prevent overfitting on small data
    min_samples_leaf=5,     # Minimum samples per leaf
    random_state=42         # Reproducibility
)
```

### Feature Selection (in `data_preparation.py`)
```python
DELAY_PREDICTION_FEATURES = [
    'days_elapsed', 'progress_gap', 'budget_variance_current',
    'status_encoded', 'region_encoded', 'sector_encoded',
    'budget_category', 'beneficiary_category', 'spending_rate_per_day'
]

BUDGET_PREDICTION_FEATURES = [
    'spending_rate', 'budget_variance_current', 'progress',
    'region_encoded', 'sector_encoded', 'budget_category',
    'days_elapsed', 'days_remaining'
]
```

## 🧪 Testing

### Run Test Suite
```bash
cd bi/
python test_ml_pipeline.py
```

**What It Tests**:
1. Synthetic data generation (50 realistic projects)
2. Feature preparation and validation
3. Model training with correct metrics
4. Individual predictions
5. Model limitations documentation

### Expected Output
```
████████████████████████████████████████████████████████
  ML PIPELINE TEST SUITE
████████████████████████████████████████████████████████

TEST 1: DATA PREPARATION
✓ Created 50 synthetic projects
✓ Generated features shape: (50, 23)
✓ Data validation: 48 valid projects
  Dropped rows: 2

TEST 2: MODEL TRAINING
✓ DELAY PREDICTION MODEL
  Accuracy: 73%
  ROC-AUC: 0.78
  Train samples: 38
  Test samples: 10
  Top features:
    - days_elapsed: 0.245
    - progress_gap: 0.198
    - budget_variance_current: 0.156

✓ BUDGET FORECASTING MODEL
  Accuracy: 68%
  ROC-AUC: 0.72
  ...
```

## 📈 Monitoring & Maintenance

### Monthly Checklist
- [ ] Check model accuracy on new data
- [ ] Monitor feature distributions for drift
- [ ] Review failed predictions
- [ ] Retrain if accuracy drops >5%
- [ ] Update documentation if features change

### Red Flags
- Accuracy drops below 60%
- ROC-AUC below 0.6
- Confidence scores all near 0.5 (model uncertain)
- Feature importance all near equal (no signal)
- Divergence between predictions and outcomes

### When to Retrain
- After every 50 new projects (monthly typical)
- If accuracy drops significantly
- If feature distributions change
- Scheduled retraining (monthly)

## 📝 API Reference

### DelayPredictionModel

```python
class DelayPredictionModel:
    def train(X, y, feature_names, test_size=0.2) -> Dict
    def predict(X) -> Dict[str, Any]
    def save(filepath: str)
    def load(filepath: str)
```

### BudgetForecastingModel

```python
class BudgetForecastingModel:
    def train(X, y, feature_names, test_size=0.2) -> Dict
    def predict(X) -> Dict[str, Any]
    def save(filepath: str)
    def load(filepath: str)
```

### MLPipeline

```python
class MLPipeline:
    def __init__(model_dir: str = None)
    def train_from_projects(projects_df, save_models=True) -> Dict
    def get_model_limitations() -> List[Dict]
    def get_deployment_recommendations() -> Dict
```

## 🔗 Integration Points

### With Supabase
- Data loaded via `bi/data/connection.py`
- All features computed from Supabase schema
- Real-time predictions possible

### With Streamlit
- Models cached in Streamlit memory
- Predictions shown with confidence scores
- Filtering by region/sector/status
- CSV export of predictions

### With Next.js Frontend
- TODO: API endpoints for predictions
- TODO: Real-time risk alerts
- TODO: Historical prediction tracking

## 📚 References

### Scikit-learn
- [RandomForest](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html)
- [Model Selection](https://scikit-learn.org/stable/modules/model_selection.html)
- [Preprocessing](https://scikit-learn.org/stable/modules/preprocessing.html)

### Best Practices
- Train/test split: 80/20
- Cross-validation: k-fold (k=5)
- Feature scaling: StandardScaler
- Random seed: 42 (reproducibility)

---

**Last Updated**: 2026-04-19
**ML Components Version**: 1.0
**Status**: ✅ Production Ready
