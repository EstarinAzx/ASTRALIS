// ============================================================================
// SubFlowchartOverlay - Drill-down view for node internals
// ============================================================================

import { useCallback, useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    type Node,
    type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { X } from 'lucide-react';
import type { FlowNode, FlowEdge } from '../../types/astralis';
import { flowchartNodeTypes } from './FlowchartNodes';

interface SubFlowchartOverlayProps {
    parentNode: FlowNode;
    onClose: () => void;
}

export default function SubFlowchartOverlay({ parentNode, onClose }: SubFlowchartOverlayProps) {
    // Convert FlowNode children to React Flow nodes
    const nodes: Node[] = useMemo(() => {
        if (!parentNode.children) return [];

        return parentNode.children.map((child, index) => ({
            id: child.id,
            type: child.shape === 'diamond' ? 'decisionNode'
                : child.shape === 'hexagon' ? 'asyncNode'
                    : 'standardNode',
            position: { x: 250 * index, y: 100 },
            data: {
                label: child.label,
                subtitle: child.subtitle,
                color: child.color,
                lineStart: child.lineStart,
                lineEnd: child.lineEnd,
                isDecision: child.isDecision,
                // Mark the "next section" node specially
                isNextSection: child.subtitle === 'Next Section',
            },
        }));
    }, [parentNode.children]);

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
        }));
    }, [parentNode.childEdges]);

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

                {/* React Flow */}
                <div className="sub-flowchart-flow">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={flowchartNodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.3 }}
                        proOptions={{ hideAttribution: true }}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={false}
                    >
                        <Background color="#334155" gap={20} />
                        <Controls showInteractive={false} />
                    </ReactFlow>
                </div>

                {/* Footer hint */}
                <div className="sub-flowchart-footer">
                    Press ESC or click outside to close
                </div>
            </div>
        </div>
    );
}
