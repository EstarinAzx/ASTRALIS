// ============================================================================
// Layer 0 - Imports Table
// ============================================================================

import { Package } from 'lucide-react';
import type { Layer0Import } from '../../../types/astralis';

interface Props {
    imports: Layer0Import[];
}

export function Layer0Imports({ imports }: Props) {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--layer-0)', opacity: 0.2 }}
                >
                    <Package className="w-5 h-5" style={{ color: 'var(--layer-0)' }} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        🟦 LAYER 0 — IMPORTS (Setup Phase)
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">
                        Dependencies and modules loaded by this file
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-[var(--border-color)] overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[var(--bg-tertiary)]">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-primary)]">
                                Import
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-primary)]">
                                Source
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-primary)]">
                                Type
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-primary)]">
                                Purpose
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {imports.map((imp, index) => (
                            <tr
                                key={index}
                                className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] transition-colors"
                            >
                                <td className="px-4 py-3">
                                    <code className="text-sm font-mono text-[var(--color-accent)]">
                                        {imp.name}
                                    </code>
                                </td>
                                <td className="px-4 py-3">
                                    <code className="text-sm font-mono text-[var(--text-secondary)]">
                                        {imp.source}
                                    </code>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                                        {imp.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                                    {imp.purpose}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
