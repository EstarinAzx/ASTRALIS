// ============================================================================
// Layer 3 - Mermaid Diagram
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { GitBranch, AlertCircle, RefreshCw } from 'lucide-react';
import mermaid from 'mermaid';
import type { Layer3Mermaid as Layer3MermaidType } from '../../../types/astralis';

interface Props {
    mermaid: Layer3MermaidType;
}

// Initialize mermaid with dark theme
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
        primaryColor: '#6366f1',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#4f46e5',
        lineColor: '#64748b',
        secondaryColor: '#1a1a2e',
        tertiaryColor: '#252542',
    },
    flowchart: {
        curve: 'basis',
        padding: 20,
    },
});

export function Layer3Mermaid({ mermaid: mermaidData }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRendered, setIsRendered] = useState(false);

    const renderDiagram = async () => {
        if (!containerRef.current) return;

        setError(null);
        setIsRendered(false);

        try {
            // Clear previous content
            containerRef.current.innerHTML = '';

            // Generate unique ID
            const id = `mermaid-${Date.now()}`;

            // Render the diagram
            const { svg } = await mermaid.render(id, mermaidData.definition);
            containerRef.current.innerHTML = svg;
            setIsRendered(true);
        } catch (err) {
            console.error('Mermaid render error:', err);
            setError(
                err instanceof Error ? err.message : 'Failed to render diagram'
            );
        }
    };

    useEffect(() => {
        renderDiagram();
    }, [mermaidData.definition]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'var(--layer-3)', opacity: 0.2 }}
                    >
                        <GitBranch className="w-5 h-5" style={{ color: 'var(--layer-3)' }} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                            🟨 LAYER 3 — FLOW DIAGRAM
                        </h3>
                        <p className="text-sm text-[var(--text-muted)]">
                            {mermaidData.chartType} visualization of the code structure
                        </p>
                    </div>
                </div>

                {error && (
                    <button
                        onClick={renderDiagram}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </button>
                )}
            </div>

            {/* Diagram container */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 min-h-[300px] flex items-center justify-center overflow-auto">
                {error ? (
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-[var(--color-error)] mx-auto mb-4" />
                        <p className="text-[var(--color-error)] font-medium mb-2">
                            Diagram Render Failed
                        </p>
                        <p className="text-[var(--text-muted)] text-sm max-w-md mb-4">
                            {error}
                        </p>

                        {/* Raw view fallback */}
                        <details className="text-left">
                            <summary className="cursor-pointer text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)]">
                                View Raw Mermaid Code
                            </summary>
                            <pre className="mt-2 p-4 rounded-lg bg-[var(--bg-tertiary)] text-xs font-mono text-[var(--text-secondary)] overflow-auto">
                                {mermaidData.definition}
                            </pre>
                        </details>
                    </div>
                ) : (
                    <div
                        ref={containerRef}
                        className={`mermaid w-full ${isRendered ? 'animate-fade-in' : ''}`}
                    />
                )}
            </div>
        </div>
    );
}
