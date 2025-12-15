// ============================================================================
// Prisma Client Singleton
// ============================================================================
// Ensures a single Prisma instance is used throughout the application
// Prevents connection pool exhaustion during development hot-reloads

import { PrismaClient } from '../generated/prisma/index.js';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
