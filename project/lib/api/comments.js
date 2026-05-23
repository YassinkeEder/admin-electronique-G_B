import { prisma } from '../prisma';
function getCommentWhere(resourceType, resourceId) {
    if (resourceType === 'project') {
        return { projectId: resourceId };
    }
    return { taskId: resourceId };
}
export async function getComments(resourceType, resourceId) {
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
    }
    catch (error) {
        console.error('[getComments]', error);
        throw new Error('Failed to fetch comments');
    }
}
export async function getComment(id) {
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
    }
    catch (error) {
        console.error('[getComment]', error);
        throw new Error('Failed to fetch comment');
    }
}
export async function createComment(data) {
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
    }
    catch (error) {
        console.error('[createComment]', error);
        throw new Error('Failed to create comment');
    }
}
export async function updateComment(id, content) {
    try {
        return await prisma.comment.update({
            where: { id },
            data: { content },
            include: { author: true },
        });
    }
    catch (error) {
        console.error('[updateComment]', error);
        throw new Error('Failed to update comment');
    }
}
export async function deleteComment(id) {
    try {
        return await prisma.comment.delete({
            where: { id },
        });
    }
    catch (error) {
        console.error('[deleteComment]', error);
        throw new Error('Failed to delete comment');
    }
}
export async function getCommentCount(resourceType, resourceId) {
    try {
        return await prisma.comment.count({
            where: getCommentWhere(resourceType, resourceId),
        });
    }
    catch (error) {
        console.error('[getCommentCount]', error);
        throw new Error('Failed to count comments');
    }
}
