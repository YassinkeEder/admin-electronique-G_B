// project-bolt/project/lib/prisma.ts
import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

/**
 * Prisma Client instance
 * Reuses connection in development with hot reloading
 * Creates new instance in production
 */
const logLevels: Prisma.LogLevel[] = process.env.NODE_ENV !== 'production'
  ? ['query', 'error', 'warn']
  : ['error', 'warn'];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logLevels,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

