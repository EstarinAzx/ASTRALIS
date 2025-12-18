// ============================================================================
// LLM Service Types
// ============================================================================

export type NodeShape = 'rectangle' | 'diamond' | 'rounded' | 'hexagon';
export type SectionColor = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'cyan';
export type VerbosityMode = 'concise' | 'standard' | 'deep_dive';

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
    narrative?: string;
    codeSnippet?: string;
    lineStart?: number;
    lineEnd?: number;
    logicTable?: LogicStep[];
    isDecision?: boolean;
    condition?: string;
    next?: string[];
}

export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    label?: string;
    animated?: boolean;
}

export interface AnalysisResult {
    fileName: string;
    language: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
    totalLines: number;
    totalSections: number;
}

// Pattern extraction result
export interface PatternMatch {
    label: string;
    subtitle: string;
    shape: NodeShape;
    color: SectionColor;
    lineStart: number;
    lineEnd: number;
    codeSnippet: string;
    isDecision?: boolean;
    condition?: string;
    branches?: {
        yes?: { label: string; lineStart: number; lineEnd: number; content: string };
        no?: { label: string; lineStart: number; lineEnd: number };
    };
}

// Code pattern definition
export interface CodePattern {
    name: string;
    priority: number; // Higher = matched first
    match: (line: string, index: number, lines: string[]) => boolean;
    extract: (line: string, index: number, lines: string[]) => PatternMatch | null;
}
