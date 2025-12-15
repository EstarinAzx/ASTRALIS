// ============================================================================
// Diagram View Component - Interactive Mermaid
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import mermaid from 'mermaid';
import type { LayerData, DiagramNode } from '../../types/astralis';

interface Props {
    layer: LayerData | undefined;
    selectedNode: DiagramNode | null;
    onNodeSelect: (node: DiagramNode) => void;
}

// Initialize mermaid
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
        background: '#0f0f1a',
        mainBkg: '#1a1a2e',
        nodeBorder: '#6366f1',
        clusterBkg: '#252542',
        clusterBorder: '#374151',
        titleColor: '#f8fafc',
    },
    flowchart: {
        curve: 'basis',
        padding: 20,
        htmlLabels: true,
        useMaxWidth: false,
    },
});

export function DiagramView({ layer, selectedNode, onNodeSelect }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!containerRef.current || !layer?.mermaidDef) return;

        const renderDiagram = async () => {
            try {
                setError(null);
                containerRef.current!.innerHTML = '';

                const id = `mermaid-${Date.now()}`;
                const { svg } = await mermaid.render(id, layer.mermaidDef);
                containerRef.current!.innerHTML = svg;

                // Add click handlers to nodes
                const svgElement = containerRef.current!.querySelector('svg');
                if (svgElement) {
                    svgElement.querySelectorAll('.node').forEach((node) => {
                        node.classList.add('cursor-pointer', 'transition-opacity', 'hover:opacity-80');
                        node.addEventListener('click', () => {
                            const nodeId = node.id.replace('flowchart-', '').split('-')[0];
                            const matchedNode = layer.nodes?.find((n) => n.id === nodeId);
                            if (matchedNode) {
                                onNodeSelect(matchedNode);
                            }
                        });
                    });
                }
            } catch (err) {
                console.error('Mermaid error:', err);
                setError('Failed to render diagram');
            }
        };

        renderDiagram();
    }, [layer, onNodeSelect]);

    // Highlight selected node
    useEffect(() => {
        if (!containerRef.current || !selectedNode) return;

        containerRef.current.querySelectorAll('.node').forEach((node) => {
            const nodeId = node.id.replace('flowchart-', '').split('-')[0];
            if (nodeId === selectedNode.id) {
                node.classList.add('ring-2', 'ring-[var(--color-primary)]');
            } else {
                node.classList.remove('ring-2', 'ring-[var(--color-primary)]');
            }
        });
    }, [selectedNode]);

    if (!layer) {
        return (
            <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
                No layer data available
            </div>
        );
    }

    return (
        <div className="relative h-full">
            {/* Diagram */}
            <div
                className="h-full overflow-auto p-8"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }}
            >
                {error ? (
                    <div className="text-center text-red-400">
                        <p>{error}</p>
                        <pre className="mt-4 p-4 rounded-lg bg-[var(--bg-card)] text-xs text-left overflow-auto max-w-2xl mx-auto">
                            {layer.mermaidDef}
                        </pre>
                    </div>
                ) : (
                    <div ref={containerRef} className="flex justify-center" />
                )}
            </div>

            {/* Zoom controls */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                <button
                    onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}
                    className="w-10 h-10 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))}
                    className="w-10 h-10 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setZoom(1)}
                    className="w-10 h-10 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                >
                    <Maximize2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
