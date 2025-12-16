// ============================================================================
// Custom Node Component for React Flow
// ============================================================================

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Box, Circle, Hexagon, Square } from 'lucide-react';

interface NodeData {
    label: string;
    type: 'controller' | 'service' | 'method' | 'function' | 'class' | 'module';
    isSelected?: boolean;
}

const typeConfig = {
    controller: { icon: Hexagon, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
    service: { icon: Circle, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    method: { icon: Square, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
    function: { icon: Box, color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.1)' },
    class: { icon: Hexagon, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    module: { icon: Box, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
};

function CustomNode({ data, selected }: NodeProps<NodeData>) {
    const config = typeConfig[data.type] || typeConfig.function;
    const Icon = config.icon;

    return (
        <div
            className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 min-w-[140px] ${selected || data.isSelected
                    ? 'shadow-lg shadow-[var(--color-primary)]/30 scale-105'
                    : 'hover:scale-102'
                }`}
            style={{
                backgroundColor: selected || data.isSelected ? config.bg : 'var(--bg-card)',
                borderColor: selected || data.isSelected ? config.color : 'var(--border-color)',
            }}
        >
            {/* Input handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 !border-2 !border-[var(--border-color)] !bg-[var(--bg-tertiary)]"
            />

            {/* Content */}
            <div className="flex items-center gap-2">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${config.color}20` }}
                >
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                </div>
                <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
                        {data.label}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] capitalize">
                        {data.type}
                    </div>
                </div>
            </div>

            {/* Output handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3 !h-3 !border-2 !border-[var(--border-color)] !bg-[var(--bg-tertiary)]"
            />
        </div>
    );
}

export default memo(CustomNode);
