// ============================================================================
// Layer 4 - Logic Table (Sectioned with Emojis)
// ============================================================================

import { Table2 } from 'lucide-react';
import type { Layer4Logic as Layer4LogicType } from '../../../types/astralis';

interface Props {
    logic: Layer4LogicType;
}

export function Layer4Logic({ logic }: Props) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--layer-4)', opacity: 0.2 }}
                >
                    <Table2 className="w-5 h-5" style={{ color: 'var(--layer-4)' }} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        🟩 LAYER 4 — LOGIC TABLE
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">
                        Step-by-step breakdown with line numbers
                    </p>
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-6">
                {logic.sections.map((section, sectionIndex) => (
                    <div
                        key={sectionIndex}
                        className="rounded-xl border border-[var(--border-color)] overflow-hidden"
                    >
                        {/* Section header */}
                        <div
                            className="px-4 py-3 font-semibold text-[var(--text-primary)]"
                            style={{
                                backgroundColor: sectionIndex === 0
                                    ? 'rgba(59, 130, 246, 0.2)' // Blue for imports
                                    : 'rgba(34, 197, 94, 0.2)', // Green for other sections
                            }}
                        >
                            {section.title}
                        </div>

                        {/* Table */}
                        <table className="w-full">
                            <thead>
                                <tr className="bg-[var(--bg-tertiary)]">
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider w-20">
                                        Line
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                        Step
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                        Trigger / Condition
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                        Action
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                        Output / Result
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {section.rows.map((row, rowIndex) => (
                                    <tr
                                        key={rowIndex}
                                        className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <code className="text-xs font-mono px-2 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--color-accent)]">
                                                {row.line}
                                            </code>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                                            {row.step}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                                            {row.trigger}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                                            {row.action}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                                            {row.result}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
}
