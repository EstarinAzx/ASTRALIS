// ============================================================================
// Flowchart View - Unified React Flow Diagram
// ============================================================================

import { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    type Node,
    type Edge,
    type NodeMouseHandler,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { flowchartNodeTypes } from './FlowchartNodes';
import type { FlowNode, FlowEdge } from '../../types/astralis';

interface Props {
    nodes: FlowNode[];
    edges: FlowEdge[];
    selectedNode: FlowNode | null;
    onNodeSelect: (node: FlowNode) => void;
}

// Layout positioning
function calculateLayout(nodes: FlowNode[]): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    const spacing = { x: 280, y: 180 };

    // Simple grid layout
    const nodesPerRow = 3;

    nodes.forEach((node, index) => {
        const col = index % nodesPerRow;
        const rowNum = Math.floor(index / nodesPerRow);

        // Center nodes in their row
        const nodesInThisRow = Math.min(nodesPerRow, nodes.length - rowNum * nodesPerRow);
        const startX = ((nodesPerRow - nodesInThisRow) * spacing.x) / 2;

        positions.set(node.id, {
            x: startX + col * spacing.x,
            y: rowNum * spacing.y,
        });
    });

    return positions;
}

// Convert to React Flow format
function convertToReactFlow(
    flowNodes: FlowNode[],
    flowEdges: FlowEdge[],
    selectedId: string | null
): { nodes: Node[]; edges: Edge[] } {
    const positions = calculateLayout(flowNodes);

    const nodes: Node[] = flowNodes.map((node) => {
        const pos = positions.get(node.id) || { x: 0, y: 0 };

        return {
            id: node.id,
            type: node.shape,
            position: node.position || pos,
            data: {
                label: node.label,
                subtitle: node.subtitle,
                shape: node.shape,
                color: node.color,
                isDecision: node.isDecision,
                condition: node.condition,
                isSelected: node.id === selectedId,
                nodeData: node,
            },
        };
    });

    const edges: Edge[] = flowEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: edge.animated,
        style: {
            stroke: edge.label === 'No' ? '#ef4444' : edge.label === 'Yes' ? '#22c55e' : '#64748b',
            strokeWidth: 2,
        },
        labelStyle: {
            fill: edge.label === 'No' ? '#ef4444' : edge.label === 'Yes' ? '#22c55e' : '#94a3b8',
            fontWeight: 600,
            fontSize: 11,
        },
        labelBgStyle: {
            fill: 'var(--bg-card)',
            fillOpacity: 0.9,
        },
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edge.label === 'No' ? '#ef4444' : edge.label === 'Yes' ? '#22c55e' : '#64748b',
        },
        ...(edge.label && { sourceHandle: edge.label.toLowerCase() }),
    }));

    return { nodes, edges };
}

export function FlowchartView({ nodes: flowNodes, edges: flowEdges, selectedNode, onNodeSelect }: Props) {
    const { nodes: initialNodes, edges: initialEdges } = useMemo(
        () => convertToReactFlow(flowNodes, flowEdges, selectedNode?.id ?? null),
        [flowNodes, flowEdges, selectedNode]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Update when data changes
    useEffect(() => {
        const { nodes: newNodes, edges: newEdges } = convertToReactFlow(
            flowNodes,
            flowEdges,
            selectedNode?.id ?? null
        );
        setNodes(newNodes);
        setEdges(newEdges);
    }, [flowNodes, flowEdges, selectedNode, setNodes, setEdges]);

    // Handle node click
    const onNodeClick: NodeMouseHandler = useCallback(
        (_, node) => {
            const nodeData = node.data.nodeData as FlowNode;
            if (nodeData) {
                onNodeSelect(nodeData);
            }
        },
        [onNodeSelect]
    );

    if (flowNodes.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
                No flowchart data available
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-[var(--bg-primary)]">
            {/* Stats */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)]/90 backdrop-blur border border-[var(--border-color)]">
                    <span className="text-xs text-[var(--text-muted)]">Sections: </span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{flowNodes.length}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)]/90 backdrop-blur border border-[var(--border-color)]">
                    <span className="text-xs text-[var(--text-muted)]">Connections: </span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{flowEdges.length}</span>
                </div>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={flowchartNodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                minZoom={0.2}
                maxZoom={2}
                className="bg-[var(--bg-primary)]"
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#333" gap={24} size={1} />
                <Controls className="!bg-[var(--bg-card)] !border-[var(--border-color)] !shadow-lg [&>button]:!bg-[var(--bg-card)] [&>button]:!border-[var(--border-color)] [&>button]:!fill-[var(--text-secondary)] [&>button:hover]:!bg-[var(--bg-tertiary)]" />
                <MiniMap
                    nodeColor={(node) => {
                        const colors: Record<string, string> = {
                            blue: '#3b82f6',
                            green: '#22c55e',
                            orange: '#f59e0b',
                            purple: '#a855f7',
                            red: '#ef4444',
                            cyan: '#06b6d4',
                        };
                        return colors[node.data?.color as string] || '#64748b';
                    }}
                    maskColor="rgba(0, 0, 0, 0.85)"
                    className="!bg-[var(--bg-card)] !border-[var(--border-color)]"
                />
            </ReactFlow>

            {/* Hint */}
            <div className="absolute bottom-4 left-4 z-10 text-xs text-[var(--text-muted)] bg-[var(--bg-card)]/80 backdrop-blur px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
                💡 Click any section to view its logic table
            </div>
        </div>
    );
}
