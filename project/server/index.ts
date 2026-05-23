import 'dotenv/config'
import cors from 'cors'
import { randomUUID } from 'crypto'
import express, { Request, Response } from 'express'

import prisma from '../lib/prisma'
import { checkRole } from './src/middleware/checkRole'
import { validate } from './src/middleware/validate'
import { listMetrics, listProjects } from './src/repositories/biRepository'
import { ProjectSchema, TaskSchema, UserSchema } from './src/schemas/validation'
import {
  requestMlBudgetPrediction,
  requestMlDelayPrediction,
  requestMlRiskSummary,
} from './src/services/mlClient'

const app = express()
const PORT = process.env.PORT || 3001
const ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: ORIGIN }))
app.use(express.json())

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined) return undefined
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return undefined
}

app.get('/api/users', async (_req: Request, res: Response) => {
  try {
    const profiles = await prisma.profile.findMany({
      select: { id: true, fullName: true, email: true, role: true, isActive: true },
    })
    res.json(profiles)
  } catch (error) {
    console.error('Error fetching profiles:', error)
    res.status(500).json({ error: 'Failed to fetch profiles' })
  }
})

app.post('/api/users', checkRole(['admin']), validate(UserSchema), async (req: Request, res: Response) => {
  try {
    const { id, email, fullName, role } = req.body
    const profileId = id ?? randomUUID()
    const profile = await prisma.profile.create({
      data: { id: profileId, email, fullName: fullName ?? '', role },
    })
    res.status(201).json(profile)
  } catch (error) {
    console.error('Error creating profile:', error)
    res.status(500).json({ error: 'Failed to create profile' })
  }
})

app.get('/api/projects', checkRole(['admin', 'chef_projet', 'decideur']), async (req: Request, res: Response) => {
  try {
    const projects = await listProjects({
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      region: typeof req.query.region === 'string' ? req.query.region : undefined,
      sector: typeof req.query.sector === 'string' ? req.query.sector : undefined,
      strategicAxis: typeof req.query.strategic_axis === 'string' ? req.query.strategic_axis : undefined,
      isPublic: parseBoolean(req.query.is_public),
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
    })
    res.json(projects)
  } catch (error) {
    console.error('Error listing projects:', error)
    res.status(500).json({ error: 'Failed to list projects' })
  }
})

app.post('/api/projects', checkRole(['admin', 'chef_projet']), validate(ProjectSchema), async (req: Request, res: Response) => {
  try {
    const data = req.body
    const userId = (req as any).user?.id
    const project = await prisma.project.create({
      data: {
        id: data.id ?? undefined,
        name: data.name,
        description: data.description ?? '',
        budgetXof: data.budget_xof !== undefined ? BigInt(Number(data.budget_xof)) : BigInt(0),
        spentXof: data.spent_xof !== undefined ? BigInt(Number(data.spent_xof)) : BigInt(0),
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        status: data.status ?? 'PLANNED',
        region: data.region,
        sector: data.sector,
        strategicAxis: data.strategic_axis ?? 'e_gouvernement',
        isPublic: data.is_public ?? true,
        progress: data.progress ?? 0,
        beneficiaries: data.beneficiaries ?? 0,
        organizationId: data.organization_id ?? null,
        createdBy: userId ?? null,
      } as any,
    } as any)
    res.status(201).json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

app.put('/api/projects/:id', checkRole(['admin', 'chef_projet']), validate(ProjectSchema.partial()), async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    const data = req.body
    const updates: any = {}

    if (data.name) updates.name = data.name
    if (data.description) updates.description = data.description
    if (data.budget_xof !== undefined) updates.budgetXof = BigInt(Number(data.budget_xof))
    if (data.spent_xof !== undefined) updates.spentXof = BigInt(Number(data.spent_xof))
    if (data.start_date) updates.startDate = new Date(data.start_date)
    if (data.end_date) updates.endDate = new Date(data.end_date)
    if (data.status) updates.status = data.status
    if (data.region) updates.region = data.region
    if (data.sector) updates.sector = data.sector
    if (data.strategic_axis) updates.strategicAxis = data.strategic_axis
    if (data.is_public !== undefined) updates.isPublic = data.is_public
    if (data.progress !== undefined) updates.progress = data.progress
    if (data.beneficiaries !== undefined) updates.beneficiaries = data.beneficiaries
    if (data.organization_id !== undefined) updates.organizationId = data.organization_id
    updates.updatedBy = (req as any).user?.id ?? null

    const project = await prisma.project.update({ where: { id }, data: updates } as any)
    res.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    res.status(500).json({ error: 'Failed to update project' })
  }
})

app.delete('/api/projects/:id', checkRole(['admin']), async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    await prisma.project.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting project:', error)
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

app.get('/api/metrics', checkRole(['admin', 'chef_projet', 'decideur']), async (req: Request, res: Response) => {
  try {
    const projectId = Array.isArray(req.query.project_id)
      ? req.query.project_id[0]
      : req.query.project_id
    const projectIds = typeof projectId === 'string' ? [projectId] : undefined
    const metrics = await listMetrics(projectIds)
    res.json(metrics)
  } catch (error) {
    console.error('Error listing metrics:', error)
    res.status(500).json({ error: 'Failed to list metrics' })
  }
})

app.get('/api/bi/overview', checkRole(['admin', 'chef_projet', 'decideur']), async (req: Request, res: Response) => {
  try {
    const projects = await listProjects({
      region: typeof req.query.region === 'string' ? req.query.region : undefined,
      sector: typeof req.query.sector === 'string' ? req.query.sector : undefined,
      strategicAxis: typeof req.query.strategic_axis === 'string' ? req.query.strategic_axis : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
    })
    const metrics = await listMetrics(projects.map(project => project.id))

    let riskSummary = null
    let mlStatus: 'ok' | 'degraded' = 'ok'

    try {
      riskSummary = await requestMlRiskSummary(projects)
    } catch (mlError) {
      mlStatus = 'degraded'
      console.error('ML risk summary error:', mlError)
    }

    res.json({
      projects,
      metrics,
      risk_summary: riskSummary,
      ml_status: mlStatus,
    })
  } catch (error) {
    console.error('Error building BI overview:', error)
    res.status(500).json({ error: 'Failed to build BI overview' })
  }
})

app.post('/api/ml/predict/delay', checkRole(['admin', 'chef_projet', 'decideur']), async (req: Request, res: Response) => {
  try {
    const prediction = await requestMlDelayPrediction(req.body)
    res.json(prediction)
  } catch (error) {
    console.error('Delay prediction proxy error:', error)
    res.status(502).json({ error: 'Failed to get delay prediction' })
  }
})

app.post('/api/ml/predict/budget', checkRole(['admin', 'chef_projet', 'decideur']), async (req: Request, res: Response) => {
  try {
    const prediction = await requestMlBudgetPrediction(req.body)
    res.json(prediction)
  } catch (error) {
    console.error('Budget prediction proxy error:', error)
    res.status(502).json({ error: 'Failed to get budget prediction' })
  }
})

app.post('/api/ml/risk-summary', checkRole(['admin', 'chef_projet', 'decideur']), async (req: Request, res: Response) => {
  try {
    const projects = Array.isArray(req.body?.projects) ? req.body.projects : []
    const summary = await requestMlRiskSummary(projects)
    res.json(summary)
  } catch (error) {
    console.error('Risk summary proxy error:', error)
    res.status(502).json({ error: 'Failed to get ML risk summary' })
  }
})

app.post('/api/tasks', checkRole(['admin', 'chef_projet']), validate(TaskSchema), async (req: Request, res: Response) => {
  try {
    const data = req.body
    const userId = (req as any).user?.id
    const task = await prisma.task.create({
      data: {
        id: data.id ?? undefined,
        projectId: data.project_id,
        title: data.title,
        description: data.description ?? '',
        progress: data.progress ?? 0,
        status: data.status,
        priority: data.priority,
        startDate: data.start_date ? new Date(data.start_date) : null,
        dueDate: data.due_date ? new Date(data.due_date) : null,
        assignedTo: data.assignee_id ?? null,
        createdBy: userId ?? null,
      },
    })
    res.status(201).json(task)
  } catch (error) {
    console.error('Error creating task:', error)
    res.status(500).json({ error: 'Failed to create task' })
  }
})

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`API running at http://localhost:${PORT}`)
  }
})
