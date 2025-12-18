// ============================================================================
// Analysis Routes - ASTRALIS Code Analysis Endpoint
// ============================================================================

import { Router } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { callLLM } from '../services/llm/index.js';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AnalyzeRequest, VerbosityMode } from '../types/astralis.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================================================
// POST /api/analyze - Analyze a code file
// ============================================================================
router.post('/', async (req: AuthenticatedRequest, res, next) => {
    try {
        const { code, fileName, language, mode } = req.body as AnalyzeRequest;

        // Validate request
        if (!code || !fileName || !language) {
            throw new AppError(400, 'code, fileName, and language are required');
        }

        const verbosityMode: VerbosityMode = ['concise', 'standard', 'deep_dive'].includes(mode)
            ? mode
            : 'standard';

        const userId = req.user!.userId;

        // Generate hash of file content for caching
        const fileHash = crypto.createHash('sha256').update(code).digest('hex');

        // Check cache first
        const cached = await prisma.analysisHistory.findFirst({
            where: {
                userId,
                fileHash,
                mode: verbosityMode,
            },
            orderBy: { createdAt: 'desc' },
        });

        if (cached) {
            console.log(`✅ Cache hit for ${fileName}`);
            return res.json({
                status: 'success',
                data: {
                    id: cached.id,
                    fileName: cached.fileName,
                    language: cached.language,
                    mode: cached.mode,
                    sourceCode: cached.sourceCode,  // Include source code for inspector
                    result: cached.result,
                    cached: true,
                },
            });
        }

        // Call LLM
        console.log(`🤖 Calling LLM for ${fileName} (${verbosityMode} mode)...`);
        const result = await callLLM(code, fileName, language, verbosityMode);
        console.log('✅ LLM call completed');
        console.log('📊 Result has', result.nodes?.length || 0, 'nodes');

        // Save to history
        console.log('💾 Saving to database...');
        const analysis = await prisma.analysisHistory.create({
            data: {
                userId,
                fileName,
                fileHash,
                language,
                mode: verbosityMode,
                sourceCode: code,  // Save original source code for inspector highlighting
                result: result as object,
            },
        });
        console.log('✅ Saved with ID:', analysis.id);

        res.json({
            status: 'success',
            data: {
                id: analysis.id,
                fileName: analysis.fileName,
                language: analysis.language,
                mode: analysis.mode,
                sourceCode: analysis.sourceCode,  // Return source code for inspector
                result,
                cached: false,
            },
        });
    } catch (error) {
        console.error('❌ Error in analyze route:', error);
        next(error);
    }
});

// ============================================================================
// GET /api/analyze/history - Get user's analysis history
// ============================================================================
router.get('/history', async (req: AuthenticatedRequest, res, next) => {
    try {
        const userId = req.user!.userId;

        const history = await prisma.analysisHistory.findMany({
            where: { userId },
            select: {
                id: true,
                fileName: true,
                language: true,
                mode: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        res.json({
            status: 'success',
            data: { history },
        });
    } catch (error) {
        next(error);
    }
});

// ============================================================================
// GET /api/analyze/:id - Get a specific analysis
// ============================================================================
router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
    try {
        const userId = req.user!.userId;
        const id = req.params.id;

        if (!id) {
            throw new AppError(400, 'Analysis ID is required');
        }

        const analysis = await prisma.analysisHistory.findFirst({
            where: {
                AND: [
                    { id: id as string },
                    { userId: userId },
                ],
            },
        });

        if (!analysis) {
            throw new AppError(404, 'Analysis not found');
        }

        res.json({
            status: 'success',
            data: analysis,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
