// ============================================================================
// JWT Authentication Middleware
// ============================================================================

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export interface JwtPayload {
    userId: string;
    email: string;
}

export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}

export const authMiddleware = (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError(401, 'No token provided');
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw new AppError(401, 'Invalid token format');
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new AppError(500, 'JWT secret not configured');
        }

        const decoded = jwt.verify(token, secret) as JwtPayload;
        req.user = decoded;

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new AppError(401, 'Invalid token'));
        } else if (error instanceof jwt.TokenExpiredError) {
            next(new AppError(401, 'Token expired'));
        } else {
            next(error);
        }
    }
};
