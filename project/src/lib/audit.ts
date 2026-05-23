import { supabase } from './supabase';
import { logError } from '../hooks/useError';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'PERMISSION_CHANGE';

interface AuditLogParams {
  userId: string | null;
  action: AuditAction;
  resourceType: string;
  recordId?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  changes?: Record<string, { old: unknown; new: unknown }> | null;
}

export async function createAuditLog({
  userId,
  action,
  resourceType,
  recordId,
  oldData,
  newData,
  changes,
}: AuditLogParams): Promise<void> {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      action_type: action,
      table_name: resourceType,
      resource_type: resourceType,
      record_id: recordId,
      old_data: oldData,
      new_data: newData,
      changes,
    });

    if (error) {
      // Log structured error for monitoring and debugging
      logError(error as Error, { userId, action, resourceType, recordId });
    }
  } catch (err) {
    logError(err as Error, { userId, action, resourceType, recordId });
  }
}

export async function logProjectAction(
  userId: string | null,
  action: AuditAction,
  projectId: string,
  oldData?: Record<string, unknown>,
  newData?: Record<string, unknown>
): Promise<void> {
  const changes = oldData && newData
    ? Object.keys(newData).reduce((acc, key) => {
      if (oldData[key] !== newData[key]) {
        acc[key] = { old: oldData[key], new: newData[key] };
      }
      return acc;
    }, {} as Record<string, { old: unknown; new: unknown }>)
    : undefined;

  await createAuditLog({
    userId,
    action,
    resourceType: 'projects',
    recordId: projectId,
    oldData,
    newData,
    changes,
  });
}

export async function logTaskAction(
  userId: string | null,
  action: AuditAction,
  taskId: string,
  oldData?: Record<string, unknown>,
  newData?: Record<string, unknown>
): Promise<void> {
  const changes = oldData && newData
    ? Object.keys(newData).reduce((acc, key) => {
      if (oldData[key] !== newData[key]) {
        acc[key] = { old: oldData[key], new: newData[key] };
      }
      return acc;
    }, {} as Record<string, { old: unknown; new: unknown }>)
    : undefined;

  await createAuditLog({
    userId,
    action,
    resourceType: 'tasks',
    recordId: taskId,
    oldData,
    newData,
    changes,
  });
}

export async function logAuthAction(userId: string | null, action: 'LOGIN' | 'LOGOUT'): Promise<void> {
  await createAuditLog({
    userId,
    action,
    resourceType: 'auth',
  });
}

export async function logPermissionChange(
  userId: string | null,
  targetUserId: string,
  oldRole: string,
  newRole: string
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'PERMISSION_CHANGE',
    resourceType: 'profiles',
    recordId: targetUserId,
    oldData: { role: oldRole },
    newData: { role: newRole },
  });
}

export async function logDataExport(userId: string | null, resourceType: string, count: number): Promise<void> {
  await createAuditLog({
    userId,
    action: 'EXPORT',
    resourceType,
    newData: { count },
  });
}
