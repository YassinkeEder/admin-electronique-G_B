from __future__ import annotations

import logging
import os
import sys
from datetime import date, datetime
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import pandas as pd
from pydantic import BaseModel, Field, field_validator
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

BI_DIR = os.path.dirname(os.path.abspath(__file__))
if BI_DIR not in sys.path:
    sys.path.insert(0, BI_DIR)

from ml_models.data_preparation import get_training_data
from ml_models.models import BudgetForecastingModel, DelayPredictionModel

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

DATABASE_URL = os.getenv("DATABASE_URL", "")

app = FastAPI(
    title="E-GovProjetGB ML API",
    description="Prediction service for delay and budget risk.",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

_db_conn: psycopg2.extensions.connection | None = None
_delay_model = DelayPredictionModel()
_budget_model = BudgetForecastingModel()
_models_trained = False
_trained_on_n_projects = 0


def get_db() -> psycopg2.extensions.connection:
    global _db_conn
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is required to bootstrap ML training.")

    try:
        if _db_conn is None or _db_conn.closed:
            _db_conn = psycopg2.connect(DATABASE_URL)
        with _db_conn.cursor() as cursor:
            cursor.execute("SELECT 1")
        return _db_conn
    except psycopg2.Error:
        _db_conn = psycopg2.connect(DATABASE_URL)
        return _db_conn


def fetch_projects_df() -> pd.DataFrame:
    conn = get_db()
    query = """
        SELECT id, name, region, sector, status,
               budget_xof, spent_xof, progress, beneficiaries,
               start_date, end_date, created_at, updated_at
        FROM projects
        WHERE is_archived = false
        ORDER BY created_at DESC
        LIMIT 5000
    """
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(query)
        rows = cursor.fetchall()

    df = pd.DataFrame(rows)
    if df.empty:
        return df

    for column in ["start_date", "end_date", "created_at", "updated_at"]:
        if column in df.columns:
            df[column] = pd.to_datetime(df[column], errors="coerce")
    for column in ["budget_xof", "spent_xof"]:
        if column in df.columns:
            df[column] = df[column].astype(float)

    return df


def ensure_models_trained() -> None:
    global _models_trained, _trained_on_n_projects

    if _models_trained:
        return

    if not DATABASE_URL:
        logger.warning("DATABASE_URL missing, ML service will use rules-based fallback.")
        return

    try:
        df = fetch_projects_df()
        _trained_on_n_projects = len(df)

        if _trained_on_n_projects < 10:
            logger.warning("Not enough training data (%s projects).", _trained_on_n_projects)
            return

        x_delay, y_delay, delay_features = get_training_data(df, target="delay")
        x_budget, y_budget, budget_features = get_training_data(df, target="budget")

        if len(x_delay) >= 10 and len(np.unique(y_delay)) > 1:
            _delay_model.train(x_delay, y_delay, feature_names=delay_features)
        if len(x_budget) >= 10 and len(np.unique(y_budget)) > 1:
            _budget_model.train(x_budget, y_budget, feature_names=budget_features)

        _models_trained = _delay_model.is_trained or _budget_model.is_trained
    except Exception as exc:
        logger.exception("ML training bootstrap failed: %s", exc)


def normalize_project_payload(raw: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(raw)
    for field in ("budget_xof", "spent_xof", "progress", "beneficiaries"):
        if normalized.get(field) is not None:
            normalized[field] = float(normalized[field])
    return normalized


def risk_level(probability: float) -> str:
    if probability >= 0.75:
        return "critical"
    if probability >= 0.50:
        return "high"
    if probability >= 0.30:
        return "medium"
    return "low"


def rules_based_delay(row: dict[str, Any]) -> dict[str, Any]:
    today = datetime.now().date()
    start = pd.to_datetime(row.get("start_date")).date() if row.get("start_date") else today
    end = pd.to_datetime(row.get("end_date")).date() if row.get("end_date") else today

    total_days = max((end - start).days, 1)
    elapsed_days = max((today - start).days, 0)
    remaining_days = max((end - today).days, 0)
    time_pct = min(elapsed_days / total_days, 1.0) * 100
    progress = float(row.get("progress", 0))
    progress_gap = time_pct - progress

    if end < today and str(row.get("status", "")) not in ("COMPLETED", "CANCELLED"):
        probability = 0.95
    elif progress_gap > 30:
        probability = 0.85
    elif progress_gap > 15:
        probability = 0.65
    elif progress_gap > 5:
        probability = 0.45
    else:
        probability = 0.15

    return {
        "will_be_late": probability >= 0.5,
        "probability": probability,
        "confidence": 0.70,
        "days_remaining": remaining_days,
        "progress_gap": round(progress_gap, 1),
    }


def row_to_delay_features(row: dict[str, Any]) -> np.ndarray:
    today = datetime.now().date()
    start = pd.to_datetime(row.get("start_date")).date() if row.get("start_date") else today
    end = pd.to_datetime(row.get("end_date")).date() if row.get("end_date") else today

    total_days = max((end - start).days, 1)
    elapsed_days = max((today - start).days, 0)
    progress = float(row.get("progress", 0))
    budget_xof = float(row.get("budget_xof", 1) or 1)
    spent_xof = float(row.get("spent_xof", 0) or 0)
    beneficiaries = float(row.get("beneficiaries", 0) or 0)

    progress_ratio = progress / 100
    expected_progress_ratio = min(elapsed_days / total_days, 1.0)
    progress_gap = progress_ratio - expected_progress_ratio
    budget_variance_current = ((spent_xof - budget_xof) / budget_xof * 100) if budget_xof > 0 else 0
    spending_rate = spent_xof / max(elapsed_days, 1)
    beneficiary_impact = beneficiaries / budget_xof if budget_xof > 0 else 0

    return np.array([
        elapsed_days,
        progress_ratio,
        expected_progress_ratio,
        progress_gap,
        budget_variance_current,
        spending_rate,
        0,
        0,
        beneficiary_impact,
    ])


def row_to_budget_features(row: dict[str, Any]) -> np.ndarray:
    today = datetime.now().date()
    start = pd.to_datetime(row.get("start_date")).date() if row.get("start_date") else today
    end = pd.to_datetime(row.get("end_date")).date() if row.get("end_date") else today

    total_days = max((end - start).days, 1)
    elapsed_days = max((today - start).days, 0)
    budget_xof = float(row.get("budget_xof", 1) or 1)
    spent_xof = float(row.get("spent_xof", 0) or 0)
    progress = float(row.get("progress", 0))

    budget_utilization = min(spent_xof / budget_xof, 2.0) if budget_xof > 0 else 0
    spending_rate = spent_xof / max(elapsed_days, 1)
    project_size_log = np.log1p(budget_xof)

    return np.array([
        elapsed_days,
        total_days,
        spending_rate,
        budget_utilization,
        progress / 100,
        project_size_log,
        0,
        0,
    ])


def predict_delay_from_row(row: dict[str, Any]) -> dict[str, Any]:
    ensure_models_trained()

    if _delay_model.is_trained:
        try:
            features = row_to_delay_features(row)
            prediction = _delay_model.predict(features)
            today = datetime.now().date()
            start = pd.to_datetime(row.get("start_date")).date() if row.get("start_date") else today
            end = pd.to_datetime(row.get("end_date")).date() if row.get("end_date") else today
            total_days = max((end - start).days, 1)
            elapsed_days = max((today - start).days, 0)
            time_pct = min(elapsed_days / total_days, 1.0) * 100
            prediction["days_remaining"] = max((end - today).days, 0)
            prediction["progress_gap"] = round(time_pct - float(row.get("progress", 0)), 1)
            prediction["model_used"] = "random_forest"
            return prediction
        except Exception as exc:
            logger.warning("Delay model fallback used: %s", exc)

    prediction = rules_based_delay(row)
    prediction["model_used"] = "rules_based"
    return prediction


def predict_budget_from_row(row: dict[str, Any]) -> dict[str, Any]:
    ensure_models_trained()

    budget_xof = float(row.get("budget_xof", 1) or 1)
    spent_xof = float(row.get("spent_xof", 0) or 0)
    progress = float(row.get("progress", 0) or 0)
    usage_pct = spent_xof / max(budget_xof, 1)

    if _budget_model.is_trained:
        try:
            features = row_to_budget_features(row)
            prediction = _budget_model.predict(features)
            prediction["model_used"] = "random_forest"
            prediction["budget_usage_pct"] = round(usage_pct * 100, 1)
            prediction["projected_final_spend"] = round(spent_xof / (progress / 100), 2) if progress > 0 else None
            return prediction
        except Exception as exc:
            logger.warning("Budget model fallback used: %s", exc)

    probability = 0.95 if usage_pct >= 1 else 0.80 if usage_pct >= 0.9 else 0.55 if usage_pct >= 0.7 else 0.20
    return {
        "will_overrun": probability >= 0.5,
        "probability": probability,
        "confidence": 0.70,
        "budget_usage_pct": round(usage_pct * 100, 1),
        "projected_final_spend": round(spent_xof / (progress / 100), 2) if progress > 0 else None,
        "model_used": "rules_based",
    }


class ProjectPayload(BaseModel):
    id: str | None = None
    name: str = ""
    status: str | None = None
    region: str | None = None
    sector: str | None = None
    strategic_axis: str | None = None
    progress: float = Field(0, ge=0, le=100)
    budget_xof: float = Field(0, ge=0)
    spent_xof: float = Field(0, ge=0)
    beneficiaries: float = Field(0, ge=0)
    start_date: date | None = None
    end_date: date | None = None

    @field_validator("end_date")
    @classmethod
    def validate_dates(cls, end_date: date | None, info):
        start_date = info.data.get("start_date")
        if end_date and start_date and end_date < start_date:
            raise ValueError("end_date must be after start_date")
        return end_date


class DelayPredictResponse(BaseModel):
    project_id: str | None
    will_be_late: bool
    probability: float
    confidence: float
    risk_level: str
    days_remaining: int | None
    progress_gap: float | None
    model_used: str
    trained_on_n_projects: int


class BudgetPredictResponse(BaseModel):
    project_id: str | None
    will_overrun: bool
    probability: float
    confidence: float
    risk_level: str
    budget_usage_pct: float
    projected_final_spend: float | None
    model_used: str
    trained_on_n_projects: int


class RiskSummaryRequest(BaseModel):
    projects: list[ProjectPayload]


class RiskSummaryProject(BaseModel):
    id: str | None
    name: str
    status: str | None
    region: str | None
    sector: str | None
    strategic_axis: str | None
    progress: float
    delay_probability: float
    delay_risk: str
    budget_probability: float
    budget_risk: str
    budget_usage_pct: float
    model_used: str


class RiskSummaryResponse(BaseModel):
    projects: list[RiskSummaryProject]
    summary: dict[str, int]
    metadata: dict[str, Any]


class HealthResponse(BaseModel):
    status: str
    db_connected: bool
    models_trained: bool
    n_projects: int
    timestamp: str


@app.get("/health", response_model=HealthResponse, tags=["Monitoring"])
async def health_check():
    db_connected = False
    project_count = 0
    try:
      if DATABASE_URL:
          df = fetch_projects_df()
          db_connected = True
          project_count = len(df)
    except Exception as exc:
      logger.warning("ML health DB check failed: %s", exc)

    return HealthResponse(
        status="ok" if db_connected or _models_trained else "degraded",
        db_connected=db_connected,
        models_trained=_models_trained,
        n_projects=project_count,
        timestamp=datetime.now().isoformat(),
    )


@app.post("/predict/delay", response_model=DelayPredictResponse, tags=["Predictions"])
async def predict_delay(project: ProjectPayload):
    row = normalize_project_payload(project.model_dump(exclude_none=True))
    if row.get("start_date") is None or row.get("end_date") is None:
        raise HTTPException(status_code=422, detail="start_date and end_date are required")

    prediction = predict_delay_from_row(row)
    probability = float(prediction["probability"])

    return DelayPredictResponse(
        project_id=row.get("id"),
        will_be_late=bool(prediction["will_be_late"]),
        probability=round(probability, 3),
        confidence=round(float(prediction.get("confidence", 0.70)), 3),
        risk_level=risk_level(probability),
        days_remaining=prediction.get("days_remaining"),
        progress_gap=prediction.get("progress_gap"),
        model_used=str(prediction["model_used"]),
        trained_on_n_projects=_trained_on_n_projects,
    )


@app.post("/predict/budget", response_model=BudgetPredictResponse, tags=["Predictions"])
async def predict_budget(project: ProjectPayload):
    row = normalize_project_payload(project.model_dump(exclude_none=True))
    prediction = predict_budget_from_row(row)
    probability = float(prediction["probability"])

    return BudgetPredictResponse(
        project_id=row.get("id"),
        will_overrun=bool(prediction["will_overrun"]),
        probability=round(probability, 3),
        confidence=round(float(prediction.get("confidence", 0.70)), 3),
        risk_level=risk_level(probability),
        budget_usage_pct=float(prediction["budget_usage_pct"]),
        projected_final_spend=prediction.get("projected_final_spend"),
        model_used=str(prediction["model_used"]),
        trained_on_n_projects=_trained_on_n_projects,
    )


@app.post("/predict/risk-summary", response_model=RiskSummaryResponse, tags=["Dashboard"])
async def predict_risk_summary(body: RiskSummaryRequest):
    ensure_models_trained()

    results: list[RiskSummaryProject] = []
    for project in body.projects:
        row = normalize_project_payload(project.model_dump(exclude_none=True))
        delay_prediction = predict_delay_from_row(row)
        budget_prediction = predict_budget_from_row(row)

        model_used = "random_forest" if (
            delay_prediction.get("model_used") == "random_forest"
            or budget_prediction.get("model_used") == "random_forest"
        ) else "rules_based"

        results.append(
            RiskSummaryProject(
                id=row.get("id"),
                name=row.get("name", ""),
                status=row.get("status"),
                region=row.get("region"),
                sector=row.get("sector"),
                strategic_axis=row.get("strategic_axis"),
                progress=float(row.get("progress", 0)),
                delay_probability=round(float(delay_prediction["probability"]), 3),
                delay_risk=risk_level(float(delay_prediction["probability"])),
                budget_probability=round(float(budget_prediction["probability"]), 3),
                budget_risk=risk_level(float(budget_prediction["probability"])),
                budget_usage_pct=float(budget_prediction["budget_usage_pct"]),
                model_used=model_used,
            )
        )

    return RiskSummaryResponse(
        projects=results,
        summary={
            "total": len(results),
            "high_delay_risk": sum(1 for item in results if item.delay_probability >= 0.5),
            "high_budget_risk": sum(1 for item in results if item.budget_probability >= 0.5),
            "critical_projects": sum(
                1 for item in results
                if item.delay_probability >= 0.75 or item.budget_probability >= 0.75
            ),
        },
        metadata={
            "service": "python-ml",
            "models_trained": _models_trained,
            "trained_on_n_projects": _trained_on_n_projects,
        },
    )
