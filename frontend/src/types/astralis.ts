// ============================================================================
// ASTRALIS Types - Unified Flowchart Structure
// ============================================================================

// Node shapes in the flowchart
export type NodeShape = 'rectangle' | 'diamond' | 'rounded' | 'hexagon';

// Section colors
export type SectionColor = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'cyan';

// Supported languages
export const SUPPORTED_LANGUAGES = [
    { value: 'typescript', label: 'TypeScript' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'cpp', label: 'C++' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'swift', label: 'Swift' },
    { value: 'kotlin', label: 'Kotlin' },
];

// Each step in a logic table
export interface LogicStep {
    step: string;           // e.g., "0.1", "1", "2.3"
    trigger: string;        // Trigger/Condition
    action: string;         // What happens
    output: string;         // Result/Output
    codeRef?: string;       // Related code snippet
    lineStart?: number;
    lineEnd?: number;
}

// A flowchart node (section)
export interface FlowNode {
    id: string;
    label: string;                    // e.g., "SECTION 1 — SETUP"
    subtitle?: string;                // e.g., "Imports & Definitions"
    shape: NodeShape;                 // rectangle, diamond, etc.
    color: SectionColor;              // Section color
    position?: { x: number; y: number };

    // For decisions (diamond nodes)
    isDecision?: boolean;
    condition?: string;               // e.g., "Has ID?"
    yesTarget?: string;               // Node ID for Yes
    noTarget?: string;                // Node ID for No

    // Logic table for this section
    logicTable: LogicStep[];

    // Connected nodes (for non-decision nodes)
    next?: string[];                  // Node IDs this connects to

    // Summary for narrative
    narrative: string;

    // Source code for this section
    codeSnippet: string;
    lineStart: number;
    lineEnd: number;
}

// Edge between nodes
export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    label?: string;                   // "Yes", "No", etc.
    animated?: boolean;
    sourceHandle?: string;            // 'yes' or 'no' for diamond nodes
}

// Complete analysis result
export interface AnalysisResult {
    id: string;
    fileName: string;
    language: string;
    createdAt: string;

    // Unified flowchart
    nodes: FlowNode[];
    edges: FlowEdge[];

    // Original source code for inspector highlighting
    sourceCode?: string;

    // Metadata
    totalLines: number;
    totalSections: number;
}

// API response wrapper
export interface AnalysisResponse {
    success: boolean;
    data?: AnalysisResult;
    error?: string;
}

// Verbosity modes
export type VerbosityMode = 'concise' | 'standard' | 'deep_dive';

// Recent generation history
export interface RecentGeneration {
    id: string;
    fileName: string;
    language: string;
    createdAt: string;
}
