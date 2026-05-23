import prisma from '../../../lib/prisma'

export interface BiProjectFilters {
  status?: string
  region?: string
  sector?: string
  strategicAxis?: string
  isPublic?: boolean
  search?: string
}

export interface ApiProject {
  id: string
  name: string
  description: string
  budget_xof: number
  spent_xof: number
  start_date: string
  end_date: string
  status: string
  region: string
  sector: string
  strategic_axis: string | null
  is_public: boolean
  progress: number
  beneficiaries: number
  created_by: string | null
  updated_by: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface ApiMetric {
  id: string
  project_id: string
  kpi_type: string
  value: number
  unit: string
  target_value: number
  period_label: string
  recorded_at: string
}

function mapProject(project: any): ApiProject {
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? '',
    budget_xof: Number(project.budgetXof ?? 0),
    spent_xof: Number(project.spentXof ?? 0),
    start_date: new Date(project.startDate).toISOString(),
    end_date: new Date(project.endDate).toISOString(),
    status: project.status,
    region: project.region,
    sector: project.sector,
    strategic_axis: project.strategicAxis ?? null,
    is_public: Boolean(project.isPublic),
    progress: Number(project.progress ?? 0),
    beneficiaries: Number(project.beneficiaries ?? 0),
    created_by: project.createdBy ?? null,
    updated_by: project.updatedBy ?? null,
    is_archived: Boolean(project.isArchived),
    created_at: new Date(project.createdAt).toISOString(),
    updated_at: new Date(project.updatedAt).toISOString(),
  }
}

function mapMetric(metric: any): ApiMetric {
  return {
    id: metric.id,
    project_id: metric.projectId,
    kpi_type: metric.kpiType,
    value: Number(metric.value),
    unit: metric.unit,
    target_value: Number(metric.targetValue),
    period_label: metric.periodLabel,
    recorded_at: new Date(metric.recordedAt).toISOString(),
  }
}

export async function listProjects(filters: BiProjectFilters = {}): Promise<ApiProject[]> {
  const where: any = { isArchived: false }

  if (filters.status) where.status = filters.status
  if (filters.region) where.region = filters.region
  if (filters.sector) where.sector = filters.sector
  if (filters.strategicAxis) where.strategicAxis = filters.strategicAxis
  if (typeof filters.isPublic === 'boolean') where.isPublic = filters.isPublic
  if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  } as any) as any[]

  return projects.map(mapProject)
}

export async function listMetrics(projectIds?: string[]): Promise<ApiMetric[]> {
  const where: any = {}
  if (projectIds && projectIds.length > 0) {
    where.projectId = { in: projectIds }
  }

  const metrics = await prisma.metric.findMany({
    where,
    orderBy: { recordedAt: 'desc' },
    take: 5000,
  } as any) as any[]

  return metrics.map(mapMetric)
}
