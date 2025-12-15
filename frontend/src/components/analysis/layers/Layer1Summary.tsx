// ============================================================================
// Layer 1 - What & Why Summary
// ============================================================================

import { FileText, Gauge } from 'lucide-react';
import type { Layer1Summary as Layer1SummaryType } from '../../../types/astralis';

interface Props {
    summary: Layer1SummaryType;
}

export function Layer1Summary({ summary }: Props) {
    const complexityColor =
        summary.complexity <= 3
            ? 'var(--color-success)'
            : summary.complexity <= 6
                ? 'var(--color-warning)'
                : 'var(--color-error)';

    const complexityLabel =
        summary.complexity <= 3
            ? 'Low'
            : summary.complexity <= 6
                ? 'Medium'
                : 'High';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--layer-1)', opacity: 0.2 }}
                >
                    <FileText className="w-5 h-5" style={{ color: 'var(--layer-1)' }} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        🟪 LAYER 1 — WHAT & WHY
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">
                        High-level understanding of this code
                    </p>
                </div>
            </div>

            {/* Content cards */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* What */}
                <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <h4 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        What does it do?
                    </h4>
                    <p className="text-[var(--text-primary)] leading-relaxed">
                        {summary.what}
                    </p>
                </div>

                {/* Why */}
                <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <h4 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        Why does it exist?
                    </h4>
                    <p className="text-[var(--text-primary)] leading-relaxed">
                        {summary.why}
                    </p>
                </div>
            </div>

            {/* Complexity meter */}
            <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-[var(--text-muted)]" />
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                            Complexity Score
                        </span>
                    </div>
                    <span
                        className="text-2xl font-bold"
                        style={{ color: complexityColor }}
                    >
                        {summary.complexity}/10
                    </span>
                </div>

                {/* Progress bar */}
                <div className="h-3 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${summary.complexity * 10}%`,
                            backgroundColor: complexityColor,
                        }}
                    />
                </div>

                <p className="mt-2 text-sm text-[var(--text-muted)]">
                    {complexityLabel} complexity —{' '}
                    {summary.complexity <= 3
                        ? 'Easy to understand and maintain'
                        : summary.complexity <= 6
                            ? 'Moderate complexity, some attention needed'
                            : 'Complex logic, careful review recommended'}
                </p>
            </div>
        </div>
    );
}
