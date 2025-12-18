// ============================================================================
// Flowchart View - Horizontal Layout with Dot Grid Background
// ============================================================================

import { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    useNodesState,
    useEdgesState,
    type Node,
    type Edge,
    type NodeMouseHandler,
    ConnectionLineType,
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

// ============================================================================
// Horizontal Tree Layout Algorithm (Left-to-Right)
// ============================================================================
function calculateHorizontalLayout(
    nodes: FlowNode[],
    edges: FlowEdge[]
): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();

    if (nodes.length === 0) return positions;

    // Build node lookup with lineStart
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Sort nodes by lineStart to establish natural order
    const sortedNodes = [...nodes].sort((a, b) => (a.lineStart || 0) - (b.lineStart || 0));

    // Build adjacency map
    const children = new Map<string, string[]>();
    const parents = new Map<string, string[]>();

    edges.forEach(edge => {
        if (!children.has(edge.source)) children.set(edge.source, []);
        children.get(edge.source)!.push(edge.target);

        if (!parents.has(edge.target)) parents.set(edge.target, []);
        parents.get(edge.target)!.push(edge.source);
    });

    // Assign levels (columns) based on edges - BFS from roots
    const levels = new Map<string, number>();
    const processed = new Set<string>();

    // Find root nodes (no parents)
    const roots = sortedNodes.filter(n => !parents.has(n.id) || parents.get(n.id)!.length === 0);
    if (roots.length === 0 && sortedNodes.length > 0) {
        roots.push(sortedNodes[0]);
    }

    const queue: { id: string; level: number }[] = roots.map((r) => ({ id: r.id, level: 0 }));

    while (queue.length > 0) {
        const { id, level } = queue.shift()!;
        if (processed.has(id)) continue;
        processed.add(id);

        // Use max level if node appears multiple times
        if (!levels.has(id) || level > levels.get(id)!) {
            levels.set(id, level);
        }

        const childIds = children.get(id) || [];
        childIds.forEach(childId => {
            if (nodeMap.has(childId) && !processed.has(childId)) {
                queue.push({ id: childId, level: level + 1 });
            }
        });
    }

    // Handle disconnected nodes
    let maxLevel = Math.max(...Array.from(levels.values()), 0);
    sortedNodes.forEach((node, sortIndex) => {
        if (!levels.has(node.id)) {
            const proportionalLevel = Math.floor((sortIndex / sortedNodes.length) * (maxLevel + 2));
            levels.set(node.id, proportionalLevel);
        }
    });

    // Group nodes by level (column)
    const levelGroups = new Map<number, string[]>();
    levels.forEach((level, nodeId) => {
        if (!levelGroups.has(level)) levelGroups.set(level, []);
        levelGroups.get(level)!.push(nodeId);
    });

    // Sort nodes within each level by lineStart
    levelGroups.forEach((nodeIds) => {
        nodeIds.sort((a, b) => {
            const nodeA = nodeMap.get(a);
            const nodeB = nodeMap.get(b);
            return ((nodeA?.lineStart || 0) - (nodeB?.lineStart || 0));
        });
    });

    // Position nodes - HORIZONTAL layout (X for columns, Y for rows within column)
    const nodeWidth = 200;
    const nodeHeight = 60;
    const horizontalSpacing = 100;  // Space between columns
    const verticalSpacing = 40;     // Space between nodes in same column

    levelGroups.forEach((nodeIds, level) => {
        const totalHeight = nodeIds.length * nodeHeight + (nodeIds.length - 1) * verticalSpacing;
        const startY = -totalHeight / 2 + nodeHeight / 2;

        nodeIds.forEach((nodeId, index) => {
            positions.set(nodeId, {
                x: level * (nodeWidth + horizontalSpacing),  // Columns go left-to-right
                y: startY + index * (nodeHeight + verticalSpacing),  // Stack vertically
            });
        });
    });

    return positions;
}

// ============================================================================
// Convert to React Flow format
// ============================================================================
function convertToReactFlow(
    flowNodes: FlowNode[],
    flowEdges: FlowEdge[],
    selectedId: string | null
): { nodes: Node[]; edges: Edge[] } {
    const positions = calculateHorizontalLayout(flowNodes, flowEdges);

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

    // Create smooth bezier edges with subtle gray styling
    const edges: Edge[] = flowEdges.map((edge, index) => ({
        id: edge.id || `edge-${index}`,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: false,
        type: 'bezier',  // Smooth curves
        style: {
            stroke: '#3a3a4a',
            strokeWidth: 1.5,
        },
        labelStyle: {
            fill: '#6a6a7a',
            fontWeight: 500,
            fontSize: 10,
            background: 'transparent',
        },
        labelBgStyle: {
            fill: '#1a1a24',
            fillOpacity: 0.9,
        },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
        // Route from correct handle for decision nodes
        sourceHandle: edge.sourceHandle ||
            (edge.label?.toLowerCase() === 'yes' ? 'yes' :
                edge.label?.toLowerCase() === 'no' ? 'no' : undefined),
    }));

    return { nodes, edges };
}

// ============================================================================
// Component
// ============================================================================
export function FlowchartView({ nodes: flowNodes, edges: flowEdges, selectedNode, onNodeSelect }: Props) {
    // Only recalculate on actual data change (not selection change)
    const { nodes: initialNodes, edges: initialEdges } = useMemo(
        () => convertToReactFlow(flowNodes, flowEdges, null),
        [flowNodes, flowEdges]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Reset positions when raw data changes
    useEffect(() => {
        const { nodes: newNodes, edges: newEdges } = convertToReactFlow(flowNodes, flowEdges, null);
        setNodes(newNodes);
        setEdges(newEdges);
    }, [flowNodes, flowEdges, setNodes, setEdges]);

    // Update selection highlighting WITHOUT resetting positions
    useEffect(() => {
        setNodes(currentNodes =>
            currentNodes.map(node => ({
                ...node,
                data: {
                    ...node.data,
                    isSelected: node.id === selectedNode?.id
                }
            }))
        );
    }, [selectedNode, setNodes]);

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
            <div className="h-full flex items-center justify-center text-[#6a6a7a]">
                No flowchart data available
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-[#0f0f14]">
            {/* Stats badge */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-[#1a1a24]/90 backdrop-blur border border-[#2a2a3a]">
                    <span className="text-xs text-[#6a6a7a]">Nodes: </span>
                    <span className="text-sm font-semibold text-[#e4e4e7]">{flowNodes.length}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-[#1a1a24]/90 backdrop-blur border border-[#2a2a3a]">
                    <span className="text-xs text-[#6a6a7a]">Edges: </span>
                    <span className="text-sm font-semibold text-[#e4e4e7]">{flowEdges.length}</span>
                </div>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={flowchartNodeTypes}
                connectionLineType={ConnectionLineType.Bezier}
                fitView
                fitViewOptions={{ padding: 0.3, minZoom: 0.3, maxZoom: 1.5 }}
                minZoom={0.1}
                maxZoom={2}
                className="bg-[#0f0f14]"
                proOptions={{ hideAttribution: true }}
                defaultEdgeOptions={{
                    type: 'bezier',
                }}
            >
                {/* Dot grid background */}
                <Background
                    variant={BackgroundVariant.Dots}
                    color="#2a2a3a"
                    gap={20}
                    size={1}
                />

                {/* Minimal controls */}
                <Controls
                    showInteractive={false}
                    className="!bg-[#1a1a24] !border-[#2a2a3a] !shadow-lg !rounded-lg [&>button]:!bg-[#1a1a24] [&>button]:!border-[#2a2a3a] [&>button]:!fill-[#6a6a7a] [&>button:hover]:!bg-[#2a2a3a] [&>button:hover]:!fill-[#e4e4e7]"
                />
            </ReactFlow>

            {/* Hint */}
            <div className="absolute bottom-4 left-4 z-10 text-xs text-[#4a4a5a] bg-[#1a1a24]/80 backdrop-blur px-3 py-1.5 rounded-lg border border-[#2a2a3a]">
                💡 Click a node to view source code
            </div>
        </div>
    );
}
