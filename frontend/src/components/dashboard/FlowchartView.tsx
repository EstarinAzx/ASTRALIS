// ============================================================================
// Flowchart View - Unified React Flow Diagram with Smart Layout
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
// Smart Hierarchical Layout Algorithm (with lineStart fallback)
// ============================================================================
function calculateHierarchicalLayout(
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

    // Assign levels based on edges AND lineStart fallback
    const levels = new Map<string, number>();
    const processed = new Set<string>();

    // Process connected nodes via BFS from roots
    const roots = sortedNodes.filter(n => !parents.has(n.id) || parents.get(n.id)!.length === 0);
    if (roots.length === 0 && sortedNodes.length > 0) {
        roots.push(sortedNodes[0]);
    }

    const queue: { id: string; level: number }[] = roots.map((r, i) => ({ id: r.id, level: i }));

    while (queue.length > 0) {
        const { id, level } = queue.shift()!;
        if (processed.has(id)) continue;
        processed.add(id);
        levels.set(id, level);

        const childIds = children.get(id) || [];
        childIds.forEach(childId => {
            if (nodeMap.has(childId) && !processed.has(childId)) {
                queue.push({ id: childId, level: level + 1 });
            }
        });
    }

    // Handle disconnected nodes - assign level based on lineStart position
    let maxLevel = Math.max(...Array.from(levels.values()), 0);
    sortedNodes.forEach((node, sortIndex) => {
        if (!levels.has(node.id)) {
            // Use position in sorted array as level indicator
            // Scale to avoid gaps - place proportionally
            const proportionalLevel = Math.floor((sortIndex / sortedNodes.length) * (maxLevel + 2));
            levels.set(node.id, proportionalLevel);
        }
    });

    // Re-sort levels to ensure lineStart order within same level
    const levelGroups = new Map<number, string[]>();
    levels.forEach((level, nodeId) => {
        if (!levelGroups.has(level)) levelGroups.set(level, []);
        levelGroups.get(level)!.push(nodeId);
    });

    // Sort nodes within each level by lineStart
    levelGroups.forEach((nodeIds, _level) => {
        nodeIds.sort((a, b) => {
            const nodeA = nodeMap.get(a);
            const nodeB = nodeMap.get(b);
            return ((nodeA?.lineStart || 0) - (nodeB?.lineStart || 0));
        });
    });

    // Position nodes - wider horizontal spacing for better branch separation
    const nodeWidth = 220;
    const nodeHeight = 120;
    const horizontalSpacing = 150;  // Increased from 80 for better decision branch spread
    const verticalSpacing = 160;    // Slightly increased for clarity

    levelGroups.forEach((nodeIds, level) => {
        const totalWidth = nodeIds.length * nodeWidth + (nodeIds.length - 1) * horizontalSpacing;
        const startX = -totalWidth / 2 + nodeWidth / 2;

        nodeIds.forEach((nodeId, index) => {
            positions.set(nodeId, {
                x: startX + index * (nodeWidth + horizontalSpacing),
                y: level * (nodeHeight + verticalSpacing),
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
    const positions = calculateHierarchicalLayout(flowNodes, flowEdges);

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

    const edges: Edge[] = flowEdges.map((edge, index) => ({
        id: edge.id || `edge-${index}`,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: edge.animated || false,
        type: 'smoothstep',
        style: {
            stroke: edge.label === 'No' ? '#ef4444' : edge.label === 'Yes' ? '#22c55e' : '#64748b',
            strokeWidth: 2,
        },
        labelStyle: {
            fill: edge.label === 'No' ? '#ef4444' : edge.label === 'Yes' ? '#22c55e' : '#94a3b8',
            fontWeight: 700,
            fontSize: 12,
            background: 'transparent',
        },
        labelBgStyle: {
            fill: 'var(--bg-card)',
            fillOpacity: 0.95,
        },
        labelBgPadding: [8, 4] as [number, number],
        labelBgBorderRadius: 4,
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edge.label === 'No' ? '#ef4444' : edge.label === 'Yes' ? '#22c55e' : '#64748b',
            width: 20,
            height: 20,
        },
        // Route from correct handle: Yes = right (green), No = left (red)
        // Use sourceHandle from edge if provided, otherwise derive from label
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
        [flowNodes, flowEdges]  // Removed selectedNode - positions shouldn't change on select
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Only reset positions when raw data changes (not on selection)
    useEffect(() => {
        const { nodes: newNodes, edges: newEdges } = convertToReactFlow(flowNodes, flowEdges, null);
        setNodes(newNodes);
        setEdges(newEdges);
    }, [flowNodes, flowEdges, setNodes, setEdges]);  // Removed selectedNode!

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
                    <span className="text-xs text-[var(--text-muted)]">Nodes: </span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{flowNodes.length}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)]/90 backdrop-blur border border-[var(--border-color)]">
                    <span className="text-xs text-[var(--text-muted)]">Edges: </span>
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
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
                fitViewOptions={{ padding: 0.2, minZoom: 0.3, maxZoom: 1.5 }}
                minZoom={0.1}
                maxZoom={2}
                className="bg-[var(--bg-primary)]"
                proOptions={{ hideAttribution: true }}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                }}
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

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-4 text-xs bg-[var(--bg-card)]/90 backdrop-blur px-4 py-2 rounded-lg border border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">Legend:</span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-500"></span> Yes
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-500"></span> No
                </span>
                <span className="text-[var(--text-muted)]">|</span>
                <span className="text-[var(--text-muted)]">💡 Click node for details</span>
            </div>
        </div>
    );
}
