import { supabase } from './supabase';

export type NotificationType = 'task_overdue' | 'project_delay' | 'budget_alert' | 'comment' | 'mention' | 'system';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  relatedResource?: string;
  relatedId?: string;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  relatedResource,
  relatedId,
}: CreateNotificationParams): Promise<void> {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      related_resource: relatedResource,
      related_id: relatedId,
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function notifyTaskOverdue(userId: string, taskTitle: string, taskId: string): Promise<void> {
  await createNotification({
    userId,
    type: 'task_overdue',
    title: 'Tâche expirée',
    message: `La tâche "${taskTitle}" a dépassé sa date limite.`,
    relatedResource: 'tasks',
    relatedId: taskId,
  });
}

export async function notifyProjectDelay(userId: string, projectName: string, projectId: string, delayDays: number): Promise<void> {
  await createNotification({
    userId,
    type: 'project_delay',
    title: 'Projet en retard',
    message: `Le projet "${projectName}" est en retard de ${delayDays} jour(s).`,
    relatedResource: 'projects',
    relatedId: projectId,
  });
}

export async function notifyBudgetAlert(userId: string, projectName: string, projectId: string, usage: number): Promise<void> {
  await createNotification({
    userId,
    type: 'budget_alert',
    title: 'Budget alerte',
    message: `Le budget du projet "${projectName}" est utilisé à ${Math.round(usage)}%.`,
    relatedResource: 'projects',
    relatedId: projectId,
  });
}

export async function notifyComment(userId: string, authorName: string, resourceType: string, resourceId: string): Promise<void> {
  await createNotification({
    userId,
    type: 'comment',
    title: 'Nouveau commentaire',
    message: `${authorName} a commenté.`,
    relatedResource: resourceType,
    relatedId: resourceId,
  });
}

export async function notifyMention(userId: string, mentionerName: string, resourceType: string, resourceId: string): Promise<void> {
  await createNotification({
    userId,
    type: 'mention',
    title: 'Vous avez été mentionné',
    message: `${mentionerName} vous a mentionné.`,
    relatedResource: resourceType,
    relatedId: resourceId,
  });
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await supabase.from('notifications').delete().eq('id', notificationId);
}

export async function checkAndCreateAlertsForProject(projectId: string, budgetUsage: number, isOverdue: boolean): Promise<void> {
  if (budgetUsage > 90) {
    const { data: project } = await supabase
      .from('projects')
      .select('name, created_by')
      .eq('id', projectId)
      .maybeSingle();

    if (project?.created_by) {
      await notifyBudgetAlert(project.created_by, project.name, projectId, budgetUsage);
    }
  }

  if (isOverdue) {
    const { data: project } = await supabase
      .from('projects')
      .select('name, created_by, end_date')
      .eq('id', projectId)
      .maybeSingle();

    if (project?.created_by) {
      const delayDays = Math.floor(
        (new Date().getTime() - new Date(project.end_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      await notifyProjectDelay(project.created_by, project.name, projectId, delayDays);
    }
  }
}
