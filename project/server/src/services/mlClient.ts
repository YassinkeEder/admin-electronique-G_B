export interface MlProjectPayload {
  id: string
  name: string
  status: string
  region: string
  sector: string
  strategic_axis?: string | null
  progress: number
  budget_xof: number
  spent_xof: number
  beneficiaries: number
  start_date: string
  end_date: string
}

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

export interface MlRiskSummaryResponse {
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

const ML_API_URL = (process.env.ML_API_URL || 'http://localhost:8001').replace(/\/$/, '')

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)

  try {
    const response = await fetch(`${ML_API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`ML API error ${response.status}: ${text}`)
    }

    return await response.json() as TResponse
  } finally {
    clearTimeout(timeout)
  }
}

export async function requestMlRiskSummary(projects: MlProjectPayload[]): Promise<MlRiskSummaryResponse> {
  return postJson<MlRiskSummaryResponse>('/predict/risk-summary', { projects })
}

export async function requestMlDelayPrediction(project: MlProjectPayload) {
  return postJson('/predict/delay', project)
}

export async function requestMlBudgetPrediction(project: MlProjectPayload) {
  return postJson('/predict/budget', project)
}
