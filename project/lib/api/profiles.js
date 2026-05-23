import { prisma } from '../prisma';
/**
 * Data Access Layer for User Profiles
 */
/**
 * Get user profile by ID
 */
export async function getProfile(id) {
    try {
        const profile = await prisma.profile.findUnique({
            where: { id },
            include: {
                organizations: {
                    include: {
                        organization: true,
                    },
                },
            },
        });
        if (!profile) {
            throw new Error("Profile not found");
        }
        return profile;
    }
    catch (error) {
        console.error("[getProfile]", error);
        throw error;
    }
}
/**
 * Get user by email
 */
export async function getProfileByEmail(email) {
    try {
        return await prisma.profile.findFirst({
            where: { email },
        });
    }
    catch (error) {
        console.error("[getProfileByEmail]", error);
        throw new Error("Failed to fetch profile");
    }
}
/**
 * Create or update profile (called after auth signup)
 */
export async function upsertProfile(id, data, organizationId) {
    try {
        const profile = await prisma.profile.upsert({
            where: { id },
            update: data,
            create: {
                id,
                ...data,
                role: data.role || "public",
            },
        });
        // Link to organization if provided
        if (organizationId) {
            await prisma.userOrganization.upsert({
                where: {
                    userId_organizationId: {
                        userId: id,
                        organizationId,
                    },
                },
                update: {},
                create: {
                    userId: id,
                    organizationId,
                    role: "member",
                },
            });
        }
        return profile;
    }
    catch (error) {
        console.error("[upsertProfile]", error);
        throw new Error("Failed to upsert profile");
    }
}
/**
 * Update profile
 */
export async function updateProfile(id, data) {
    try {
        return await prisma.profile.update({
            where: { id },
            data,
        });
    }
    catch (error) {
        console.error("[updateProfile]", error);
        throw new Error("Failed to update profile");
    }
}
/**
 * Get all profiles with optional role filter
 */
export async function getProfiles(role) {
    try {
        const where = role ? { role } : {};
        return await prisma.profile.findMany({
            where: { ...where, isActive: true },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                department: true,
                avatarUrl: true,
            },
            orderBy: { fullName: "asc" },
        });
    }
    catch (error) {
        console.error("[getProfiles]", error);
        throw new Error("Failed to fetch profiles");
    }
}
/**
 * Get user's organizations
 */
export async function getUserOrganizations(userId) {
    try {
        return await prisma.userOrganization.findMany({
            where: { userId },
            include: {
                organization: true,
            },
        });
    }
    catch (error) {
        console.error("[getUserOrganizations]", error);
        throw new Error("Failed to fetch user organizations");
    }
}
/**
 * Check if user has permission for resource/action
 */
export async function canUserAccess(userId, resource, action) {
    try {
        const profile = await prisma.profile.findUnique({
            where: { id: userId },
        });
        if (!profile)
            return false;
        // Admin has access to everything
        if (profile.role === "admin")
            return true;
        // Check specific role-based permissions
        const hasPermission = await prisma.rolePermission.findFirst({
            where: {
                role: profile.role,
                permission: {
                    resource: resource,
                    action: action,
                },
            },
        });
        return !!hasPermission;
    }
    catch (error) {
        console.error("[canUserAccess]", error);
        return false;
    }
}
/**
 * Deactivate user
 */
export async function deactivateUser(id) {
    try {
        return await prisma.profile.update({
            where: { id },
            data: { isActive: false },
        });
    }
    catch (error) {
        console.error("[deactivateUser]", error);
        throw new Error("Failed to deactivate user");
    }
}
/**
 * Get user statistics (admin only)
 */
export async function getUserStats() {
    try {
        const total = await prisma.profile.count({ where: { isActive: true } });
        const admins = await prisma.profile.count({
            where: { role: "admin", isActive: true },
        });
        const chefsProjets = await prisma.profile.count({
            where: { role: "chef_projet", isActive: true },
        });
        const decideurs = await prisma.profile.count({
            where: { role: "decideur", isActive: true },
        });
        const public_ = await prisma.profile.count({
            where: { role: "public", isActive: true },
        });
        return {
            total,
            admins,
            chefsProjets,
            decideurs,
            public: public_,
        };
    }
    catch (error) {
        console.error("[getUserStats]", error);
        throw new Error("Failed to fetch user statistics");
    }
}
