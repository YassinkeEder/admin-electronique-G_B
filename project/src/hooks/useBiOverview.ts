import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { apiGet } from '../lib/api'
import type { Metric, Project, StrategicAxis, ProjectRegion, ProjectSector } from '../types'

export interface MlRiskProject {
  id: string
  name: string
  status: string
  region: string
  sector: string
  strategic_axis?: string | null
  progress: number
  delay_probability: number
  delay_risk: string
  budget_probability: number
  budget_risk: string
  budget_usage_pct: number
  model_used: string
}

export interface MlRiskSummary {
  projects: MlRiskProject[]
  summary: {
    total: number
    high_delay_risk: number
    high_budget_risk: number
    critical_projects: number
  }
  metadata: {
    service: string
    models_trained: boolean
    trained_on_n_projects: number
  }
}

interface BiOverviewResponse {
  projects: Project[]
  metrics: Metric[]
  risk_summary: MlRiskSummary | null
  ml_status: 'ok' | 'degraded'
}

interface BiOverviewFilters {
  region?: ProjectRegion | ''
  sector?: ProjectSector | ''
  strategic_axis?: StrategicAxis | ''
}

export function useBiOverview(filters: BiOverviewFilters) {
  const { session } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [riskSummary, setRiskSummary] = useState<MlRiskSummary | null>(null)
  const [mlStatus, setMlStatus] = useState<'ok' | 'degraded'>('ok')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverview = useCallback(async () => {
    if (!session?.access_token) {
      setError('Session utilisateur introuvable.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const query = new URLSearchParams()
      if (filters.region) query.set('region', filters.region)
      if (filters.sector) query.set('sector', filters.sector)
      if (filters.strategic_axis) query.set('strategic_axis', filters.strategic_axis)

      const suffix = query.toString() ? `?${query.toString()}` : ''
      const response = await apiGet<BiOverviewResponse>(`/api/bi/overview${suffix}`, session.access_token)

      setProjects(response.projects)
      setMetrics(response.metrics)
      setRiskSummary(response.risk_summary)
      setMlStatus(response.ml_status)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les données BI.')
    } finally {
      setLoading(false)
    }
  }, [filters.region, filters.sector, filters.strategic_axis, session?.access_token])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  return {
    projects,
    metrics,
    riskSummary,
    mlStatus,
    loading,
    error,
    refetch: fetchOverview,
  }
}
