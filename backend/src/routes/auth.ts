// ============================================================================
// Authentication Routes - Register & Login
// ============================================================================

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// JWT options
const getJwtOptions = (): SignOptions => ({
    expiresIn: '7d',
});

// ============================================================================
// POST /api/auth/register
// ============================================================================
router.post('/register', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new AppError(400, 'Email and password are required');
        }

        if (password.length < 6) {
            throw new AppError(400, 'Password must be at least 6 characters');
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new AppError(409, 'User already exists');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
            },
        });

        // Generate token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET!,
            getJwtOptions()
        );

        res.status(201).json({
            status: 'success',
            data: { user, token },
        });
    } catch (error) {
        next(error);
    }
});

// ============================================================================
// POST /api/auth/login
// ============================================================================
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new AppError(400, 'Email and password are required');
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new AppError(401, 'Invalid credentials');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);

        if (!isValidPassword) {
            throw new AppError(401, 'Invalid credentials');
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET!,
            getJwtOptions()
        );

        res.json({
            status: 'success',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    createdAt: user.createdAt,
                },
                token,
            },
        });
    } catch (error) {
        next(error);
    }
});

// ============================================================================
// GET /api/auth/me - Get current user
// ============================================================================
router.get('/me', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            throw new AppError(401, 'No token provided');
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new AppError(401, 'Invalid token format');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new AppError(404, 'User not found');
        }

        res.json({
            status: 'success',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
