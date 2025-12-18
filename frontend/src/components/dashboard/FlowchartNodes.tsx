// ============================================================================
// Custom Flowchart Nodes - Unified Dark Theme with Purple Glow
// ============================================================================

import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import {
    Play,
    Square,
    Package,
    Code,
    Anchor,
    Globe,
    GitBranch,
    Repeat,
    AlertTriangle,
    Variable,
    Layout,
    Box,
    MoreHorizontal,
} from 'lucide-react';
import type { NodeShape } from '../../types/astralis';

// ============================================================================
// Types
// ============================================================================
interface NodeData {
    label: string;
    subtitle?: string;
    shape: NodeShape;
    color: string;
    isDecision?: boolean;
    condition?: string;
    isSelected?: boolean;
    nodeType?: string;
}

// ============================================================================
// Icon Mapping - Determines icon based on node type/label
// ============================================================================
const getNodeIcon = (label: string, shape: NodeShape, nodeType?: string) => {
    const lowerLabel = label.toLowerCase();
    const lowerType = (nodeType || '').toLowerCase();

    // Check for specific patterns
    if (lowerLabel.includes('start') || lowerLabel.includes('entry')) return Play;
    if (lowerLabel.includes('end') || lowerLabel.includes('exit') || lowerLabel.includes('return')) return Square;
    if (lowerLabel.includes('import') || lowerLabel.includes('require')) return Package;
    if (lowerLabel.includes('hook') || lowerLabel.includes('useeffect') || lowerLabel.includes('usestate')) return Anchor;
    if (lowerLabel.includes('fetch') || lowerLabel.includes('api') || lowerLabel.includes('request')) return Globe;
    if (lowerLabel.includes('if') || lowerLabel.includes('else') || lowerLabel.includes('switch') || lowerLabel.includes('condition') || shape === 'diamond') return GitBranch;
    if (lowerLabel.includes('loop') || lowerLabel.includes('for') || lowerLabel.includes('while') || lowerLabel.includes('map')) return Repeat;
    if (lowerLabel.includes('try') || lowerLabel.includes('catch') || lowerLabel.includes('error')) return AlertTriangle;
    if (lowerLabel.includes('state') || lowerLabel.includes('variable') || lowerLabel.includes('const') || lowerLabel.includes('let')) return Variable;
    if (lowerLabel.includes('jsx') || lowerLabel.includes('render') || lowerLabel.includes('component')) return Layout;
    if (lowerLabel.includes('function') || lowerLabel.includes('method') || lowerType.includes('function')) return Code;

    // Default
    return Box;
};

// ============================================================================
// Unified Astralis Node - Sleek Dark Design
// ============================================================================
function AstralisNode({ data, selected }: NodeProps<NodeData>) {
    const [menuOpen, setMenuOpen] = useState(false);
    const isSelected = selected || data.isSelected;
    const Icon = getNodeIcon(data.label, data.shape, data.nodeType);

    // Decision nodes (diamonds) get special branching handles
    const isDecision = data.isDecision || data.shape === 'diamond';

    return (
        <div
            className={`
                relative group transition-all duration-200 ease-out
                ${isSelected ? 'scale-105' : 'hover:scale-[1.02]'}
            `}
        >
            {/* Input handle - Left side */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-2 !h-2 !bg-[#3a3a4a] !border-[#4a4a5a] !border"
                style={{ left: -4 }}
            />

            {/* Node body */}
            <div
                className={`
                    relative px-4 py-3 rounded-xl min-w-[160px] max-w-[220px]
                    bg-[#1a1a24] border transition-all duration-200
                    ${isSelected
                        ? 'border-purple-500 shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                        : 'border-[#2a2a3a] hover:border-[#3a3a4a]'
                    }
                `}
            >
                <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={`
                        w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                        ${isSelected
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-[#2a2a3a] text-[#8a8a9a]'
                        }
                    `}>
                        <Icon className="w-4 h-4" />
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#e4e4e7] truncate">
                            {data.condition || data.label}
                        </div>
                        {data.subtitle && (
                            <div className="text-[10px] text-[#6a6a7a] truncate mt-0.5">
                                {data.subtitle}
                            </div>
                        )}
                    </div>

                    {/* Menu button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(!menuOpen);
                        }}
                        className={`
                            w-6 h-6 rounded flex items-center justify-center flex-shrink-0
                            transition-colors
                            ${menuOpen
                                ? 'bg-[#3a3a4a] text-white'
                                : 'text-[#5a5a6a] hover:text-[#8a8a9a] hover:bg-[#2a2a3a]'
                            }
                        `}
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>

                {/* Context menu dropdown */}
                {menuOpen && (
                    <div className="absolute top-full right-0 mt-1 z-50 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg shadow-xl py-1 min-w-[120px]">
                        <button className="w-full px-3 py-1.5 text-left text-xs text-[#a4a4b4] hover:bg-[#2a2a3a] hover:text-white transition-colors">
                            View Code
                        </button>
                        <button className="w-full px-3 py-1.5 text-left text-xs text-[#a4a4b4] hover:bg-[#2a2a3a] hover:text-white transition-colors">
                            Expand
                        </button>
                        <button className="w-full px-3 py-1.5 text-left text-xs text-[#a4a4b4] hover:bg-[#2a2a3a] hover:text-white transition-colors">
                            Copy Label
                        </button>
                    </div>
                )}
            </div>

            {/* Output handles - Right side */}
            {isDecision ? (
                <>
                    {/* Yes branch - top right */}
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="yes"
                        className="!w-2 !h-2 !bg-emerald-500 !border-emerald-400 !border"
                        style={{ right: -4, top: '30%' }}
                    />
                    {/* No branch - bottom right */}
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="no"
                        className="!w-2 !h-2 !bg-red-500 !border-red-400 !border"
                        style={{ right: -4, top: '70%' }}
                    />
                </>
            ) : (
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!w-2 !h-2 !bg-[#3a3a4a] !border-[#4a4a5a] !border"
                    style={{ right: -4 }}
                />
            )}
        </div>
    );
}

// ============================================================================
// Export memoized component
// ============================================================================
export const MemoizedAstralisNode = memo(AstralisNode);

// Node types map for React Flow - All shapes use the same unified node
export const flowchartNodeTypes = {
    rectangle: MemoizedAstralisNode,
    diamond: MemoizedAstralisNode,
    rounded: MemoizedAstralisNode,
    hexagon: MemoizedAstralisNode,
    // Fallback for any custom type
    default: MemoizedAstralisNode,
};
