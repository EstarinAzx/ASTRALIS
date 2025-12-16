// ============================================================================
// Inspector Panel - Full Code Viewer with Line Highlighting
// ============================================================================

import { useEffect, useRef } from 'react';
import { Code2, Table2, FileText, Box, AlertCircle } from 'lucide-react';
import type { FlowNode, SectionColor } from '../../types/astralis';

interface Props {
    node: FlowNode | null;
    sourceCode?: string;  // Full source code for highlighting
}

const colorConfig: Record<SectionColor, { text: string; bg: string; highlight: string }> = {
    blue: { text: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', highlight: 'rgba(59, 130, 246, 0.25)' },
    green: { text: '#4ade80', bg: 'rgba(34, 197, 94, 0.15)', highlight: 'rgba(34, 197, 94, 0.25)' },
    orange: { text: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', highlight: 'rgba(245, 158, 11, 0.25)' },
    purple: { text: '#c084fc', bg: 'rgba(168, 85, 247, 0.15)', highlight: 'rgba(168, 85, 247, 0.25)' },
    red: { text: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', highlight: 'rgba(239, 68, 68, 0.25)' },
    cyan: { text: '#22d3ee', bg: 'rgba(6, 182, 212, 0.15)', highlight: 'rgba(6, 182, 212, 0.25)' },
};

export function InspectorPanel({ node, sourceCode }: Props) {
    const codeContainerRef = useRef<HTMLDivElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to highlighted section
    useEffect(() => {
        if (highlightRef.current && codeContainerRef.current) {
            highlightRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [node]);

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

    // Safe access with defaults
    const colors = colorConfig[node.color] || colorConfig.blue;
    const logicTable = node.logicTable || [];
    const narrative = node.narrative || 'No description available for this node.';
    const lineStart = node.lineStart || 0;
    const lineEnd = node.lineEnd || 0;

    // Split source code into lines for rendering with highlighting
    const codeLines = sourceCode?.split('\n') || [];
    const hasSourceCode = codeLines.length > 0;

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
                    {node.label || 'Unnamed Node'}
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
                    {narrative}
                </p>
            </div>

            {/* Logic Table */}
            <div className="p-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2 mb-3">
                    <Table2 className="w-4 h-4" style={{ color: colors.text }} />
                    <span className="font-medium text-[var(--text-primary)] text-sm">Logic Table</span>
                    <span className="ml-auto text-xs text-[var(--text-muted)]">
                        {logicTable.length} step{logicTable.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {logicTable.length > 0 ? (
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
                                {logicTable.map((step, i) => (
                                    <tr key={i} className="border-t border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]/50">
                                        <td className="px-2 py-2 font-mono text-[var(--text-muted)]">{step.step || i + 1}</td>
                                        <td className="px-2 py-2 text-[var(--text-secondary)]">{step.trigger || '-'}</td>
                                        <td className="px-2 py-2 text-[var(--text-secondary)]">
                                            {step.action || '-'}
                                            {step.codeRef && (
                                                <code className="ml-1 px-1 py-0.5 rounded text-[10px] bg-[var(--bg-tertiary)]" style={{ color: colors.text }}>
                                                    {step.codeRef}
                                                </code>
                                            )}
                                        </td>
                                        <td className="px-2 py-2 text-[var(--text-secondary)]">{step.output || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-6 text-[var(--text-muted)]">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No logic steps defined for this node</p>
                    </div>
                )}
            </div>

            {/* Source Code with Line Highlighting */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="font-medium text-[var(--text-primary)] text-sm">Source Code</span>
                    </div>
                    {lineStart > 0 && lineEnd > 0 && (
                        <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: colors.bg, color: colors.text }}
                        >
                            Lines {lineStart}-{lineEnd}
                        </span>
                    )}
                </div>

                <div
                    ref={codeContainerRef}
                    className="rounded-lg bg-[#0d0d14] border border-[var(--border-color)] overflow-auto max-h-72"
                >
                    <div className="flex">
                        {/* Line numbers column */}
                        <div className="flex-shrink-0 py-2 pr-2 text-right border-r border-[var(--border-color)]">
                            {codeLines.map((_, index) => {
                                const lineNum = index + 1;
                                const isHighlighted = hasSourceCode && lineNum >= lineStart && lineNum <= lineEnd;
                                return (
                                    <div
                                        key={lineNum}
                                        className="px-2 text-[10px] font-mono leading-5"
                                        style={{
                                            color: isHighlighted ? colors.text : 'var(--text-muted)',
                                            backgroundColor: isHighlighted ? colors.highlight : 'transparent',
                                        }}
                                    >
                                        {lineNum}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Code content column */}
                        <div className="flex-1 py-2 pl-3 pr-4 overflow-x-auto">
                            {codeLines.map((line, index) => {
                                const lineNum = index + 1;
                                const isHighlighted = hasSourceCode && lineNum >= lineStart && lineNum <= lineEnd;
                                const isFirstHighlight = lineNum === lineStart;

                                return (
                                    <div
                                        key={lineNum}
                                        ref={isFirstHighlight ? highlightRef : undefined}
                                        className="text-[11px] font-mono leading-5 whitespace-pre"
                                        style={{
                                            color: isHighlighted ? 'var(--text-primary)' : 'var(--text-muted)',
                                            backgroundColor: isHighlighted ? colors.highlight : 'transparent',
                                            borderLeft: isHighlighted ? `2px solid ${colors.text}` : '2px solid transparent',
                                            paddingLeft: '8px',
                                            marginLeft: '-10px',
                                        }}
                                    >
                                        {line || ' '}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Fallback if no source code */}
                    {!hasSourceCode && (
                        <div className="p-4 text-center text-[var(--text-muted)] text-sm">
                            No source code available. Generate a new analysis to see the full code.
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
