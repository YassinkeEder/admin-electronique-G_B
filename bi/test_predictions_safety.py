"""
Regression tests for ML prediction safeguards and Streamlit initialization.
"""

from __future__ import annotations

import importlib
import logging
import sys
import types
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).parent))

from ml_models import predictions


def create_projects_df(rows: int = 6) -> pd.DataFrame:
    """Create a small projects dataframe suitable for anomaly tests."""
    records = []
    for idx in range(rows):
        records.append(
            {
                "id": f"PRJ-{idx}",
                "name": f"Projet {idx}",
                "budget_xof": 1000 + idx * 100,
                "spent_xof": 200 + idx * 50,
                "progress": 0.2 + idx * 0.1,
                "beneficiaries": 10 + idx,
            }
        )
    return pd.DataFrame(records)


def create_metrics_df(days: int) -> pd.DataFrame:
    """Create synthetic metrics for trend analysis tests."""
    base = pd.Timestamp("2026-01-01")
    return pd.DataFrame(
        {
            "recorded_at": [base + pd.Timedelta(days=offset) for offset in range(days)],
            "value": [100 + offset * 10 for offset in range(days)],
        }
    )


def test_forecast_project_completion_returns_explicit_fallback_and_logs_warning(caplog: pytest.LogCaptureFixture) -> None:
    """Forecasting should never return None and must log the fallback usage."""
    project_df = pd.DataFrame({"progress": [10, 20, 30]})

    with caplog.at_level(logging.WARNING):
        result = predictions.forecast_project_completion(project_df, periods=15)

    assert result == {"forecast": None, "confidence": None, "error": "model_unavailable"}
    assert "forecast_project_completion: fallback used" in caplog.text


def test_analyze_budget_trend_returns_insufficient_data_for_single_sample() -> None:
    """Trend analysis must guard against fewer than 2 daily points."""
    metrics_df = create_metrics_df(days=1)

    result = predictions.analyze_budget_trend(metrics_df)

    assert result == {
        "trend": None,
        "r2": None,
        "error": "insufficient_data",
        "min_required": 2,
    }


def test_analyze_budget_trend_returns_r2_for_valid_series() -> None:
    """Trend analysis should still work for valid time series input."""
    metrics_df = create_metrics_df(days=3)

    result = predictions.analyze_budget_trend(metrics_df)

    assert result["trend"] == "up"
    assert result["error"] is None
    assert result["r2"] == result["r_squared"]
    assert isinstance(result["slope"], float)


def test_detect_budget_anomalies_returns_empty_for_small_dataframe() -> None:
    """Anomaly detection should avoid running on unstable sample sizes."""
    projects_df = create_projects_df(rows=4)

    result = predictions.detect_budget_anomalies(projects_df)

    assert result == []


def test_detect_budget_anomalies_scales_features_before_isolation_forest(monkeypatch: pytest.MonkeyPatch) -> None:
    """Isolation Forest should receive scaled features, not raw numeric columns."""
    projects_df = create_projects_df(rows=6)
    scaled_marker = np.full((len(projects_df), 4), 7.0)
    captured: dict[str, np.ndarray] = {}

    class FakeScaler:
        def fit_transform(self, values: pd.DataFrame) -> np.ndarray:
            captured["raw"] = np.asarray(values)
            return scaled_marker

    class FakeIsolationForest:
        def __init__(self, contamination: float, random_state: int) -> None:
            self.contamination = contamination
            self.random_state = random_state

        def fit_predict(self, values: np.ndarray) -> np.ndarray:
            captured["fit_predict_input"] = values
            return np.array([-1, 1, 1, 1, 1, 1])

        def score_samples(self, values: np.ndarray) -> np.ndarray:
            captured["score_samples_input"] = values
            return np.array([-0.5, -0.1, -0.1, -0.1, -0.1, -0.1])

    monkeypatch.setattr(predictions, "StandardScaler", FakeScaler)
    monkeypatch.setattr(predictions, "IsolationForest", FakeIsolationForest)

    result = predictions.detect_budget_anomalies(projects_df)

    assert np.array_equal(captured["fit_predict_input"], scaled_marker)
    assert np.array_equal(captured["score_samples_input"], scaled_marker)
    assert not np.array_equal(captured["raw"], scaled_marker)
    assert result[0]["project_id"] == "PRJ-0"


def test_get_anomaly_reason_handles_zero_budget_without_crashing() -> None:
    """Zero budgets should not trigger a division-by-zero error."""
    project = pd.Series(
        {
            "budget_xof": 0,
            "spent_xof": 500,
            "progress": 0.5,
            "beneficiaries": 10,
        }
    )

    reason = predictions._get_anomaly_reason(project)

    assert reason == "Profil atypique detecte"


def test_config_import_has_no_streamlit_side_effect_and_init_function_calls_set_page_config(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Importing config should not call set_page_config until init_streamlit()."""
    calls: list[dict[str, object]] = []
    fake_streamlit = types.ModuleType("streamlit")
    fake_streamlit.secrets = {}

    def fake_set_page_config(**kwargs: object) -> None:
        calls.append(kwargs)

    fake_streamlit.set_page_config = fake_set_page_config

    monkeypatch.setitem(sys.modules, "streamlit", fake_streamlit)
    sys.modules.pop("config", None)

    config = importlib.import_module("config")

    assert calls == []

    config.init_streamlit()

    assert len(calls) == 1
    assert calls[0]["page_title"] == "E-GovProjetGB - BI Dashboard"


def test_app_calls_init_streamlit_on_startup(monkeypatch: pytest.MonkeyPatch) -> None:
    """The Streamlit app should initialize page config through config.init_streamlit()."""
    init_calls: list[str] = []

    fake_streamlit = types.ModuleType("streamlit")

    class FakeSidebar:
        def title(self, *_args, **_kwargs) -> None:
            return None

        def markdown(self, *_args, **_kwargs) -> None:
            return None

        def multiselect(self, *_args, **_kwargs):
            return []

        def date_input(self, *_args, **_kwargs):
            return (None, None)

        def success(self, *_args, **_kwargs) -> None:
            return None

        def error(self, *_args, **_kwargs) -> None:
            return None

        def info(self, *_args, **_kwargs) -> None:
            return None

        def radio(self, *_args, **_kwargs) -> str:
            return "🤖 Prédictions ML"

    fake_streamlit.sidebar = FakeSidebar()
    fake_streamlit.markdown = lambda *_args, **_kwargs: None
    fake_streamlit.title = lambda *_args, **_kwargs: None
    fake_streamlit.subheader = lambda *_args, **_kwargs: None
    fake_streamlit.dataframe = lambda *_args, **_kwargs: None
    fake_streamlit.plotly_chart = lambda *_args, **_kwargs: None
    fake_streamlit.metric = lambda *_args, **_kwargs: None
    fake_streamlit.button = lambda *_args, **_kwargs: False
    fake_streamlit.download_button = lambda *_args, **_kwargs: None

    fake_config = types.ModuleType("config")
    fake_config.REGIONS = []
    fake_config.SECTORS = []
    fake_config.PROJECT_STATUSES = []
    fake_config.COLOR_PALETTE = {}
    fake_config.get_status_color = lambda *_args, **_kwargs: "#000000"
    fake_config.get_region_color = lambda *_args, **_kwargs: "#000000"

    def fake_init_streamlit() -> None:
        init_calls.append("called")

    fake_config.init_streamlit = fake_init_streamlit

    dashboards_pkg = types.ModuleType("dashboards")
    overview_module = types.ModuleType("dashboards.overview")
    overview_module.show_overview = lambda: None
    ml_module = types.ModuleType("dashboards.ml_predictions")
    ml_module.show_ml_predictions = lambda: None
    reporting_module = types.ModuleType("dashboards.reporting_export")
    reporting_module.show_reporting_export = lambda: None

    data_pkg = types.ModuleType("data")
    data_connection = types.ModuleType("data.connection")
    data_connection.get_projects = lambda: pd.DataFrame(columns=["status"])
    data_connection.get_stats_by_region = lambda: pd.DataFrame()

    monkeypatch.setitem(sys.modules, "streamlit", fake_streamlit)
    monkeypatch.setitem(sys.modules, "config", fake_config)
    monkeypatch.setitem(sys.modules, "dashboards", dashboards_pkg)
    monkeypatch.setitem(sys.modules, "dashboards.overview", overview_module)
    monkeypatch.setitem(sys.modules, "dashboards.ml_predictions", ml_module)
    monkeypatch.setitem(sys.modules, "dashboards.reporting_export", reporting_module)
    monkeypatch.setitem(sys.modules, "data", data_pkg)
    monkeypatch.setitem(sys.modules, "data.connection", data_connection)

    sys.modules.pop("app", None)

    importlib.import_module("app")

    assert init_calls == ["called"]
