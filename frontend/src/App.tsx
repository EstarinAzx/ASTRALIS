// ============================================================================
// App - Main routing
// ============================================================================

import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { InputPage } from './pages/InputPage';
import { DashboardPage } from './pages/DashboardPage';

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/input" element={<InputPage />} />
                    <Route path="/dashboard/:id" element={<DashboardPage />} />
                </Route>

                {/* Default redirect */}
                <Route path="*" element={<Navigate to="/input" replace />} />
            </Routes>
        </AuthProvider>
    );
}
