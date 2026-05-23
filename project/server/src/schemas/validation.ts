import { z } from 'zod'

export const ProjectStatus = z.enum(['PLANNED','IN_PROGRESS','COMPLETED','SUSPENDED','CANCELLED'])
export const ProjectRegion = z.enum(['Bissau','Gabu','Bafata','Cacheu','Oio','Quinara','Tombali','Biombo','Bolama'])
export const ProjectSector = z.enum(['Health','Education','Infrastructure','Agriculture','Energy','ICT','Finance','Governance','Environment'])
export const StrategicAxis = z.enum([
  'e_gouvernement',
  'infrastructure_numerique',
  'inclusion_numerique',
  'cybersecurite',
  'data_et_ia',
  'economie_numerique',
])

const isoDateString = z.string().refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid ISO date' })

export const ProjectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3),
  description: z.string().optional(),
  budget_xof: z.preprocess((val) => typeof val === 'string' ? Number(val) : val, z.number().nonnegative()),
  spent_xof: z.preprocess((val) => typeof val === 'string' ? Number(val) : val, z.number().nonnegative()).optional(),
  start_date: isoDateString,
  end_date: isoDateString,
  status: ProjectStatus.optional(),
  region: ProjectRegion.optional(),
  sector: ProjectSector.optional(),
  strategic_axis: StrategicAxis.optional(),
  is_public: z.boolean().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  beneficiaries: z.number().int().nonnegative().optional(),
  organization_id: z.string().uuid().optional(),
}).strict()

export const TaskSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  project_id: z.string().uuid(),
  progress: z.number().int().min(0).max(100).optional(),
  status: z.enum(['TODO','IN_PROGRESS','REVIEW','DONE','BLOCKED']),
  priority: z.enum(['LOW','MEDIUM','HIGH','CRITICAL']),
  assignee_id: z.string().uuid().optional(),
  start_date: isoDateString.optional(),
  due_date: isoDateString.optional(),
}).strict()

export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  fullName: z.string().optional(),
  role: z.enum(['admin','chef_projet','decideur','public'])
}).strict()

export const CommentSchema = z.object({
  id: z.string().uuid().optional(),
  content: z.string().min(1).max(2000),
  project_id: z.string().uuid().optional(),
  task_id: z.string().uuid().optional(),
}).superRefine((val, ctx) => {
  if (!val.project_id && !val.task_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Either project_id or task_id is required' })
  }
})

export { z }
