// ============================================================================
// ASTRALIS Analysis Types
// ============================================================================
// These interfaces define the structured output from the LLM

export type VerbosityMode = 'concise' | 'standard' | 'deep_dive';

// ============================================================================
// Layer 0 - Imports Table
// ============================================================================
export interface Layer0Import {
    name: string;
    source: string;
    type: string; // 'Library' | 'Component' | 'Utility' | 'Styles' | 'Types'
    purpose: string;
}

// ============================================================================
// Layer 1 - What & Why Summary
// ============================================================================
export interface Layer1Summary {
    what: string;
    why: string;
    complexity: number; // 1-10
}

// ============================================================================
// Layer 2 - Narrative Journey
// ============================================================================
export type Layer2Journey = string[]; // Array of plain English steps

// ============================================================================
// Layer 3 - Mermaid Diagram
// ============================================================================
export interface Layer3Mermaid {
    chartType: string; // 'flowchart' | 'sequenceDiagram' | 'stateDiagram' | 'classDiagram'
    definition: string; // Raw mermaid syntax
}

// ============================================================================
// Layer 4 - Logic Table (Sectioned)
// ============================================================================
export interface Layer4Row {
    line: string; // e.g., "10-15" or "42"
    step: string;
    trigger: string;
    action: string;
    result: string;
}

export interface Layer4Section {
    title: string; // e.g., "🟩 SECTION 1 — INITIAL STATE"
    rows: Layer4Row[];
}

export interface Layer4Logic {
    sections: Layer4Section[];
}

// ============================================================================
// Layer 5 - Code Map
// ============================================================================
export interface Layer5CodeMapEntry {
    lineStart: number;
    lineEnd: number;
    snippet: string;
    note: string;
}

export type Layer5CodeMap = Layer5CodeMapEntry[];

// ============================================================================
// Complete ASTRALIS Response
// ============================================================================
export interface AstralisResponse {
    layer0_imports: Layer0Import[];
    layer1_summary: Layer1Summary;
    layer2_journey: Layer2Journey;
    layer3_mermaid: Layer3Mermaid;
    layer4_logic: Layer4Logic;
    layer5_codemap: Layer5CodeMap;
}

// ============================================================================
// Analysis Request
// ============================================================================
export interface AnalyzeRequest {
    code: string;
    fileName: string;
    language: string;
    mode: VerbosityMode;
}

// ============================================================================
// Analysis History (from DB)
// ============================================================================
export interface AnalysisHistoryItem {
    id: string;
    fileName: string;
    language: string;
    mode: VerbosityMode;
    createdAt: Date;
}
