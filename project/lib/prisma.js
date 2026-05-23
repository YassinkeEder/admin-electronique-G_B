// project-bolt/project/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis;
/**
 * Prisma Client instance
 * Reuses connection in development with hot reloading
 * Creates new instance in production
 */
const logLevels = process.env.NODE_ENV !== 'production' ? ['query', 'error', 'warn'] : ['error', 'warn'];

export const prisma = globalForPrisma.prisma ??
    new PrismaClient({
        log: logLevels,
    });
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = prisma;
export default prisma;
