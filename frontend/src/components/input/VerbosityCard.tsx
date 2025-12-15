// ============================================================================
// Verbosity Card Component
// ============================================================================

import type { VerbosityMode } from '../../types/astralis';

interface Props {
    mode: VerbosityMode;
    currentMode: VerbosityMode;
    onSelect: (mode: VerbosityMode) => void;
    icon: React.FC<{ className?: string }>;
    title: string;
    description: string;
}

export function VerbosityCard({ mode, currentMode, onSelect, icon: Icon, title, description }: Props) {
    const isSelected = mode === currentMode;

    return (
        <button
            onClick={() => onSelect(mode)}
            className={`w-full p-4 rounded-xl border text-left transition-all ${isSelected
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--text-muted)]'
                }`}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-[var(--color-primary)]' : 'border-[var(--border-color)]'
                            }`}
                    >
                        {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />
                        )}
                    </div>
                    <div>
                        <div className="font-semibold text-[var(--text-primary)]">{title}</div>
                        <div className="text-sm text-[var(--text-muted)] mt-0.5">{description}</div>
                    </div>
                </div>
                <Icon className={`w-5 h-5 ${isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'}`} />
            </div>
        </button>
    );
}
