import type { Comment } from '@prisma/client';
import { prisma } from '../prisma';

type CommentResourceType = 'project' | 'task';

export interface CommentCreateInput {
  content: string;
  authorId: string;
  projectId?: string | null;
  taskId?: string | null;
  parentId?: string | null;
}

function getCommentWhere(resourceType: CommentResourceType, resourceId: string) {
  if (resourceType === 'project') {
    return { projectId: resourceId };
  }

  return { taskId: resourceId };
}

export async function getComments(resourceType: CommentResourceType, resourceId: string) {
  try {
    return await prisma.comment.findMany({
      where: {
        ...getCommentWhere(resourceType, resourceId),
        parentId: null,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            email: true,
          },
        },
        children: {
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('[getComments]', error);
    throw new Error('Failed to fetch comments');
  }
}

export async function getComment(id: string) {
  try {
    return await prisma.comment.findUnique({
      where: { id },
      include: {
        author: true,
        children: {
          include: {
            author: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('[getComment]', error);
    throw new Error('Failed to fetch comment');
  }
}

export async function createComment(
  data: Omit<CommentCreateInput, 'projectId' | 'taskId'> &
    ({ projectId: string; taskId?: null } | { taskId: string; projectId?: null }),
) {
  try {
    return await prisma.comment.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('[createComment]', error);
    throw new Error('Failed to create comment');
  }
}

export async function updateComment(id: string, content: string) {
  try {
    return await prisma.comment.update({
      where: { id },
      data: { content },
      include: { author: true },
    });
  } catch (error) {
    console.error('[updateComment]', error);
    throw new Error('Failed to update comment');
  }
}

export async function deleteComment(id: string) {
  try {
    return await prisma.comment.delete({
      where: { id },
    });
  } catch (error) {
    console.error('[deleteComment]', error);
    throw new Error('Failed to delete comment');
  }
}

export async function getCommentCount(resourceType: CommentResourceType, resourceId: string) {
  try {
    return await prisma.comment.count({
      where: getCommentWhere(resourceType, resourceId),
    });
  } catch (error) {
    console.error('[getCommentCount]', error);
    throw new Error('Failed to count comments');
  }
}
