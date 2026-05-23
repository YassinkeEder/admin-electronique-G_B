import { prisma } from '../prisma';
import {
  ProjectStatus,
  ProjectRegion,
  ProjectSector,
  Project,
} from "@prisma/client";

/**
 * Data Access Layer for Projects
 * Type-safe queries using Prisma ORM
 */

export interface ProjectFilters {
  status?: ProjectStatus;
  region?: ProjectRegion;
  sector?: ProjectSector;
  search?: string;
  archived?: boolean;
  organizationId?: string;
}

/**
 * Get all projects with optional filtering
 */
export async function getProjects(filters?: ProjectFilters) {
  try {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.region) where.region = filters.region;
    if (filters?.sector) where.sector = filters.sector;
    if (filters?.organizationId) where.organizationId = filters.organizationId;
    if (filters?.archived !== undefined) where.isArchived = filters.archived;

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return await prisma.project.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        organization: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("[getProjects]", error);
    throw new Error("Failed to fetch projects");
  }
}

/**
 * Get single project by ID
 */
export async function getProjectById(id: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        creator: true,
        updater: true,
        organization: true,
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        metrics: {
          orderBy: { recordedAt: "desc" },
        },
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

    if (!project) {
      throw new Error("Project not found");
    }

    return project;
  } catch (error) {
    console.error("[getProjectById]", error);
    throw error;
  }
}

/**
 * Create a new project
 */
export async function createProject(
  data: Omit<Project, "id" | "createdAt" | "updatedAt">,
  userId: string
) {
  try {
    return await prisma.project.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      },
      include: { creator: true },
    });
  } catch (error) {
    console.error("[createProject]", error);
    throw new Error("Failed to create project");
  }
}

/**
 * Update an existing project
 */
export async function updateProject(
  id: string,
  data: Partial<Omit<Project, "id" | "createdAt" | "updatedAt" | "createdBy">>,
  userId: string
) {
  try {
    return await prisma.project.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
      include: { creator: true, updater: true },
    });
  } catch (error) {
    console.error("[updateProject]", error);
    throw new Error("Failed to update project");
  }
}

/**
 * Soft delete (archive) a project
 */
export async function archiveProject(id: string, userId: string) {
  try {
    return await prisma.project.update({
      where: { id },
      data: {
        isArchived: true,
        updatedBy: userId,
      },
    });
  } catch (error) {
    console.error("[archiveProject]", error);
    throw new Error("Failed to archive project");
  }
}

/**
 * Get projects by organization
 */
export async function getProjectsByOrganization(organizationId: string) {
  try {
    return await prisma.project.findMany({
      where: {
        organizationId,
        isArchived: false,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("[getProjectsByOrganization]", error);
    throw new Error("Failed to fetch organization projects");
  }
}

/**
 * Get project statistics
 */
export async function getProjectStats() {
  try {
    const total = await prisma.project.count({ where: { isArchived: false } });
    const inProgress = await prisma.project.count({
      where: { status: "IN_PROGRESS", isArchived: false },
    });
    const completed = await prisma.project.count({
      where: { status: "COMPLETED", isArchived: false },
    });

    const projects = await prisma.project.findMany({
      where: { isArchived: false },
      select: {
        budgetXof: true,
        spentXof: true,
        progress: true,
      },
    });

    const totalBudget = projects.reduce((sum: bigint, p) => sum + p.budgetXof, 0n);
    const totalSpent = projects.reduce((sum: bigint, p) => sum + p.spentXof, 0n);
    const avgProgress =
      projects.length > 0
        ? Math.round(
            projects.reduce((sum: number, p) => sum + p.progress, 0) / projects.length
          )
        : 0;

    return {
      total,
      inProgress,
      completed,
      totalBudget,
      totalSpent,
      avgProgress,
    };
  } catch (error) {
    console.error("[getProjectStats]", error);
    throw new Error("Failed to fetch project statistics");
  }
}
