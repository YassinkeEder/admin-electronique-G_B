"""
Centralized configuration for the BI module.
"""

import os

import streamlit as st


# ============================================================================
# STREAMLIT CONFIGURATION
# ============================================================================

def init_streamlit() -> None:
    """Initialize Streamlit page settings at application startup only."""
    st.set_page_config(
        page_title="E-GovProjetGB - BI Dashboard",
        page_icon="📊",
        layout="wide",
        initial_sidebar_state="expanded",
    )


# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

try:
    DATABASE_URL = st.secrets["database"]["url"]
    SUPABASE_URL = st.secrets["database"]["supabase_url"]
    SUPABASE_KEY = st.secrets["database"]["supabase_key"]
except KeyError:
    DATABASE_URL = os.getenv("DATABASE_URL")
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")


# ============================================================================
# QUERY LIMITS & CACHING
# ============================================================================

DEFAULT_LIMIT = 10000
CACHE_TTL = 3600
REFRESH_INTERVAL = 300


# ============================================================================
# BUSINESS CONSTANTS - GUINEA-BISSAU
# ============================================================================

REGIONS = [
    "Bissau",
    "Gabu",
    "Bafata",
    "Cacheu",
    "Oio",
    "Quinara",
    "Tombali",
    "Biombo",
    "Bolama",
]

SECTORS = [
    "Health",
    "Education",
    "Infrastructure",
    "Agriculture",
    "Energy",
    "ICT",
    "Finance",
    "Governance",
    "Environment",
]

PROJECT_STATUSES = [
    "PLANNED",
    "IN_PROGRESS",
    "COMPLETED",
    "SUSPENDED",
    "CANCELLED",
]

TASK_STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"]


# ============================================================================
# COLOR PALETTES
# ============================================================================

COLOR_PALETTE = {
    "primary": "#0066cc",
    "success": "#10b981",
    "warning": "#f59e0b",
    "danger": "#ef4444",
    "info": "#3b82f6",
}

STATUS_COLORS = {
    "PLANNED": "#0066cc",
    "IN_PROGRESS": "#f59e0b",
    "COMPLETED": "#10b981",
    "SUSPENDED": "#f97316",
    "CANCELLED": "#ef4444",
}

REGION_COLORS = {
    "Bissau": "#8b5cf6",
    "Gabu": "#ec4899",
    "Bafata": "#f59e0b",
    "Cacheu": "#10b981",
    "Oio": "#0ea5e9",
    "Quinara": "#6366f1",
    "Tombali": "#14b8a6",
    "Biombo": "#f43f5e",
    "Bolama": "#84cc16",
}


# ============================================================================
# THRESHOLDS & ALERTS
# ============================================================================

BUDGET_ALERT_THRESHOLDS = {
    "critical": 0.90,
    "warning": 0.70,
    "safe": 0.50,
}

DELAY_ALERT_THRESHOLD = 30

COMPLETION_RATE_TARGETS = {
    "Health": 0.80,
    "Education": 0.85,
    "Infrastructure": 0.75,
    "Agriculture": 0.70,
    "Energy": 0.75,
    "ICT": 0.85,
    "Finance": 0.90,
    "Governance": 0.85,
    "Environment": 0.75,
}


# ============================================================================
# LABELS
# ============================================================================

LABELS_FR = {
    "region": "Region",
    "sector": "Secteur",
    "status": "Statut",
    "budget": "Budget (XOF)",
    "spent": "Depense (XOF)",
    "progress": "Avancement (%)",
    "start_date": "Date de debut",
    "end_date": "Date de fin",
    "beneficiaries": "Beneficiaires",
}

SECTOR_EMOJIS = {
    "Health": "🏥",
    "Education": "📚",
    "Infrastructure": "🏗️",
    "Agriculture": "🌾",
    "Energy": "⚡",
    "ICT": "💻",
    "Finance": "💰",
    "Governance": "🏛️",
    "Environment": "🌱",
}


# ============================================================================
# HELPERS
# ============================================================================

def get_status_color(status: str) -> str:
    """Return the color associated with a project status."""
    return STATUS_COLORS.get(status, "#6b7280")


def get_region_color(region: str) -> str:
    """Return the color associated with a region."""
    return REGION_COLORS.get(region, "#9ca3af")


def format_xof(value: float) -> str:
    """Format a numeric value as XOF."""
    return f"₣ {value:,.0f}"


def format_percentage(value: float) -> str:
    """Format a numeric value as a percentage."""
    return f"{value:.1f}%"
