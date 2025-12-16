// ============================================================================
// Diagram View Component - React Flow (Professional Interactive Diagrams)
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
import CustomNode from './CustomNode';
import type { LayerData, DiagramNode } from '../../types/astralis';

interface Props {
    layer: LayerData | undefined;
    selectedNode: DiagramNode | null;
    onNodeSelect: (node: DiagramNode) => void;
}

// Register custom node types
const nodeTypes = {
    custom: CustomNode,
};

// Convert layer data to React Flow format
function convertToReactFlow(layer: LayerData): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (!layer.nodes || layer.nodes.length === 0) {
        return { nodes, edges };
    }

    // Calculate positions in a tree layout
    const nodeCount = layer.nodes.length;
    const spacing = { x: 200, y: 120 };

    layer.nodes.forEach((node, index) => {
        // Simple layout: first node at top, others below in a row
        let x = 0;
        let y = 0;

        if (index === 0) {
            // First node centered at top
            x = ((nodeCount - 1) * spacing.x) / 2;
            y = 0;
        } else {
            // Other nodes in a row below
            x = (index - 1) * spacing.x;
            y = spacing.y;
        }

        nodes.push({
            id: node.id,
            type: 'custom',
            position: { x, y },
            data: {
                label: node.label,
                type: node.type,
                // Store the full node data for click handling
                nodeData: node,
            },
        });

        // Create edges from first node to all others (simple tree)
        if (index > 0 && layer.nodes[0]) {
            edges.push({
                id: `${layer.nodes[0].id}-${node.id}`,
                source: layer.nodes[0].id,
                target: node.id,
                animated: false,
                style: { stroke: 'var(--border-color)', strokeWidth: 2 },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: 'var(--border-color)',
                },
            });
        }
    });

    return { nodes, edges };
}

export function DiagramView({ layer, selectedNode, onNodeSelect }: Props) {
    const { nodes: initialNodes, edges: initialEdges } = useMemo(
        () => (layer ? convertToReactFlow(layer) : { nodes: [], edges: [] }),
        [layer]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Update nodes when layer changes
    useEffect(() => {
        if (layer) {
            const { nodes: newNodes, edges: newEdges } = convertToReactFlow(layer);
            setNodes(newNodes);
            setEdges(newEdges);
        }
    }, [layer, setNodes, setEdges]);

    // Update selected state
    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    isSelected: selectedNode?.id === node.id,
                },
            }))
        );
    }, [selectedNode, setNodes]);

    // Handle node click
    const onNodeClick: NodeMouseHandler = useCallback(
        (_, node) => {
            console.log('Node clicked:', node.id, node.data);
            const nodeData = node.data.nodeData as DiagramNode;
            if (nodeData) {
                onNodeSelect(nodeData);
            }
        },
        [onNodeSelect]
    );

    if (!layer) {
        return (
            <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
                No layer data available
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-[var(--bg-primary)]">
            {/* Layer info */}
            <div className="absolute top-4 left-4 z-10 p-3 rounded-lg bg-[var(--bg-card)]/90 backdrop-blur border border-[var(--border-color)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{layer.title}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-xs">{layer.description}</p>
            </div>

            {/* Node count */}
            {layer.nodes && layer.nodes.length > 0 && (
                <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs font-medium">
                    {layer.nodes.length} node{layer.nodes.length > 1 ? 's' : ''}
                </div>
            )}

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.4 }}
                minZoom={0.3}
                maxZoom={2}
                className="bg-[var(--bg-primary)]"
                proOptions={{ hideAttribution: true }}
            >
                <Background color="var(--border-color)" gap={20} size={1} />
                <Controls
                    className="!bg-[var(--bg-card)] !border-[var(--border-color)] !shadow-lg"
                />
                <MiniMap
                    nodeColor={(node) => {
                        const colors: Record<string, string> = {
                            controller: '#6366f1',
                            service: '#8b5cf6',
                            method: '#ec4899',
                            function: '#14b8a6',
                            class: '#f59e0b',
                            module: '#3b82f6',
                        };
                        return colors[node.data?.type as string] || '#64748b';
                    }}
                    maskColor="rgba(0, 0, 0, 0.8)"
                    className="!bg-[var(--bg-card)] !border-[var(--border-color)]"
                />
            </ReactFlow>

            {/* Hint */}
            <div className="absolute bottom-4 left-4 z-10 text-xs text-[var(--text-muted)] bg-[var(--bg-card)]/80 px-2 py-1 rounded">
                💡 Click nodes to inspect • Drag to move • Scroll to zoom
            </div>
        </div>
    );
}
