// ============================================================================
// SubFlowchartOverlay - Drill-down view for node internals
// ============================================================================

import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    useNodesState,
    type Node,
    type Edge,
    type NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { X, Code2 } from 'lucide-react';
import type { FlowNode, FlowEdge, SectionColor } from '../../types/astralis';
import { flowchartNodeTypes } from './FlowchartNodes';

interface SubFlowchartOverlayProps {
    parentNode: FlowNode;
    sourceCode?: string;  // Full source code for highlighting
    onClose: () => void;
}

// Color config for highlighting (same as InspectorPanel)
const colorConfig: Record<SectionColor, { text: string; bg: string; highlight: string }> = {
    blue: { text: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', highlight: 'rgba(59, 130, 246, 0.25)' },
    green: { text: '#4ade80', bg: 'rgba(34, 197, 94, 0.15)', highlight: 'rgba(34, 197, 94, 0.25)' },
    orange: { text: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', highlight: 'rgba(245, 158, 11, 0.25)' },
    purple: { text: '#c084fc', bg: 'rgba(168, 85, 247, 0.15)', highlight: 'rgba(168, 85, 247, 0.25)' },
    red: { text: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', highlight: 'rgba(239, 68, 68, 0.25)' },
    cyan: { text: '#22d3ee', bg: 'rgba(6, 182, 212, 0.15)', highlight: 'rgba(6, 182, 212, 0.25)' },
};

export default function SubFlowchartOverlay({ parentNode, sourceCode, onClose }: SubFlowchartOverlayProps) {
    // Selected node for inspector
    const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
    const highlightRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to highlighted line
    useEffect(() => {
        if (highlightRef.current) {
            highlightRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [selectedNode]);

    // Convert FlowNode children to React Flow nodes (vertical layout)
    const initialNodes: Node[] = useMemo(() => {
        if (!parentNode.children) return [];

        return parentNode.children.map((child, index) => ({
            id: child.id,
            type: child.shape || 'rectangle',
            position: { x: 0, y: 120 * index },  // Vertical stacking
            data: {
                label: child.label,
                subtitle: child.subtitle,
                shape: child.shape || 'rectangle',
                color: child.color,
                lineStart: child.lineStart,
                lineEnd: child.lineEnd,
                isDecision: child.isDecision,
                isSelected: selectedNode?.id === child.id,
                nodeData: child,
            },
        }));
    }, [parentNode.children, selectedNode]);

    // Use nodes state for dragging
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

    // Update selection styling when selectedNode changes
    useEffect(() => {
        setNodes(currentNodes =>
            currentNodes.map(node => ({
                ...node,
                data: {
                    ...node.data,
                    isSelected: node.id === selectedNode?.id,
                },
            }))
        );
    }, [selectedNode, setNodes]);

    // Convert childEdges to React Flow edges
    const edges: Edge[] = useMemo(() => {
        if (!parentNode.childEdges) return [];

        return parentNode.childEdges.map((edge: FlowEdge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: 'smoothstep',
            style: { stroke: '#6366f1', strokeWidth: 2 },
            animated: true,
            label: edge.label,
            labelStyle: { fill: '#a78bfa', fontSize: 10, fontWeight: 500 },
            labelBgStyle: { fill: '#1a1a24', fillOpacity: 0.9 },
            labelBgPadding: [4, 2] as [number, number],
            labelBgBorderRadius: 3,
        }));
    }, [parentNode.childEdges]);

    // Handle node click for inspector
    const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
        const nodeData = node.data.nodeData as FlowNode;
        if (nodeData) {
            setSelectedNode(nodeData);
        }
    }, []);

    // Handle ESC key
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    // Handle backdrop click
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    if (!parentNode.children || parentNode.children.length === 0) {
        return null;
    }

    // Extract code lines from full source code for the parent's line range
    const allLines = sourceCode?.split('\n') || [];
    const parentLineStart = parentNode.lineStart || 1;
    const parentLineEnd = parentNode.lineEnd || parentLineStart;

    // Extract only the lines for this function (0-indexed, slice is exclusive end)
    const codeLines = allLines.slice(parentLineStart - 1, parentLineEnd);
    const hasCode = codeLines.length > 0;

    // Get highlight range from selected node
    const highlightStart = selectedNode?.lineStart || 0;
    const highlightEnd = selectedNode?.lineEnd || 0;
    const colors = selectedNode?.color
        ? colorConfig[selectedNode.color] || colorConfig.purple
        : colorConfig.purple;

    return (
        <div
            className="sub-flowchart-overlay"
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="dialog"
            aria-modal="true"
            aria-label={`Sub-flowchart for ${parentNode.label}`}
        >
            <div className="sub-flowchart-container">
                {/* Header */}
                <div className="sub-flowchart-header">
                    <div>
                        <h3>{parentNode.label}</h3>
                        <span className="sub-flowchart-subtitle">
                            Lines {parentNode.lineStart}-{parentNode.lineEnd}
                        </span>
                    </div>
                    <button
                        className="sub-flowchart-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Main content with flow and inspector side by side */}
                <div className="sub-flowchart-body">
                    {/* React Flow - now draggable */}
                    <div className="sub-flowchart-flow">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            nodeTypes={flowchartNodeTypes}
                            onNodeClick={onNodeClick}
                            fitView
                            fitViewOptions={{ padding: 0.3 }}
                            proOptions={{ hideAttribution: true }}
                            nodesDraggable={true}
                            nodesConnectable={false}
                        >
                            <Background color="#334155" gap={20} />
                            <Controls showInteractive={false} />
                        </ReactFlow>
                    </div>

                    {/* Inspector panel with full code and line highlighting */}
                    <div className="sub-flowchart-inspector">
                        {/* Header with label */}
                        <div className="sub-inspector-header">
                            <Code2 size={16} />
                            <span>{selectedNode?.label || 'Source Code'}</span>
                        </div>

                        {/* Meta tags */}
                        {selectedNode && (
                            <div className="sub-inspector-meta">
                                {selectedNode.subtitle && (
                                    <span className="sub-inspector-tag" style={{ backgroundColor: colors.bg, color: colors.text }}>
                                        {selectedNode.subtitle}
                                    </span>
                                )}
                                {highlightStart > 0 && (
                                    <span className="sub-inspector-lines">
                                        Lines {highlightStart}-{highlightEnd || highlightStart}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Code with line highlighting */}
                        <div className="sub-inspector-code-container">
                            {hasCode ? (
                                <div className="sub-inspector-code-wrapper">
                                    {/* Line numbers */}
                                    <div className="sub-inspector-line-numbers">
                                        {codeLines.map((_, index) => {
                                            const lineNum = parentLineStart + index;
                                            const isHighlighted = selectedNode && lineNum >= highlightStart && lineNum <= highlightEnd;
                                            return (
                                                <div
                                                    key={lineNum}
                                                    className="sub-line-num"
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

                                    {/* Code content */}
                                    <div className="sub-inspector-code-content">
                                        {codeLines.map((line, index) => {
                                            const lineNum = parentLineStart + index;
                                            const isHighlighted = selectedNode && lineNum >= highlightStart && lineNum <= highlightEnd;
                                            const isFirst = lineNum === highlightStart;

                                            return (
                                                <div
                                                    key={lineNum}
                                                    ref={isFirst ? highlightRef : undefined}
                                                    className="sub-code-line"
                                                    style={{
                                                        color: isHighlighted ? 'var(--text-primary)' : 'var(--text-muted)',
                                                        backgroundColor: isHighlighted ? colors.highlight : 'transparent',
                                                        borderLeft: isHighlighted ? `2px solid ${colors.text}` : '2px solid transparent',
                                                    }}
                                                >
                                                    {line || ' '}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="sub-inspector-empty">
                                    Click a node to highlight its code
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer hint */}
                <div className="sub-flowchart-footer">
                    Drag nodes to rearrange • Press ESC to close
                </div>
            </div>
        </div>
    );
}
