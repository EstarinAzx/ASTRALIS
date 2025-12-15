// ============================================================================
// ASTRALIS Types - Updated for v2 UI
// ============================================================================

export type VerbosityMode = 'concise' | 'standard' | 'deep_dive';

// ============================================================================
// Language Detection
// ============================================================================
export const SUPPORTED_LANGUAGES = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'csharp', label: 'C#' },
    { value: 'cpp', label: 'C++' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'php', label: 'PHP' },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['value'];

// ============================================================================
// Diagram Node (for interactive diagram)
// ============================================================================
export interface DiagramNode {
    id: string;
    label: string;
    type: 'controller' | 'service' | 'method' | 'function' | 'class' | 'module';
    children?: string[];
    lineStart: number;
    lineEnd: number;
    narrative: string;
    logicTable: LogicRow[];
    codeSnippet: string;
}

export interface LogicRow {
    condition: string;
    action: string;
    output: string;
    outputType: 'next' | 'exit' | 'loop';
}

// ============================================================================
// Layer Data
// ============================================================================
export interface LayerData {
    title: string;
    description: string;
    mermaidDef: string;
    nodes: DiagramNode[];
}

// ============================================================================
// Complete ASTRALIS Response (v2)
// ============================================================================
export interface AstralisResponse {
    fileName: string;
    language: string;
    layers: {
        L0_context: LayerData;
        L1_container: LayerData;
        L2_component: LayerData;
        L3_code: LayerData;
        L4_data: LayerData;
        L5_infra: LayerData;
    };
}

// ============================================================================
// Analysis Result (from API)
// ============================================================================
export interface AnalysisResult {
    id: string;
    fileName: string;
    language: string;
    mode: VerbosityMode;
    result: AstralisResponse;
    cached: boolean;
    createdAt: string;
}

// ============================================================================
// Recent Generation Item
// ============================================================================
export interface RecentGeneration {
    id: string;
    fileName: string;
    language: string;
    mode: VerbosityMode;
    createdAt: string;
}
