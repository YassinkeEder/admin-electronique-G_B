import { prisma } from '../prisma';
import type { Notification } from '@prisma/client';

/**
 * Data Access Layer for Notifications
 */

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string, unreadOnly = false) {
  try {
    const where: any = { userId };
    if (unreadOnly) where.isRead = false;

    return await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to last 50
    });
  } catch (error) {
    console.error("[getUserNotifications]", error);
    throw new Error("Failed to fetch notifications");
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string) {
  try {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    });
  } catch (error) {
    console.error("[getUnreadCount]", error);
    throw new Error("Failed to fetch unread count");
  }
}

/**
 * Create notification
 */
export async function createNotification(
  data: Omit<Notification, "id" | "createdAt" | "isRead" | "readAt">
) {
  try {
    return await prisma.notification.create({
      data: {
        ...data,
        isRead: false,
      },
    });
  } catch (error) {
    console.error("[createNotification]", error);
    throw new Error("Failed to create notification");
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string) {
  try {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[markAsRead]", error);
    throw new Error("Failed to mark notification as read");
  }
}

/**
 * Mark all user notifications as read
 */
export async function markAllAsRead(userId: string) {
  try {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[markAllAsRead]", error);
    throw new Error("Failed to mark all notifications as read");
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(id: string) {
  try {
    return await prisma.notification.delete({
      where: { id },
    });
  } catch (error) {
    console.error("[deleteNotification]", error);
    throw new Error("Failed to delete notification");
  }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string) {
  try {
    return await prisma.notification.deleteMany({
      where: { userId },
    });
  } catch (error) {
    console.error("[deleteAllNotifications]", error);
    throw new Error("Failed to delete notifications");
  }
}

/**
 * Broadcast notification to multiple users (by role or organization)
 */
export async function broadcastNotification(
  userIds: string[],
  notification: Omit<Notification, "id" | "userId" | "createdAt" | "isRead" | "readAt">
) {
  try {
    const notifications = userIds.map((userId) => ({
      ...notification,
      userId,
      isRead: false,
    }));

    return await prisma.notification.createMany({
      data: notifications,
    });
  } catch (error) {
    console.error("[broadcastNotification]", error);
    throw new Error("Failed to broadcast notifications");
  }
}

/**
 * Get notification statistics
 */
export async function getNotificationStats(userId: string) {
  try {
    const total = await prisma.notification.count({ where: { userId } });
    const unread = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    // Count by type
    const byType = await prisma.notification.groupBy({
      by: ["type"],
      where: { userId },
      _count: {
        id: true,
      },
    });

    return {
      total,
      unread,
      byType: byType.reduce(
        (acc: Record<string, number>, item: { type: string; _count: { id: number } }) => {
          acc[item.type] = item._count.id;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  } catch (error) {
    console.error("[getNotificationStats]", error);
    throw new Error("Failed to fetch notification statistics");
  }
}
