import type { TaskPriority, TaskStatus } from '../../src/types';

const TASK_STATUSES: readonly TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'];
const TASK_PRIORITIES: readonly TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

interface SchemaSuccess<T> {
  success: true;
  data: T;
}

interface SchemaFailure {
  success: false;
  error: Error;
}

type SchemaResult<T> = SchemaSuccess<T> | SchemaFailure;

interface Schema<T> {
  parse(data: unknown): T;
  safeParse(data: unknown): SchemaResult<T>;
}

export interface TaskCreate {
  title: string;
  description: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  startDate?: Date | null;
  dueDate?: Date | null;
  assignedTo?: string;
}

export type TaskUpdate = Partial<TaskCreate>;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEnumValue<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T);
}

function readInteger(
  value: unknown,
  field: string,
  options: { min?: number; max?: number; required?: boolean } = {},
): number | undefined {
  if (value === undefined) {
    if (options.required) {
      throw new Error(`${field} est requis`);
    }
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`${field} doit être un nombre entier`);
  }

  if (options.min !== undefined && value < options.min) {
    throw new Error(`${field} est invalide`);
  }

  if (options.max !== undefined && value > options.max) {
    throw new Error(`${field} est invalide`);
  }

  return value;
}

function readString(
  value: unknown,
  field: string,
  options: { minLength?: number; maxLength?: number; required?: boolean } = {},
): string | undefined {
  if (value === undefined) {
    if (options.required) {
      throw new Error(`${field} est requis`);
    }
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error(`${field} est invalide`);
  }

  const trimmed = value.trim();

  if (options.minLength !== undefined && trimmed.length < options.minLength) {
    throw new Error(`${field} est invalide`);
  }

  if (options.maxLength !== undefined && trimmed.length > options.maxLength) {
    throw new Error(`${field} est invalide`);
  }

  return trimmed;
}

function readOptionalDate(value: unknown, field: string): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${field} doit être une date valide`);
  }

  return parsed;
}

function parseTaskCreate(data: unknown): TaskCreate {
  if (!isObject(data)) {
    throw new Error('Les données tâche sont invalides');
  }

  const title = readString(data.title, 'Le titre', { required: true, minLength: 3, maxLength: 255 })!;
  const projectId = readString(data.projectId, 'Project ID', { required: true })!;
  const progress = readInteger(data.progress, "L'avancement", { min: 0, max: 100 }) ?? 0;
  const startDate = readOptionalDate(data.startDate, 'La date de début');
  const dueDate = readOptionalDate(data.dueDate, "La date d'échéance");

  if (startDate && dueDate && dueDate <= startDate) {
    throw new Error("La date d'échéance doit être après la date de début");
  }

  return {
    title,
    description: readString(data.description, 'La description', { maxLength: 2000 }) ?? '',
    projectId,
    status: isEnumValue(data.status, TASK_STATUSES) ? data.status : 'TODO',
    priority: isEnumValue(data.priority, TASK_PRIORITIES) ? data.priority : 'MEDIUM',
    progress,
    startDate,
    dueDate,
    assignedTo: readString(data.assignedTo, 'AssignedTo'),
  };
}

function parseTaskUpdate(data: unknown): TaskUpdate {
  if (!isObject(data)) {
    throw new Error('Les données tâche sont invalides');
  }

  const parsed: TaskUpdate = {};

  if (data.title !== undefined) {
    parsed.title = readString(data.title, 'Le titre', { required: true, minLength: 3, maxLength: 255 });
  }

  if (data.description !== undefined) {
    parsed.description = readString(data.description, 'La description', { required: true, maxLength: 2000 });
  }

  if (data.projectId !== undefined) {
    parsed.projectId = readString(data.projectId, 'Project ID', { required: true });
  }

  if (data.status !== undefined) {
    if (!isEnumValue(data.status, TASK_STATUSES)) {
      throw new Error('Statut tâche invalide');
    }
    parsed.status = data.status;
  }

  if (data.priority !== undefined) {
    if (!isEnumValue(data.priority, TASK_PRIORITIES)) {
      throw new Error('Priorité invalide');
    }
    parsed.priority = data.priority;
  }

  if (data.progress !== undefined) {
    parsed.progress = readInteger(data.progress, "L'avancement", { required: true, min: 0, max: 100 });
  }

  if (data.startDate !== undefined) {
    parsed.startDate = readOptionalDate(data.startDate, 'La date de début');
  }

  if (data.dueDate !== undefined) {
    parsed.dueDate = readOptionalDate(data.dueDate, "La date d'échéance");
  }

  if (parsed.startDate && parsed.dueDate && parsed.dueDate <= parsed.startDate) {
    throw new Error("La date d'échéance doit être après la date de début");
  }

  if (data.assignedTo !== undefined) {
    parsed.assignedTo = readString(data.assignedTo, 'AssignedTo', { required: true });
  }

  return parsed;
}

function createSchema<T>(parser: (data: unknown) => T): Schema<T> {
  return {
    parse(data: unknown) {
      return parser(data);
    },
    safeParse(data: unknown) {
      try {
        return { success: true, data: parser(data) };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Validation failed'),
        };
      }
    },
  };
}

export const TaskCreateSchema = createSchema(parseTaskCreate);
export const TaskUpdateSchema = createSchema(parseTaskUpdate);

export const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ['IN_PROGRESS', 'BLOCKED'],
  IN_PROGRESS: ['REVIEW', 'BLOCKED', 'TODO'],
  REVIEW: ['DONE', 'IN_PROGRESS'],
  DONE: [],
  BLOCKED: ['TODO', 'IN_PROGRESS'],
};

export function isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TASK_STATUS_TRANSITIONS[from].includes(to);
}
