// ============================================================================
// Inspector Panel - Node details sidebar
// ============================================================================

import { Map, Table2, Code2 } from 'lucide-react';
import type { DiagramNode } from '../../types/astralis';

interface Props {
    node: DiagramNode | null;
}

export function InspectorPanel({ node }: Props) {
    if (!node) {
        return (
            <aside className="w-80 border-l border-[var(--border-color)] bg-[var(--bg-card)] p-6">
                <div className="h-full flex items-center justify-center text-center text-[var(--text-muted)]">
                    <p>Click a node in the diagram to view its details</p>
                </div>
            </aside>
        );
    }

    return (
        <aside className="w-96 border-l border-[var(--border-color)] bg-[var(--bg-card)] overflow-auto">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-color)]">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Inspector
                </div>
                <div className="text-sm text-[var(--text-secondary)]">
                    Node: <span className="text-[var(--color-accent)]">{node.label}</span>
                </div>
            </div>

            {/* Narrative Journey */}
            <div className="p-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2 mb-3">
                    <Map className="w-4 h-4 text-[var(--layer-2)]" />
                    <span className="font-medium text-[var(--text-primary)]">Narrative Journey</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {node.narrative || 'No narrative available for this node.'}
                </p>
            </div>

            {/* Logic Table */}
            <div className="p-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2 mb-3">
                    <Table2 className="w-4 h-4 text-[var(--layer-4)]" />
                    <span className="font-medium text-[var(--text-primary)]">Logic Table</span>
                </div>

                {node.logicTable && node.logicTable.length > 0 ? (
                    <div className="rounded-lg border border-[var(--border-color)] overflow-hidden">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-[var(--bg-tertiary)]">
                                    <th className="px-3 py-2 text-left text-[var(--text-muted)] font-medium">Condition</th>
                                    <th className="px-3 py-2 text-left text-[var(--text-muted)] font-medium">Action</th>
                                    <th className="px-3 py-2 text-left text-[var(--text-muted)] font-medium">Out</th>
                                </tr>
                            </thead>
                            <tbody>
                                {node.logicTable.map((row, i) => (
                                    <tr key={i} className="border-t border-[var(--border-color)]">
                                        <td className="px-3 py-2 text-[var(--text-secondary)]">{row.condition}</td>
                                        <td className="px-3 py-2 text-[var(--text-secondary)]">{row.action}</td>
                                        <td className="px-3 py-2">
                                            <span
                                                className={`px-1.5 py-0.5 rounded text-xs font-medium ${row.outputType === 'next'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : row.outputType === 'exit'
                                                            ? 'bg-red-500/20 text-red-400'
                                                            : 'bg-yellow-500/20 text-yellow-400'
                                                    }`}
                                            >
                                                {row.outputType === 'next' ? 'Next' : row.outputType === 'exit' ? 'Exit' : 'Loop'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-[var(--text-muted)]">No logic table available.</p>
                )}
            </div>

            {/* Source Code */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-[var(--layer-5)]" />
                        <span className="font-medium text-[var(--text-primary)]">Source Code</span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                        Line {node.lineStart}-{node.lineEnd}
                    </span>
                </div>

                {node.codeSnippet ? (
                    <pre className="p-3 rounded-lg bg-[#1e1e2e] text-xs font-mono overflow-x-auto">
                        <code className="text-[var(--text-secondary)] whitespace-pre">
                            {node.codeSnippet}
                        </code>
                    </pre>
                ) : (
                    <p className="text-sm text-[var(--text-muted)]">No code snippet available.</p>
                )}
            </div>
        </aside>
    );
}
