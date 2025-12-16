// ============================================================================
// LLM Service - OpenRouter Integration for ASTRALIS v2
// ============================================================================

import type { VerbosityMode } from '../types/astralis.js';

// ============================================================================
// Types
// ============================================================================
interface LayerData {
    title: string;
    description: string;
    mermaidDef: string;
    nodes: DiagramNode[];
}

interface DiagramNode {
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

interface LogicRow {
    condition: string;
    action: string;
    output: string;
    outputType: 'next' | 'exit' | 'loop';
}

interface AstralisResponse {
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
// System Prompt
// ============================================================================
function buildSystemPrompt(mode: VerbosityMode): string {
    const modeDescriptions = {
        concise: 'High-level architectural view. Focus on main components only.',
        standard: 'Balanced structure and logic flow. Include major functions and their relationships.',
        deep_dive: 'Full variable tracking, loops, and comprehensive flow control analysis.',
    };

    return `You are ASTRALIS (Abstract Syntax Tree Rendering And Logic Interpretation System).
Your job is to analyze source code and produce a structured JSON response with 6 layers of understanding.

MODE: ${mode.toUpperCase()} - ${modeDescriptions[mode]}

You MUST respond with ONLY valid JSON (no markdown, no code blocks, no explanation).

The response structure:
{
  "fileName": "string",
  "language": "string",
  "layers": {
    "L0_context": {
      "title": "Context - High-level purpose",
      "description": "What this file/module is for",
      "mermaidDef": "flowchart TD\\n  A[Main Purpose] --> B[Key Responsibility]",
      "nodes": [
        {
          "id": "main",
          "label": "Main Purpose",
          "type": "module",
          "lineStart": 1,
          "lineEnd": 10,
          "narrative": "This module handles...",
          "logicTable": [{"condition": "On load", "action": "Initialize", "output": "Ready", "outputType": "next"}],
          "codeSnippet": "// relevant code"
        }
      ]
    },
    "L1_container": {
      "title": "Container - Classes/Modules",
      "description": "The structural containers in this code",
      "mermaidDef": "flowchart TD\\n  ...",
      "nodes": [...]
    },
    "L2_component": {
      "title": "Component - Functions/Methods",
      "description": "The executable components",
      "mermaidDef": "flowchart TD\\n  ...",
      "nodes": [...]
    },
    "L3_code": {
      "title": "Code - Line-by-line logic",
      "description": "Detailed execution flow",
      "mermaidDef": "flowchart TD\\n  ...",
      "nodes": [...]
    },
    "L4_data": {
      "title": "Data - Variables/State",
      "description": "Data flow and state management",
      "mermaidDef": "flowchart TD\\n  ...",
      "nodes": [...]
    },
    "L5_infra": {
      "title": "Infra - Dependencies/Imports",
      "description": "External dependencies and infrastructure",
      "mermaidDef": "flowchart TD\\n  ...",
      "nodes": [...]
    }
  }
}

MERMAID RULES:
- Use \\n for newlines in mermaidDef strings
- Use simple node IDs (A, B, C or descriptive like auth, validate)
- Keep diagrams clean and readable
- Use flowchart TD (top-down) or LR (left-right)

NODE RULES:
- Each node must have unique id
- lineStart/lineEnd should reference actual line numbers
- logicTable shows condition → action → result flow
- outputType: "next" (continues), "exit" (stops), "loop" (repeats)
- codeSnippet should be the relevant source code`;
}

// ============================================================================
// Call LLM
// ============================================================================
export async function callLLM(
    code: string,
    fileName: string,
    language: string,
    mode: VerbosityMode
): Promise<AstralisResponse> {
    const apiKey = process.env.LLM_API_KEY;
    const apiUrl = process.env.LLM_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const model = process.env.LLM_MODEL || 'meta-llama/llama-3.2-3b-instruct:free';

    // If no API key, return mock response
    if (!apiKey) {
        console.log('⚠️ No LLM_API_KEY set, returning mock response');
        return generateMockResponse(fileName, language, code);
    }

    const systemPrompt = buildSystemPrompt(mode);
    const userPrompt = `Analyze this ${language} code from file "${fileName}":\n\n\`\`\`${language}\n${code}\n\`\`\``;

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
        const parsed = JSON.parse(content) as AstralisResponse;
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
function generateMockResponse(fileName: string, language: string, code: string): AstralisResponse {
    const lines = code.split('\n');
    const lineCount = lines.length;

    return {
        fileName,
        language,
        layers: {
            L0_context: {
                title: 'Context - High-level purpose',
                description: `This ${language} file provides core functionality for the application.`,
                mermaidDef: `flowchart TD
    A[${fileName}] --> B[Core Logic]
    B --> C[Data Processing]
    B --> D[Output Generation]`,
                nodes: [
                    {
                        id: 'main',
                        label: fileName,
                        type: 'module',
                        lineStart: 1,
                        lineEnd: lineCount,
                        narrative: `The ${fileName} module serves as a key component in the system, handling data processing and business logic.`,
                        logicTable: [
                            { condition: 'On import', action: 'Initialize module', output: 'Module ready', outputType: 'next' },
                        ],
                        codeSnippet: lines.slice(0, 5).join('\n'),
                    },
                ],
            },
            L1_container: {
                title: 'Container - Classes/Modules',
                description: 'Structural containers identified in the code.',
                mermaidDef: `flowchart TD
    Module[Main Module] --> Functions[Functions]
    Functions --> Utils[Utilities]`,
                nodes: [
                    {
                        id: 'container',
                        label: 'Main Container',
                        type: 'class',
                        lineStart: 1,
                        lineEnd: Math.floor(lineCount / 2),
                        narrative: 'The primary container that encapsulates the main functionality.',
                        logicTable: [
                            { condition: 'Instantiation', action: 'Create instance', output: 'Object ready', outputType: 'next' },
                        ],
                        codeSnippet: lines.slice(0, 3).join('\n'),
                    },
                ],
            },
            L2_component: {
                title: 'Component - Functions/Methods',
                description: 'Executable components and their relationships.',
                mermaidDef: `flowchart TD
    Entry[Entry Point] --> Validate[Validate Input]
    Validate --> Process[Process Data]
    Process --> Return[Return Result]`,
                nodes: [
                    {
                        id: 'entry',
                        label: 'Entry Point',
                        type: 'function',
                        lineStart: 1,
                        lineEnd: 10,
                        narrative: 'The main entry point that orchestrates the execution flow.',
                        logicTable: [
                            { condition: 'Function called', action: 'Validate inputs', output: 'Continue', outputType: 'next' },
                            { condition: 'Invalid input', action: 'Throw error', output: 'Exit', outputType: 'exit' },
                        ],
                        codeSnippet: lines.slice(0, 5).join('\n'),
                    },
                ],
            },
            L3_code: {
                title: 'Code - Line-by-line logic',
                description: 'Detailed execution flow analysis.',
                mermaidDef: `flowchart TD
    L1[Line 1: Setup] --> L2[Line 2-5: Logic]
    L2 --> L3[Line 6-10: Process]
    L3 --> L4[Return]`,
                nodes: [
                    {
                        id: 'logic',
                        label: 'Core Logic',
                        type: 'method',
                        lineStart: 1,
                        lineEnd: lineCount,
                        narrative: 'Step-by-step execution of the main logic.',
                        logicTable: [
                            { condition: 'Start', action: 'Initialize variables', output: 'Ready', outputType: 'next' },
                            { condition: 'Loop condition', action: 'Iterate', output: 'Continue', outputType: 'loop' },
                            { condition: 'Complete', action: 'Return result', output: 'Done', outputType: 'exit' },
                        ],
                        codeSnippet: code.slice(0, 200),
                    },
                ],
            },
            L4_data: {
                title: 'Data - Variables/State',
                description: 'Data flow and state management patterns.',
                mermaidDef: `flowchart LR
    Input[Input Data] --> Transform[Transform]
    Transform --> State[State Update]
    State --> Output[Output]`,
                nodes: [
                    {
                        id: 'data',
                        label: 'Data Flow',
                        type: 'function',
                        lineStart: 1,
                        lineEnd: lineCount,
                        narrative: 'Data enters the system, gets transformed, and produces output.',
                        logicTable: [
                            { condition: 'Input received', action: 'Parse data', output: 'Parsed', outputType: 'next' },
                            { condition: 'Valid data', action: 'Store in state', output: 'Updated', outputType: 'next' },
                        ],
                        codeSnippet: lines.slice(0, 3).join('\n'),
                    },
                ],
            },
            L5_infra: {
                title: 'Infra - Dependencies/Imports',
                description: 'External dependencies and infrastructure requirements.',
                mermaidDef: `flowchart TD
    File[${fileName}] --> Deps[Dependencies]
    Deps --> Lib1[Library 1]
    Deps --> Lib2[Library 2]`,
                nodes: [
                    {
                        id: 'infra',
                        label: 'Infrastructure',
                        type: 'module',
                        lineStart: 1,
                        lineEnd: 5,
                        narrative: 'The file depends on external libraries and modules for its functionality.',
                        logicTable: [
                            { condition: 'Import', action: 'Load dependency', output: 'Available', outputType: 'next' },
                        ],
                        codeSnippet: lines.slice(0, 3).join('\n'),
                    },
                ],
            },
        },
    };
}
