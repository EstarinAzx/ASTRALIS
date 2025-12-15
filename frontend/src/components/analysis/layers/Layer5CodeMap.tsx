// ============================================================================
// Layer 5 - Code Map (Snippets with Line Numbers)
// ============================================================================

import { Code2 } from 'lucide-react';
import type { Layer5CodeMap as Layer5CodeMapType } from '../../../types/astralis';

interface Props {
    codemap: Layer5CodeMapType;
}

export function Layer5CodeMap({ codemap }: Props) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--layer-5)', opacity: 0.2 }}
                >
                    <Code2 className="w-5 h-5" style={{ color: 'var(--layer-5)' }} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        🩵 LAYER 5 — CODE MAP
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">
                        Source code snippets mapped to logic steps
                    </p>
                </div>
            </div>

            {/* Code entries */}
            <div className="space-y-4">
                {codemap.map((entry, index) => (
                    <div
                        key={index}
                        className="rounded-xl border border-[var(--border-color)] overflow-hidden"
                    >
                        {/* Entry header */}
                        <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-tertiary)]">
                            <div className="flex items-center gap-3">
                                <code className="text-xs font-mono px-2 py-1 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
                                    Lines {entry.lineStart}
                                    {entry.lineEnd !== entry.lineStart && `–${entry.lineEnd}`}
                                </code>
                                <span className="text-sm text-[var(--text-secondary)]">
                                    {entry.note}
                                </span>
                            </div>
                        </div>

                        {/* Code snippet */}
                        <div className="relative">
                            {/* Line numbers */}
                            <div className="absolute left-0 top-0 bottom-0 w-12 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col items-end pr-2 pt-4 pb-4 text-xs font-mono text-[var(--text-muted)]">
                                {Array.from(
                                    { length: entry.lineEnd - entry.lineStart + 1 },
                                    (_, i) => (
                                        <div key={i} className="leading-6">
                                            {entry.lineStart + i}
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Code */}
                            <pre className="p-4 pl-16 bg-[var(--bg-card)] overflow-x-auto">
                                <code className="text-sm font-mono text-[var(--text-primary)] leading-6 whitespace-pre">
                                    {entry.snippet}
                                </code>
                            </pre>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
