// ============================================================================
// ASTRALIS Backend - Main Entry Point
// ============================================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import analyzeRoutes from './routes/analyze.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

// Debug: Check if env vars are loaded
console.log('🔑 ENV CHECK:');
console.log('  - LLM_API_KEY present:', !!process.env.LLM_API_KEY);
console.log('  - LLM_MODEL:', process.env.LLM_MODEL);
console.log('  - DATABASE_URL present:', !!process.env.DATABASE_URL);

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// Middleware
// ============================================================================
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Large limit for code files

// ============================================================================
// Routes
// ============================================================================
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/analyze', analyzeRoutes);

// ============================================================================
// Error Handler (must be last)
// ============================================================================
app.use(errorHandler);

// ============================================================================
// Start Server
// ============================================================================
app.listen(PORT, () => {
    console.log(`🚀 ASTRALIS Backend running on http://localhost:${PORT}`);
});

export default app;
