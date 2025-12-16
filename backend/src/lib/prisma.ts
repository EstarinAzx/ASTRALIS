// ============================================================================
// Prisma Client Singleton with pg adapter
// ============================================================================
// Ensures a single Prisma instance is used throughout the application

import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }

    // Create pg Pool
    const pool = new pg.Pool({ connectionString });

    // Create Prisma adapter
    const adapter = new PrismaPg(pool);

    // Create Prisma client with adapter
    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
