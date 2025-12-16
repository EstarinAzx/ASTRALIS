// ============================================================================
// Custom Flowchart Nodes - Rectangle, Diamond, Rounded, Hexagon
// ============================================================================

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Box, Diamond, Circle, Hexagon } from 'lucide-react';
import type { SectionColor, NodeShape } from '../../types/astralis';

interface NodeData {
    label: string;
    subtitle?: string;
    shape: NodeShape;
    color: SectionColor;
    isDecision?: boolean;
    condition?: string;
    isSelected?: boolean;
}

const colorConfig: Record<SectionColor, { border: string; bg: string; text: string }> = {
    blue: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa' },
    green: { border: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80' },
    orange: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' },
    purple: { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc' },
    red: { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171' },
    cyan: { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee' },
};

const shapeIcons: Record<NodeShape, typeof Box> = {
    rectangle: Box,
    diamond: Diamond,
    rounded: Circle,
    hexagon: Hexagon,
};

// ============================================================================
// Rectangle Node (regular steps)
// ============================================================================
function RectangleNode({ data, selected }: NodeProps<NodeData>) {
    const colors = colorConfig[data.color];
    const Icon = shapeIcons[data.shape];

    return (
        <div
            className={`relative transition-all duration-200 ${selected || data.isSelected ? 'scale-105' : 'hover:scale-102'
                }`}
            style={{
                filter: selected || data.isSelected ? `drop-shadow(0 0 12px ${colors.border}50)` : 'none',
            }}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 !border-2 !bg-[var(--bg-tertiary)]"
                style={{ borderColor: colors.border }}
            />

            <div
                className="px-5 py-3 rounded-lg border-2 min-w-[180px] max-w-[220px]"
                style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                }}
            >
                <div className="flex items-start gap-3">
                    <div
                        className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: `${colors.border}30` }}
                    >
                        <Icon className="w-4 h-4" style={{ color: colors.text }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[var(--text-primary)] leading-tight">
                            {data.label}
                        </div>
                        {data.subtitle && (
                            <div className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                                {data.subtitle}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3 !h-3 !border-2 !bg-[var(--bg-tertiary)]"
                style={{ borderColor: colors.border }}
            />
        </div>
    );
}

// ============================================================================
// Diamond Node (decisions)
// ============================================================================
function DiamondNode({ data, selected }: NodeProps<NodeData>) {
    const colors = colorConfig[data.color];

    return (
        <div
            className={`relative transition-all duration-200 ${selected || data.isSelected ? 'scale-105' : 'hover:scale-102'
                }`}
            style={{
                filter: selected || data.isSelected ? `drop-shadow(0 0 12px ${colors.border}50)` : 'none',
            }}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 !border-2 !bg-[var(--bg-tertiary)]"
                style={{ borderColor: colors.border, top: -6 }}
            />

            <div
                className="w-[140px] h-[140px] flex items-center justify-center"
                style={{
                    transform: 'rotate(45deg)',
                    backgroundColor: colors.bg,
                    border: `2px solid ${colors.border}`,
                    borderRadius: '8px',
                }}
            >
                <div
                    className="text-center p-3"
                    style={{ transform: 'rotate(-45deg)' }}
                >
                    <Diamond className="w-4 h-4 mx-auto mb-1" style={{ color: colors.text }} />
                    <div className="text-[11px] font-bold text-[var(--text-primary)] leading-tight">
                        {data.condition || data.label}
                    </div>
                </div>
            </div>

            {/* Yes output (right) */}
            <Handle
                type="source"
                position={Position.Right}
                id="yes"
                className="!w-3 !h-3 !border-2 !bg-green-500"
                style={{ borderColor: '#22c55e', right: -6 }}
            />

            {/* No output (left) */}
            <Handle
                type="source"
                position={Position.Left}
                id="no"
                className="!w-3 !h-3 !border-2 !bg-red-500"
                style={{ borderColor: '#ef4444', left: -6 }}
            />

            {/* Bottom output (for linear flow) */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3 !h-3 !border-2 !bg-[var(--bg-tertiary)]"
                style={{ borderColor: colors.border, bottom: -6 }}
            />
        </div>
    );
}

// ============================================================================
// Rounded Node (start/end)
// ============================================================================
function RoundedNode({ data, selected }: NodeProps<NodeData>) {
    const colors = colorConfig[data.color];
    const Icon = shapeIcons[data.shape];

    return (
        <div
            className={`relative transition-all duration-200 ${selected || data.isSelected ? 'scale-105' : 'hover:scale-102'
                }`}
            style={{
                filter: selected || data.isSelected ? `drop-shadow(0 0 12px ${colors.border}50)` : 'none',
            }}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 !border-2 !bg-[var(--bg-tertiary)]"
                style={{ borderColor: colors.border }}
            />

            <div
                className="px-5 py-3 rounded-full border-2 min-w-[160px] text-center"
                style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                }}
            >
                <div className="flex items-center justify-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: colors.text }} />
                    <div className="text-xs font-bold text-[var(--text-primary)]">
                        {data.label}
                    </div>
                </div>
                {data.subtitle && (
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        {data.subtitle}
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3 !h-3 !border-2 !bg-[var(--bg-tertiary)]"
                style={{ borderColor: colors.border }}
            />
        </div>
    );
}

// ============================================================================
// Hexagon Node (API/async)
// ============================================================================
function HexagonNode({ data, selected }: NodeProps<NodeData>) {
    const colors = colorConfig[data.color];

    return (
        <div
            className={`relative transition-all duration-200 ${selected || data.isSelected ? 'scale-105' : 'hover:scale-102'
                }`}
            style={{
                filter: selected || data.isSelected ? `drop-shadow(0 0 12px ${colors.border}50)` : 'none',
            }}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 !border-2 !bg-[var(--bg-tertiary)]"
                style={{ borderColor: colors.border }}
            />

            <div
                className="px-6 py-4 min-w-[180px] text-center"
                style={{
                    backgroundColor: colors.bg,
                    border: `2px solid ${colors.border}`,
                    clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                }}
            >
                <Hexagon className="w-4 h-4 mx-auto mb-1" style={{ color: colors.text }} />
                <div className="text-xs font-bold text-[var(--text-primary)]">
                    {data.label}
                </div>
                {data.subtitle && (
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        {data.subtitle}
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3 !h-3 !border-2 !bg-[var(--bg-tertiary)]"
                style={{ borderColor: colors.border }}
            />
        </div>
    );
}

// Export memoized components
export const MemoizedRectangleNode = memo(RectangleNode);
export const MemoizedDiamondNode = memo(DiamondNode);
export const MemoizedRoundedNode = memo(RoundedNode);
export const MemoizedHexagonNode = memo(HexagonNode);

// Node types map for React Flow
export const flowchartNodeTypes = {
    rectangle: MemoizedRectangleNode,
    diamond: MemoizedDiamondNode,
    rounded: MemoizedRoundedNode,
    hexagon: MemoizedHexagonNode,
};
