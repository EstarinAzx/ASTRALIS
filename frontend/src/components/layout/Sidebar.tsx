// ============================================================================
// Sidebar Component
// ============================================================================

import { LogOut, Sparkles, History, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface User {
    id: string;
    email: string;
}

interface Props {
    user: User | null;
}

export function Sidebar({ user }: Props) {
    const { logout } = useAuth();

    return (
        <div className="w-16 bg-[var(--bg-card)] border-r border-[var(--border-color)] flex flex-col items-center py-4">
            {/* Logo */}
            <div className="mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-2">
                <SidebarButton icon={History} label="History" active={false} />
                <SidebarButton icon={Settings} label="Settings" active={false} />
            </nav>

            {/* User section */}
            <div className="mt-auto flex flex-col items-center gap-4">
                {/* User avatar */}
                <div
                    className="w-9 h-9 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] text-sm font-medium"
                    title={user?.email}
                >
                    {user?.email?.charAt(0).toUpperCase()}
                </div>

                {/* Logout */}
                <button
                    onClick={logout}
                    className="w-9 h-9 rounded-lg text-[var(--text-muted)] hover:text-[var(--color-error)] hover:bg-red-500/10 flex items-center justify-center transition-colors"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// Sidebar Button
// ============================================================================
interface SidebarButtonProps {
    icon: React.FC<{ className?: string }>;
    label: string;
    active: boolean;
    onClick?: () => void;
}

function SidebarButton({ icon: Icon, label, active, onClick }: SidebarButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${active
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
            title={label}
        >
            <Icon className="w-5 h-5" />
        </button>
    );
}
