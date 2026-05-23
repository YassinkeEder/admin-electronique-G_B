// src/types/index.ts
export type UserRole = 'admin' | 'chef_projet' | 'decideur' | 'public';
export type ProjectStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SUSPENDED' | 'CANCELLED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type KpiType = 'budget_variance' | 'roi' | 'delay_index' | 'completion_rate' | 'cost_per_beneficiary' | 'efficiency_score';
export type ProjectRegion = 'Bissau' | 'Gabu' | 'Bafata' | 'Cacheu' | 'Oio' | 'Quinara' | 'Tombali' | 'Biombo' | 'Bolama';
export type ProjectSector = 'Health' | 'Education' | 'Infrastructure' | 'Agriculture' | 'Energy' | 'ICT' | 'Finance' | 'Governance' | 'Environment';

export type StrategicAxis =
  | 'e_gouvernement'
  | 'infrastructure_numerique'
  | 'inclusion_numerique'
  | 'cybersecurite'
  | 'data_et_ia'
  | 'economie_numerique';

export const STRATEGIC_AXES: StrategicAxis[] = [
  'e_gouvernement',
  'infrastructure_numerique',
  'inclusion_numerique',
  'cybersecurite',
  'data_et_ia',
  'economie_numerique',
];

export const STRATEGIC_AXIS_LABELS: Record<StrategicAxis, string> = {
  e_gouvernement: 'E-Gouvernement',
  infrastructure_numerique: 'Infrastructure numérique',
  inclusion_numerique: 'Inclusion numérique',
  cybersecurite: 'Cybersécurité',
  data_et_ia: 'Data & IA',
  economie_numerique: 'Économie numérique',
};

export const STRATEGIC_AXIS_DESCRIPTIONS: Record<StrategicAxis, string> = {
  e_gouvernement: 'Services publics numériques et administration électronique',
  infrastructure_numerique: 'Connectivité, data centers et backbone national',
  inclusion_numerique: 'Accès universel et formation numérique citoyenne',
  cybersecurite: 'Protection des systèmes et données gouvernementales',
  data_et_ia: 'Données ouvertes, analytics et intelligence artificielle',
  economie_numerique: 'Startups tech, e-commerce et emplois du numérique',
};

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string;
  phone: string;
  avatar_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  budget_xof: number;
  spent_xof: number;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
  region: ProjectRegion;
  sector: ProjectSector;
  strategic_axis?: StrategicAxis | null;
  is_public: boolean;
  progress: number;
  beneficiaries: number;
  created_by: string | null;
  updated_by: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  creator?: Profile;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  progress: number;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  assignee?: Profile;
}

export interface Metric {
  id: string;
  project_id: string;
  kpi_type: KpiType;
  value: number;
  unit: string;
  target_value: number;
  period_label: string;
  recorded_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
  user?: Profile;
  changes?: Record<string, { old: unknown; new: unknown }>;
}

export type NotificationType = 'task_overdue' | 'project_delay' | 'budget_alert' | 'comment' | 'mention' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  related_resource: string | null;
  related_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  content: string;
  author_id: string;
  resource_type: string;
  resource_id: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export const REGIONS: ProjectRegion[] = ['Bissau', 'Gabu', 'Bafata', 'Cacheu', 'Oio', 'Quinara', 'Tombali', 'Biombo', 'Bolama'];
export const SECTORS: ProjectSector[] = ['Health', 'Education', 'Infrastructure', 'Agriculture', 'Energy', 'ICT', 'Finance', 'Governance', 'Environment'];
export const STATUSES: ProjectStatus[] = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SUSPENDED', 'CANCELLED'];
