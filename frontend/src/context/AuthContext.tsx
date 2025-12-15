// ============================================================================
// Auth Context - Global Authentication State
// ============================================================================

import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from 'react';
import { api } from '../lib/api';

// ============================================================================
// Types
// ============================================================================
interface User {
    id: string;
    email: string;
    createdAt: string;
}

interface AuthResponse {
    user: User;
    token: string;
}

interface MeResponse {
    user: User;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

// ============================================================================
// Context
// ============================================================================
const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================================
// Hook
// ============================================================================
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// ============================================================================
// Provider
// ============================================================================
interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() =>
        localStorage.getItem('token')
    );
    const [isLoading, setIsLoading] = useState(true);

    // Check token validity on mount
    useEffect(() => {
        async function validateToken() {
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await api.get<MeResponse>('/auth/me');
                setUser(response.data.user);
            } catch {
                // Token invalid, clear it
                localStorage.removeItem('token');
                setToken(null);
            } finally {
                setIsLoading(false);
            }
        }

        validateToken();
    }, [token]);

    // Login
    const login = async (email: string, password: string) => {
        const response = await api.post<AuthResponse>('/auth/login', { email, password });
        const { user: userData, token: newToken } = response.data;

        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
    };

    // Register
    const register = async (email: string, password: string) => {
        const response = await api.post<AuthResponse>('/auth/register', { email, password });
        const { user: userData, token: newToken } = response.data;

        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
    };

    // Logout
    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
