import type {
  Profile as AppProfile,
  Project as AppProject,
  ProjectRegion,
  ProjectSector,
  ProjectStatus,
  Task as AppTask,
  TaskPriority,
  TaskStatus,
  UserRole,
} from '../types';

export type Profile = AppProfile;

export interface ProjectInput {
  name: string;
  description?: string;
  region: ProjectRegion;
  sector: ProjectSector;
  status?: ProjectStatus;
  budgetXof: number;
  spentXof?: number;
  progress?: number;
  beneficiaries?: number;
  startDate: string | Date;
  endDate: string | Date;
}

export type Project = AppProject;

export interface TaskInput {
  title: string;
  description?: string;
  projectId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | Date;
  completedAt?: string | Date | null;
}

export type Task = AppTask;

export interface ProjectFilters {
  search?: string;
  status?: ProjectStatus;
  region?: ProjectRegion;
  sector?: ProjectSector;
  minBudget?: number;
  maxBudget?: number;
}

export interface TaskFilters {
  search?: string;
  status?: TaskStatus;
  projectId?: string;
  assigneeId?: string;
  dueAfter?: string;
  dueBefore?: string;
}

export interface ValidationIssue {
  path: Array<string | number>;
  message: string;
}

export interface ValidationError {
  errors: ValidationIssue[];
}

type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: ValidationError };

interface Schema<T> {
  safeParse: (data: unknown) => SafeParseResult<T>;
}

const PROJECT_REGIONS: ProjectRegion[] = [
  'Bissau',
  'Gabu',
  'Bafata',
  'Cacheu',
  'Oio',
  'Quinara',
  'Tombali',
  'Biombo',
  'Bolama',
];

const PROJECT_SECTORS: ProjectSector[] = [
  'Health',
  'Education',
  'Infrastructure',
  'Agriculture',
  'Energy',
  'ICT',
  'Finance',
  'Governance',
  'Environment',
];

const PROJECT_STATUSES: ProjectStatus[] = [
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'SUSPENDED',
  'CANCELLED',
];

const TASK_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'];
const TASK_PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const USER_ROLES: UserRole[] = ['admin', 'chef_projet', 'decideur', 'public'];

function validationError(message: string, path: Array<string | number> = []): ValidationError {
  return { errors: [{ path, message }] };
}

function ok<T>(data: T): SafeParseResult<T> {
  return { success: true, data };
}

function fail<T>(message: string, path: Array<string | number> = []): SafeParseResult<T> {
  return { success: false, error: validationError(message, path) };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isDateLike(value: unknown): value is string | Date {
  return value instanceof Date || isString(value);
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return isString(value) && allowed.includes(value as T);
}

function buildSchema<T>(validator: (data: unknown) => T | null): Schema<T> {
  return {
    safeParse(data) {
      const parsed = validator(data);
      return parsed === null ? fail<T>('Validation failed') : ok(parsed);
    },
  };
}

function validateProfileShape(data: unknown): Profile | null {
  if (!isObject(data)) {
    return null;
  }

  if (!isString(data.id) || !isString(data.full_name) || !isString(data.email)) {
    return null;
  }

  if (!isOneOf(data.role, USER_ROLES)) {
    return null;
  }

  return data as unknown as Profile;
}

function validateProjectShape(data: unknown): Project | null {
  if (!isObject(data)) {
    return null;
  }

  if (
    !isString(data.id) ||
    !isString(data.name) ||
    !isOneOf(data.region, PROJECT_REGIONS) ||
    !isOneOf(data.sector, PROJECT_SECTORS) ||
    !isOneOf(data.status, PROJECT_STATUSES) ||
    !isNumber(data.budget_xof) ||
    !isNumber(data.spent_xof) ||
    !isNumber(data.progress) ||
    !isNumber(data.beneficiaries) ||
    !isString(data.start_date) ||
    !isString(data.end_date) ||
    !isString(data.created_at) ||
    !isString(data.updated_at)
  ) {
    return null;
  }

  return data as unknown as Project;
}

function validateProjectInputShape(data: unknown): ProjectInput | null {
  if (!isObject(data)) {
    return null;
  }

  if (
    !isString(data.name) ||
    !isOneOf(data.region, PROJECT_REGIONS) ||
    !isOneOf(data.sector, PROJECT_SECTORS) ||
    !isNumber(data.budgetXof) ||
    !isDateLike(data.startDate) ||
    !isDateLike(data.endDate)
  ) {
    return null;
  }

  if (data.status !== undefined && !isOneOf(data.status, PROJECT_STATUSES)) {
    return null;
  }

  return {
    name: data.name,
    description: isString(data.description) ? data.description : undefined,
    region: data.region,
    sector: data.sector,
    status: isOneOf(data.status, PROJECT_STATUSES) ? data.status : 'PLANNED',
    budgetXof: data.budgetXof,
    spentXof: isNumber(data.spentXof) ? data.spentXof : 0,
    progress: isNumber(data.progress) ? data.progress : 0,
    beneficiaries: isNumber(data.beneficiaries) ? data.beneficiaries : undefined,
    startDate: data.startDate,
    endDate: data.endDate,
  };
}

function validateTaskShape(data: unknown): Task | null {
  if (!isObject(data)) {
    return null;
  }

  if (
    !isString(data.id) ||
    !isString(data.project_id) ||
    !isString(data.title) ||
    !isOneOf(data.status, TASK_STATUSES) ||
    !isOneOf(data.priority, TASK_PRIORITIES) ||
    !isNumber(data.progress) ||
    !isString(data.created_at) ||
    !isString(data.updated_at)
  ) {
    return null;
  }

  return data as unknown as Task;
}

function validateTaskInputShape(data: unknown): TaskInput | null {
  if (!isObject(data)) {
    return null;
  }

  if (!isString(data.title) || !isString(data.projectId)) {
    return null;
  }

  if (data.status !== undefined && !isOneOf(data.status, TASK_STATUSES)) {
    return null;
  }

  if (data.priority !== undefined && !isOneOf(data.priority, TASK_PRIORITIES)) {
    return null;
  }

  return {
    title: data.title,
    description: isString(data.description) ? data.description : undefined,
    projectId: data.projectId,
    status: isOneOf(data.status, TASK_STATUSES) ? data.status : 'TODO',
    priority: isOneOf(data.priority, TASK_PRIORITIES) ? data.priority : 'MEDIUM',
    assigneeId: isString(data.assigneeId) ? data.assigneeId : null,
    dueDate: isDateLike(data.dueDate) ? data.dueDate : undefined,
    completedAt: isDateLike(data.completedAt) ? data.completedAt : null,
  };
}

function validateProjectFiltersShape(data: unknown): ProjectFilters {
  if (!isObject(data)) {
    return {};
  }

  return {
    search: isString(data.search) ? data.search : undefined,
    status: isOneOf(data.status, PROJECT_STATUSES) ? data.status : undefined,
    region: isOneOf(data.region, PROJECT_REGIONS) ? data.region : undefined,
    sector: isOneOf(data.sector, PROJECT_SECTORS) ? data.sector : undefined,
    minBudget: isNumber(data.minBudget) ? data.minBudget : undefined,
    maxBudget: isNumber(data.maxBudget) ? data.maxBudget : undefined,
  };
}

function validateTaskFiltersShape(data: unknown): TaskFilters {
  if (!isObject(data)) {
    return {};
  }

  return {
    search: isString(data.search) ? data.search : undefined,
    status: isOneOf(data.status, TASK_STATUSES) ? data.status : undefined,
    projectId: isString(data.projectId) ? data.projectId : undefined,
    assigneeId: isString(data.assigneeId) ? data.assigneeId : undefined,
    dueAfter: isString(data.dueAfter) ? data.dueAfter : undefined,
    dueBefore: isString(data.dueBefore) ? data.dueBefore : undefined,
  };
}

export const UserRoleSchema = buildSchema<UserRole>(
  (data) => (isOneOf(data, USER_ROLES) ? data : null),
);
export const ProjectStatusSchema = buildSchema<ProjectStatus>(
  (data) => (isOneOf(data, PROJECT_STATUSES) ? data : null),
);
export const TaskStatusSchema = buildSchema<TaskStatus>(
  (data) => (isOneOf(data, TASK_STATUSES) ? data : null),
);
export const ProfileSchema = buildSchema(validateProfileShape);
export const ProjectInputSchema = buildSchema(validateProjectInputShape);
export const ProjectSchema = buildSchema(validateProjectShape);
export const ProjectsArraySchema = buildSchema<Project[]>(
  (data) => (Array.isArray(data) ? data.filter((item): item is Project => validateProjectShape(item) !== null) : null),
);
export const TaskInputSchema = buildSchema(validateTaskInputShape);
export const TaskSchema = buildSchema(validateTaskShape);
export const ProjectFiltersSchema = buildSchema<ProjectFilters>(validateProjectFiltersShape);
export const TaskFiltersSchema = buildSchema<TaskFilters>(validateTaskFiltersShape);

export function validateProject(data: unknown): Project | null {
  return validateProjectShape(data);
}

export function validateProjectInput(data: unknown): ProjectInput | null {
  return validateProjectInputShape(data);
}

export function validateTask(data: unknown): Task | null {
  return validateTaskShape(data);
}

export function validateTaskInput(data: unknown): TaskInput | null {
  return validateTaskInputShape(data);
}

export function validateProfile(data: unknown): Profile | null {
  return validateProfileShape(data);
}

export function validateProjectFilters(data: unknown): ProjectFilters {
  return validateProjectFiltersShape(data);
}

export function validateTaskFilters(data: unknown): TaskFilters {
  return validateTaskFiltersShape(data);
}

export function getValidationErrors(error: ValidationError) {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}
