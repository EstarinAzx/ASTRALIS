// ============================================================================
// Layer 2 - Narrative Journey
// ============================================================================

import { Map, ArrowRight } from 'lucide-react';
import type { Layer2Journey as Layer2JourneyType } from '../../../types/astralis';

interface Props {
    journey: Layer2JourneyType;
}

export function Layer2Journey({ journey }: Props) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--layer-2)', opacity: 0.2 }}
                >
                    <Map className="w-5 h-5" style={{ color: 'var(--layer-2)' }} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        🩷 LAYER 2 — NARRATIVE JOURNEY
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">
                        Plain English walkthrough of the execution flow
                    </p>
                </div>
            </div>

            {/* Journey steps */}
            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-[var(--layer-2)] via-[var(--layer-2)]/50 to-transparent" />

                <div className="space-y-4">
                    {journey.map((step, index) => (
                        <div key={index} className="flex gap-4 relative">
                            {/* Step number */}
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white z-10"
                                style={{ backgroundColor: 'var(--layer-2)' }}
                            >
                                {index + 1}
                            </div>

                            {/* Step content */}
                            <div className="flex-1 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-3">
                                <p className="text-[var(--text-primary)] leading-relaxed flex-1">
                                    {step}
                                </p>
                                {index < journey.length - 1 && (
                                    <ArrowRight className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
