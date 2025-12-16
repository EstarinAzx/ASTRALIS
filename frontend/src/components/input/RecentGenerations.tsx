// ============================================================================
// Recent Generations Component
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCode, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import type { RecentGeneration } from '../../types/astralis';

export function RecentGenerations() {
    const [generations, setGenerations] = useState<RecentGeneration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchHistory() {
            try {
                const response = await api.get<{ history: RecentGeneration[] }>('/analyze/history');
                setGenerations(response.data.history.slice(0, 5));
            } catch {
                // Ignore errors - just show empty state
            } finally {
                setIsLoading(false);
            }
        }
        fetchHistory();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[1, 2].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
                ))}
            </div>
        );
    }

    if (generations.length === 0) {
        return (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">
                No recent generations yet
            </p>
        );
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    const getIcon = (language: string) => {
        if (['typescript', 'javascript'].includes(language)) {
            return <FileCode className="w-5 h-5 text-blue-400" />;
        }
        return <FileText className="w-5 h-5 text-[var(--text-muted)]" />;
    };

    return (
        <div className="space-y-2">
            {generations.map((gen) => (
                <button
                    key={gen.id}
                    onClick={() => navigate(`/dashboard/${gen.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors text-left"
                >
                    <div className="w-9 h-9 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
                        {getIcon(gen.language)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-[var(--text-primary)] truncate">
                            {gen.fileName}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                            {gen.language} • {formatTime(gen.createdAt)}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
