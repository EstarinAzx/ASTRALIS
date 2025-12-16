// ============================================================================
// ASTRALIS Types - Backend
// ============================================================================

export type VerbosityMode = 'concise' | 'standard' | 'deep_dive';
export type NodeShape = 'rectangle' | 'diamond' | 'rounded' | 'hexagon';
export type SectionColor = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'cyan';

export interface LogicStep {
    step: string;
    trigger: string;
    action: string;
    output: string;
    codeRef?: string;
    lineStart?: number;
    lineEnd?: number;
}

export interface FlowNode {
    id: string;
    label: string;
    subtitle?: string;
    shape: NodeShape;
    color: SectionColor;
    position?: { x: number; y: number };
    isDecision?: boolean;
    condition?: string;
    yesTarget?: string;
    noTarget?: string;
    logicTable: LogicStep[];
    next?: string[];
    narrative: string;
    codeSnippet: string;
    lineStart: number;
    lineEnd: number;
}

export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    animated?: boolean;
}

export interface AnalysisResult {
    id?: string;
    fileName: string;
    language: string;
    createdAt?: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
    totalLines: number;
    totalSections: number;
}
