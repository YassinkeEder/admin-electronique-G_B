import { prisma } from '../prisma';
import type { Task, TaskPriority, TaskStatus } from '@prisma/client';

/**
 * Data Access Layer for Tasks
 */

export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  search?: string;
}

/**
 * Get tasks with optional filtering
 */
export async function getTasks(filters?: TaskFilters) {
  try {
    const where: any = {};

    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.assignedTo) where.assignedTo = filters.assignedTo;

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("[getTasks]", error);
    throw new Error("Failed to fetch tasks");
  }
}

/**
 * Get single task by ID
 */
export async function getTaskById(id: string) {
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        assignee: true,
        creator: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    return task;
  } catch (error) {
    console.error("[getTaskById]", error);
    throw error;
  }
}

/**
 * Create a new task
 */
export async function createTask(
  data: Omit<Task, "id" | "createdAt" | "updatedAt">,
  userId: string
) {
  try {
    return await prisma.task.create({
      data: {
        ...data,
        createdBy: userId,
      },
      include: { project: true, assignee: true },
    });
  } catch (error) {
    console.error("[createTask]", error);
    throw new Error("Failed to create task");
  }
}

/**
 * Update task
 */
export async function updateTask(
  id: string,
  data: Partial<Omit<Task, "id" | "createdAt" | "updatedAt" | "createdBy">>
) {
  try {
    return await prisma.task.update({
      where: { id },
      data,
      include: { project: true, assignee: true },
    });
  } catch (error) {
    console.error("[updateTask]", error);
    throw new Error("Failed to update task");
  }
}

/**
 * Delete task
 */
export async function deleteTask(id: string) {
  try {
    return await prisma.task.delete({
      where: { id },
    });
  } catch (error) {
    console.error("[deleteTask]", error);
    throw new Error("Failed to delete task");
  }
}

/**
 * Get tasks by project
 */
export async function getTasksByProject(projectId: string) {
  try {
    return await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("[getTasksByProject]", error);
    throw new Error("Failed to fetch project tasks");
  }
}

/**
 * Get overdue tasks
 */
export async function getOverdueTasks() {
  try {
    const now = new Date();
    return await prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { not: "DONE" },
      },
      include: {
        project: true,
        assignee: true,
      },
      orderBy: { dueDate: "asc" },
    });
  } catch (error) {
    console.error("[getOverdueTasks]", error);
    throw new Error("Failed to fetch overdue tasks");
  }
}

/**
 * Get task statistics
 */
export async function getTaskStats(projectId?: string) {
  try {
    const where = projectId ? { projectId } : {};

    const total = await prisma.task.count({ where });
    const done = await prisma.task.count({ where: { ...where, status: "DONE" } });
    const inProgress = await prisma.task.count({
      where: { ...where, status: "IN_PROGRESS" },
    });
    const blocked = await prisma.task.count({
      where: { ...where, status: "BLOCKED" },
    });

    return {
      total,
      done,
      inProgress,
      blocked,
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  } catch (error) {
    console.error("[getTaskStats]", error);
    throw new Error("Failed to fetch task statistics");
  }
}
