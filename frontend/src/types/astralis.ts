// ============================================================================
// ASTRALIS Analysis Types (mirrored from backend)
// ============================================================================

export type VerbosityMode = 'concise' | 'standard' | 'deep_dive';

export interface Layer0Import {
    name: string;
    source: string;
    type: string;
    purpose: string;
}

export interface Layer1Summary {
    what: string;
    why: string;
    complexity: number;
}

export type Layer2Journey = string[];

export interface Layer3Mermaid {
    chartType: string;
    definition: string;
}

export interface Layer4Row {
    line: string;
    step: string;
    trigger: string;
    action: string;
    result: string;
}

export interface Layer4Section {
    title: string;
    rows: Layer4Row[];
}

export interface Layer4Logic {
    sections: Layer4Section[];
}

export interface Layer5CodeMapEntry {
    lineStart: number;
    lineEnd: number;
    snippet: string;
    note: string;
}

export type Layer5CodeMap = Layer5CodeMapEntry[];

export interface AstralisResponse {
    layer0_imports: Layer0Import[];
    layer1_summary: Layer1Summary;
    layer2_journey: Layer2Journey;
    layer3_mermaid: Layer3Mermaid;
    layer4_logic: Layer4Logic;
    layer5_codemap: Layer5CodeMap;
}

export interface AnalysisResult {
    id: string;
    fileName: string;
    language: string;
    mode: VerbosityMode;
    result: AstralisResponse;
    cached: boolean;
}
