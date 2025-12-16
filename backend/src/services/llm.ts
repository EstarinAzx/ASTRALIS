// ============================================================================
// LLM Service - OpenRouter Integration for ASTRALIS v3 (Unified Flowchart)
// ============================================================================

import type { VerbosityMode } from '../types/astralis.js';

// ============================================================================
// Types (matching frontend)
// ============================================================================
type NodeShape = 'rectangle' | 'diamond' | 'rounded' | 'hexagon';
type SectionColor = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'cyan';

interface LogicStep {
    step: string;
    trigger: string;
    action: string;
    output: string;
    codeRef?: string;
    lineStart?: number;
    lineEnd?: number;
}

interface FlowNode {
    id: string;
    label: string;
    subtitle?: string;
    shape: NodeShape;
    color: SectionColor;
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

interface FlowEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    animated?: boolean;
}

interface AnalysisResult {
    fileName: string;
    language: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
    totalLines: number;
    totalSections: number;
}

// ============================================================================
// System Prompt for Unified Flowchart
// ============================================================================
function buildSystemPrompt(mode: VerbosityMode): string {
    const modeDescriptions = {
        concise: 'Create 3-5 high-level sections. Focus on main flow only.',
        standard: 'Create 5-8 sections with moderate detail. Include key decisions.',
        deep_dive: 'Create 8-15 sections with full detail. Include all conditions and error handling.',
    };

    return `You are ASTRALIS - a code visualization system that creates unified flowcharts.

MODE: ${mode.toUpperCase()} - ${modeDescriptions[mode]}

Analyze the code and create a SINGLE UNIFIED FLOWCHART showing the execution flow from start to finish.

RESPOND WITH ONLY VALID JSON (no markdown, no code blocks):

{
  "fileName": "string",
  "language": "string",
  "totalLines": number,
  "totalSections": number,
  "nodes": [
    {
      "id": "section1",
      "label": "SECTION 1 — SETUP",
      "subtitle": "Imports & Definitions",
      "shape": "rectangle",
      "color": "blue",
      "narrative": "This section imports dependencies and defines types.",
      "codeSnippet": "import { useState } from 'react';",
      "lineStart": 1,
      "lineEnd": 10,
      "next": ["section2"],
      "logicTable": [
        { "step": "0.1", "trigger": "File loaded", "action": "Import useState", "output": "State management ready", "codeRef": "useState" },
        { "step": "0.2", "trigger": "File loaded", "action": "Import useEffect", "output": "Side effects ready", "codeRef": "useEffect" }
      ]
    },
    {
      "id": "decision1",
      "label": "Check Condition",
      "shape": "diamond",
      "color": "orange",
      "isDecision": true,
      "condition": "Has ID param?",
      "yesTarget": "section3",
      "noTarget": "error1",
      "narrative": "Checks if the required ID is present.",
      "codeSnippet": "if (id) { loadData(id); }",
      "lineStart": 15,
      "lineEnd": 17,
      "logicTable": [
        { "step": "1", "trigger": "URL accessed", "action": "Check id param", "output": "Boolean result" }
      ]
    }
  ],
  "edges": [
    { "id": "e1", "source": "section1", "target": "section2" },
    { "id": "e2", "source": "decision1", "target": "section3", "label": "Yes" },
    { "id": "e3", "source": "decision1", "target": "error1", "label": "No" }
  ]
}

RULES:
1. NODE SHAPES:
   - "rectangle" = Regular steps/sections (imports, state, renders)
   - "diamond" = Decision points (if/else, conditions, ternaries)
   - "rounded" = Start/End points
   - "hexagon" = API calls, async operations

2. COLORS:
   - "blue" = Setup/Imports
   - "green" = State/Initialization
   - "orange" = Logic/Processing
   - "purple" = Effects/Side effects
   - "red" = Errors/Exceptions
   - "cyan" = Render/Output

3. LOGIC TABLE:
   - Each step should have: step number, trigger, action, output
   - codeRef should contain the key code identifier
   - Include lineStart/lineEnd when referencing specific code

4. EDGES:
   - Connect nodes in execution order
   - For decisions, use "Yes"/"No" labels
   - Every node should be reachable from start

5. FLOW:
   - Start with imports/setup
   - Show state initialization
   - Include all decision branches
   - End with render/return`;
}

// ============================================================================
// Call LLM
// ============================================================================
export async function callLLM(
    code: string,
    fileName: string,
    language: string,
    mode: VerbosityMode
): Promise<AnalysisResult> {
    const apiKey = process.env.LLM_API_KEY;
    const apiUrl = process.env.LLM_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const model = process.env.LLM_MODEL || 'meta-llama/llama-3.2-3b-instruct:free';

    // If no API key, return mock response
    if (!apiKey) {
        console.log('⚠️ No LLM_API_KEY set, returning mock response');
        return generateMockResponse(fileName, language, code);
    }

    const systemPrompt = buildSystemPrompt(mode);
    const userPrompt = `Analyze this ${language} code from "${fileName}" and create a unified flowchart:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    try {
        console.log(`🤖 Calling OpenRouter (${model})...`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                'X-Title': 'ASTRALIS Code Mind Map',
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.3,
                max_tokens: 4000,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter error:', errorText);
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json() as {
            choices?: { message?: { content?: string } }[];
        };
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('No content in LLM response');
        }

        // Parse JSON response
        const parsed = JSON.parse(content) as AnalysisResult;
        console.log('✅ LLM response parsed successfully');

        return parsed;
    } catch (error) {
        console.error('LLM call failed:', error);
        console.log('⚠️ Falling back to mock response');
        return generateMockResponse(fileName, language, code);
    }
}

// ============================================================================
// Mock Response (for testing without LLM)
// ============================================================================
function generateMockResponse(fileName: string, language: string, code: string): AnalysisResult {
    const lines = code.split('\n');
    const lineCount = lines.length;

    // Helper to extract code section
    const getCodeSection = (start: number, end: number): string => {
        return lines.slice(start, end).filter(l => l.trim()).slice(0, 5).join('\n');
    };

    // Analyze code to find sections
    const hasImports = lines.some(l => l.includes('import'));
    const hasUseState = lines.some(l => l.includes('useState'));
    const hasUseEffect = lines.some(l => l.includes('useEffect'));
    const hasConditional = lines.some(l => l.includes('if (') || l.includes('if('));
    const hasAsync = lines.some(l => l.includes('async') || l.includes('await'));
    const hasReturn = lines.some(l => l.includes('return'));

    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    let nodeIndex = 0;

    // Section 1: Setup/Imports
    nodes.push({
        id: 'setup',
        label: 'SECTION 1 — SETUP',
        subtitle: 'Imports & Definitions',
        shape: 'rectangle',
        color: 'blue',
        narrative: 'This section handles all imports and type definitions needed for the component.',
        codeSnippet: getCodeSection(0, 10),
        lineStart: 1,
        lineEnd: Math.min(15, lineCount),
        next: ['state'],
        logicTable: [
            { step: '0.1', trigger: 'File is loaded', action: 'Import React hooks', output: 'Hooks available', codeRef: 'useState, useEffect' },
            { step: '0.2', trigger: 'File is loaded', action: 'Import dependencies', output: 'Dependencies ready', codeRef: 'import' },
            { step: '0.3', trigger: 'File is loaded', action: 'Define interfaces', output: 'Types established', codeRef: 'interface' },
        ],
    });

    // Section 2: State & Params
    if (hasUseState) {
        nodes.push({
            id: 'state',
            label: 'SECTION 2 — STATE',
            subtitle: 'State & Parameters',
            shape: 'rectangle',
            color: 'green',
            narrative: 'Initialize component state and read URL parameters.',
            codeSnippet: lines.filter(l => l.includes('useState') || l.includes('useParams')).slice(0, 3).join('\n'),
            lineStart: 15,
            lineEnd: 25,
            next: hasConditional ? ['decision1'] : ['effects'],
            logicTable: [
                { step: '1', trigger: 'Component mounts', action: 'Initialize state', output: 'State ready', codeRef: 'useState(null)' },
                { step: '2', trigger: 'Component mounts', action: 'Set loading true', output: 'Loading indicator shown', codeRef: 'useState(true)' },
            ],
        });
        edges.push({ id: 'e1', source: 'setup', target: 'state' });
    }

    // Decision node
    if (hasConditional) {
        nodes.push({
            id: 'decision1',
            label: 'CHECK CONDITION',
            shape: 'diamond',
            color: 'orange',
            isDecision: true,
            condition: 'Has required data?',
            yesTarget: 'effects',
            noTarget: 'error',
            narrative: 'Check if the required data/parameters are present before proceeding.',
            codeSnippet: lines.filter(l => l.includes('if (')).slice(0, 2).join('\n') || 'if (id) { ... }',
            lineStart: 25,
            lineEnd: 30,
            logicTable: [
                { step: '3', trigger: 'After state init', action: 'Check condition', output: 'Branch decision', codeRef: 'if (id)' },
            ],
        });
        edges.push({ id: 'e2', source: 'state', target: 'decision1' });
        edges.push({ id: 'e3', source: 'decision1', target: 'effects', label: 'Yes' });
        edges.push({ id: 'e4', source: 'decision1', target: 'error', label: 'No' });

        // Error node
        nodes.push({
            id: 'error',
            label: 'ERROR STATE',
            subtitle: 'Handle missing data',
            shape: 'rectangle',
            color: 'red',
            narrative: 'Handle the case when required data is not available.',
            codeSnippet: 'return <div>Error: Missing data</div>;',
            lineStart: 45,
            lineEnd: 46,
            logicTable: [
                { step: '3a', trigger: 'Condition false', action: 'Return error UI', output: 'Error shown', codeRef: 'return' },
            ],
        });
    }

    // Effects/API section
    if (hasUseEffect || hasAsync) {
        nodes.push({
            id: 'effects',
            label: 'SECTION 3 — EFFECTS',
            subtitle: 'Side Effects & API',
            shape: 'hexagon',
            color: 'purple',
            narrative: 'Execute side effects like API calls when dependencies change.',
            codeSnippet: lines.filter(l => l.includes('useEffect') || l.includes('async') || l.includes('fetch')).slice(0, 4).join('\n'),
            lineStart: 30,
            lineEnd: 45,
            next: ['apiCheck'],
            logicTable: [
                { step: '4', trigger: 'Dependencies change', action: 'Run useEffect', output: 'Effect executed', codeRef: 'useEffect(() => {...}, [id])' },
                { step: '4.1', trigger: 'Effect runs', action: 'Call API', output: 'Request sent', codeRef: 'fetch()' },
                { step: '4.2', trigger: 'Response received', action: 'Update state', output: 'Data stored', codeRef: 'setData(result)' },
            ],
        });
        if (!hasConditional) {
            edges.push({ id: 'e5', source: 'state', target: 'effects' });
        }
    }

    // API Response check
    nodes.push({
        id: 'apiCheck',
        label: 'API RESPONSE',
        shape: 'diamond',
        color: 'orange',
        isDecision: true,
        condition: 'Response OK?',
        yesTarget: 'render',
        noTarget: 'apiError',
        narrative: 'Check if the API call was successful.',
        codeSnippet: 'if (res.ok) { ... }',
        lineStart: 38,
        lineEnd: 42,
        logicTable: [
            { step: '5', trigger: 'API returns', action: 'Check response', output: 'Status known', codeRef: 'res.ok' },
        ],
    });
    edges.push({ id: 'e6', source: 'effects', target: 'apiCheck' });
    edges.push({ id: 'e7', source: 'apiCheck', target: 'render', label: 'Yes' });
    edges.push({ id: 'e8', source: 'apiCheck', target: 'apiError', label: 'No' });

    // API Error node
    nodes.push({
        id: 'apiError',
        label: 'API ERROR',
        subtitle: 'Handle API failure',
        shape: 'rectangle',
        color: 'red',
        narrative: 'Handle API call failures and display error state.',
        codeSnippet: 'console.error("Failed:", error);',
        lineStart: 43,
        lineEnd: 44,
        logicTable: [
            { step: '5a', trigger: 'API fails', action: 'Log error', output: 'Error logged', codeRef: 'console.error' },
        ],
    });

    // Render section
    if (hasReturn) {
        nodes.push({
            id: 'render',
            label: 'SECTION 4 — RENDER',
            subtitle: 'Component Output',
            shape: 'rounded',
            color: 'cyan',
            narrative: 'Return the JSX to render the component UI.',
            codeSnippet: lines.filter(l => l.includes('return') || l.includes('className')).slice(0, 5).join('\n'),
            lineStart: lineCount - 15,
            lineEnd: lineCount,
            logicTable: [
                { step: '6', trigger: 'Render phase', action: 'Return JSX', output: 'UI displayed', codeRef: 'return (<div>...</div>)' },
                { step: '6.1', trigger: 'Render phase', action: 'Map data', output: 'List rendered', codeRef: 'data.map()' },
            ],
        });
    }

    return {
        fileName,
        language,
        nodes,
        edges,
        totalLines: lineCount,
        totalSections: nodes.length,
    };
}
