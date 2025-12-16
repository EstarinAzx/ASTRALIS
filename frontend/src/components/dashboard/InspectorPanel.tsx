// ============================================================================
// Inspector Panel - Logic Table Display
// ============================================================================

import { Code2, Table2, FileText, Box } from 'lucide-react';
import type { FlowNode, SectionColor } from '../../types/astralis';

interface Props {
    node: FlowNode | null;
}

const colorConfig: Record<SectionColor, { text: string; bg: string }> = {
    blue: { text: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)' },
    green: { text: '#4ade80', bg: 'rgba(34, 197, 94, 0.15)' },
    orange: { text: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' },
    purple: { text: '#c084fc', bg: 'rgba(168, 85, 247, 0.15)' },
    red: { text: '#f87171', bg: 'rgba(239, 68, 68, 0.15)' },
    cyan: { text: '#22d3ee', bg: 'rgba(6, 182, 212, 0.15)' },
};

export function InspectorPanel({ node }: Props) {
    if (!node) {
        return (
            <aside className="w-96 border-l border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-center">
                <div className="text-center p-6">
                    <Box className="w-12 h-12 mx-auto mb-3 text-[var(--text-muted)] opacity-50" />
                    <p className="text-[var(--text-muted)] text-sm">
                        Click a section in the flowchart<br />to view its details
                    </p>
                </div>
            </aside>
        );
    }

    const colors = colorConfig[node.color];

    return (
        <aside className="w-96 border-l border-[var(--border-color)] bg-[var(--bg-card)] overflow-auto">
            {/* Header */}
            <div
                className="p-4 border-b border-[var(--border-color)]"
                style={{ backgroundColor: colors.bg }}
            >
                <div className="flex items-center gap-2 mb-1">
                    <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: colors.text }}
                    />
                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                        Inspector
                    </span>
                </div>
                <div className="font-semibold" style={{ color: colors.text }}>
                    {node.label}
                </div>
                {node.subtitle && (
                    <div className="text-sm text-[var(--text-secondary)] mt-0.5">
                        {node.subtitle}
                    </div>
                )}
            </div>

            {/* Narrative */}
            <div className="p-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="font-medium text-[var(--text-primary)] text-sm">Narrative</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {node.narrative}
                </p>
            </div>

            {/* Logic Table */}
            <div className="p-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2 mb-3">
                    <Table2 className="w-4 h-4" style={{ color: colors.text }} />
                    <span className="font-medium text-[var(--text-primary)] text-sm">Logic Table</span>
                    <span className="ml-auto text-xs text-[var(--text-muted)]">
                        {node.logicTable.length} step{node.logicTable.length !== 1 ? 's' : ''}
                    </span>
                </div>

                <div className="rounded-lg border border-[var(--border-color)] overflow-hidden">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-[var(--bg-tertiary)]">
                                <th className="px-2 py-2 text-left text-[var(--text-muted)] font-medium w-10">Step</th>
                                <th className="px-2 py-2 text-left text-[var(--text-muted)] font-medium">Trigger</th>
                                <th className="px-2 py-2 text-left text-[var(--text-muted)] font-medium">Action</th>
                                <th className="px-2 py-2 text-left text-[var(--text-muted)] font-medium">Output</th>
                            </tr>
                        </thead>
                        <tbody>
                            {node.logicTable.map((step, i) => (
                                <tr key={i} className="border-t border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]/50">
                                    <td className="px-2 py-2 font-mono text-[var(--text-muted)]">{step.step}</td>
                                    <td className="px-2 py-2 text-[var(--text-secondary)]">{step.trigger}</td>
                                    <td className="px-2 py-2 text-[var(--text-secondary)]">
                                        {step.action}
                                        {step.codeRef && (
                                            <code className="ml-1 px-1 py-0.5 rounded text-[10px] bg-[var(--bg-tertiary)]" style={{ color: colors.text }}>
                                                {step.codeRef}
                                            </code>
                                        )}
                                    </td>
                                    <td className="px-2 py-2 text-[var(--text-secondary)]">{step.output}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Source Code */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="font-medium text-[var(--text-primary)] text-sm">Source Code</span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                        Lines {node.lineStart}-{node.lineEnd}
                    </span>
                </div>

                <pre className="p-3 rounded-lg bg-[#0d0d14] border border-[var(--border-color)] text-xs font-mono overflow-x-auto max-h-48">
                    <code className="text-[var(--text-secondary)] whitespace-pre">
                        {node.codeSnippet || '// No code snippet available'}
                    </code>
                </pre>
            </div>
        </aside>
    );
}
