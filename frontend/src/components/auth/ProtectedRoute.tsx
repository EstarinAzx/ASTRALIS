// ============================================================================
// Protected Route - Redirects unauthenticated users to login
// ============================================================================

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="animate-pulse p-8 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <div className="text-[var(--text-secondary)] text-lg">Loading...</div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
