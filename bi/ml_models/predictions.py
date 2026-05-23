"""
ML Models Module - predictions and advanced analysis.
"""

from typing import Any, Dict, List
import logging

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


# ============================================================================
# FORECASTING - Predict project completion
# ============================================================================

def forecast_project_completion(project_df: pd.DataFrame, periods: int = 30) -> Dict[str, Any]:
    """
    Predict a project completion outcome from historical progress data.

    Return format is always:
    {
        "forecast": Any | None,
        "confidence": Any | None,
        "error": str | None,
    }

    When no forecasting model is available, or if the forecasting block raises,
    the function returns the explicit fallback:
    {
        "forecast": None,
        "confidence": None,
        "error": "model_unavailable",
    }
    """
    if project_df.empty or "progress" not in project_df.columns:
        return {"forecast": None, "confidence": None, "error": "invalid_input"}

    try:
        # TODO: Implement with Prophet or another forecasting model.
        # Kept inside try/except so future model code cannot crash callers.
        _ = periods
    except Exception as exc:
        logger.exception("Forecast error: %s", exc)

    logging.warning("forecast_project_completion: fallback used")
    return {"forecast": None, "confidence": None, "error": "model_unavailable"}


# ============================================================================
# CLUSTERING - Group similar regions
# ============================================================================

def cluster_regions(stats_by_region: pd.DataFrame, n_clusters: int = 3) -> Dict[str, Any]:
    """
    K-means clustering on regional statistics.

    Features: project_count, total_budget, avg_progress
    Useful for recommendations and comparison across regions.
    """
    if stats_by_region.empty or len(stats_by_region) < n_clusters:
        return {"clusters": {}, "error": "Insufficient data"}

    try:
        features = ["project_count", "total_budget", "avg_progress"]
        x = stats_by_region[features].fillna(0)

        scaler = StandardScaler()
        x_scaled = scaler.fit_transform(x)

        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        clusters = kmeans.fit_predict(x_scaled)

        result_df = stats_by_region.copy()
        result_df["cluster"] = clusters

        return {
            "clusters": result_df.to_dict("records"),
            "centers": scaler.inverse_transform(kmeans.cluster_centers_).tolist(),
            "inertia": kmeans.inertia_,
        }
    except Exception as exc:
        logger.error("Clustering error: %s", exc)
        return {"clusters": {}, "error": str(exc)}


# ============================================================================
# ANOMALY DETECTION - Detect suspicious budget patterns
# ============================================================================

def detect_budget_anomalies(projects_df: pd.DataFrame, contamination: float = 0.1) -> List[Dict[str, Any]]:
    """
    Detect anomalous projects with Isolation Forest.

    Requires at least 5 rows to avoid unstable anomaly detection results.
    """
    if projects_df.empty or len(projects_df) < 5:
        return []

    try:
        features = ["budget_xof", "spent_xof", "progress", "beneficiaries"]
        df_features = projects_df[features].fillna(0)

        scaler = StandardScaler()
        df_features_scaled = scaler.fit_transform(df_features)

        iso_forest = IsolationForest(
            contamination=contamination,
            random_state=42,
        )
        anomalies = iso_forest.fit_predict(df_features_scaled)
        anomaly_scores = iso_forest.score_samples(df_features_scaled)

        result: List[Dict[str, Any]] = []
        for idx, (is_anomaly, score) in enumerate(zip(anomalies, anomaly_scores)):
            if is_anomaly == -1:
                project = projects_df.iloc[idx]
                result.append(
                    {
                        "project_id": project.get("id"),
                        "project_name": project.get("name"),
                        "anomaly_score": float(score),
                        "reason": _get_anomaly_reason(project),
                    }
                )

        return sorted(result, key=lambda item: item["anomaly_score"])
    except Exception as exc:
        logger.error("Anomaly detection error: %s", exc)
        return []


def _get_anomaly_reason(project: pd.Series) -> str:
    """Explain why a project is considered anomalous."""
    budget = project.get("budget_xof", 0)
    spent = project.get("spent_xof", 0)
    progress = project.get("progress", 0)
    beneficiaries = project.get("beneficiaries", 0)

    if pd.isna(budget) or budget <= 0:
        budget_util = 0
    else:
        spent_value = 0 if pd.isna(spent) else spent
        budget_util = spent_value / budget

    if budget_util > 1.2:
        return "Depassement budget > 20%"
    if not pd.isna(progress) and progress < 0.1:
        return "Avancement tres faible"
    if pd.isna(beneficiaries) or beneficiaries == 0:
        return "Pas de beneficiaires"
    return "Profil atypique detecte"


# ============================================================================
# RECOMMENDATION ENGINE - Action recommendations
# ============================================================================

def get_recommendations(projects_df: pd.DataFrame, stats_dict: Dict[str, Any]) -> List[str]:
    """
    Generate recommendations based on ML-oriented analysis outputs.
    """
    _ = projects_df
    recommendations: List[str] = []

    budget_var = stats_dict.get("budget_variance", {})
    if budget_var.get("variance", 0) > 15:
        recommendations.append(
            "BUDGET: Depenses 15%+ au-dessus budget. "
            "Recommendation: reviser estimations ou controler depenses."
        )

    if stats_dict.get("overdue_count", 0) > 3:
        recommendations.append(
            f"TIMELINE: {stats_dict['overdue_count']} projets en retard. "
            "Recommendation: accelerer ou ajuster deadlines."
        )

    roi = stats_dict.get("roi", {})
    if roi.get("status") == "danger":
        recommendations.append(
            "ROI: Retour sur investissement faible. "
            "Recommendation: revoir mix de projets ou allocation budgets."
        )

    efficiency = stats_dict.get("efficiency_score", 0)
    if efficiency < 50:
        recommendations.append(
            f"EFFICACITE: Score {efficiency:.1f}/100. "
            "Recommendation: ameliorer gestion projets (agile, PMO)."
        )

    return recommendations


# ============================================================================
# TIME SERIES ANALYSIS
# ============================================================================

def analyze_budget_trend(metrics_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analyze the time trend of budgets.

    Minimum required sample size: at least 2 daily aggregated observations.
    With fewer than 2 points, scikit-learn's score() call is invalid.
    """
    if metrics_df.empty:
        return {"trend": None, "r2": None, "error": "insufficient_data", "min_required": 2}

    try:
        working_df = metrics_df.copy()
        working_df["recorded_at"] = pd.to_datetime(working_df["recorded_at"])
        daily = working_df.groupby(working_df["recorded_at"].dt.date)["value"].mean()

        if len(daily) < 2:
            return {"trend": None, "r2": None, "error": "insufficient_data", "min_required": 2}

        from sklearn.linear_model import LinearRegression

        x = np.arange(len(daily)).reshape(-1, 1)
        y = daily.values

        model = LinearRegression().fit(x, y)
        slope = float(model.coef_[0])
        r2 = float(model.score(x, y))
        trend = "up" if slope > 0 else ("down" if slope < 0 else "neutral")

        return {
            "trend": trend,
            "slope": slope,
            "r2": r2,
            "r_squared": r2,
            "error": None,
        }
    except Exception as exc:
        logger.error("Trend analysis error: %s", exc)
        return {"trend": None, "r2": None, "error": "analysis_failed"}
