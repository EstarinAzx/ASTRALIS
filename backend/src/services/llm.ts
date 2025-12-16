// @ts-nocheck
// ============================================================================
// LLM Service - OpenRouter Integration for ASTRALIS (Complete Coverage)
// ============================================================================

import type { VerbosityMode } from '../types/astralis.js';

// ============================================================================
// Types
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
// System Prompt for Complete Coverage
// ============================================================================
function buildSystemPrompt(mode: VerbosityMode): string {
    const modeDescriptions = {
        concise: 'Group related constructs. Create 8-12 nodes.',
        standard: 'Each major construct gets a node. Create 12-20 nodes.',
        deep_dive: 'Every construct gets a node. Create 20+ nodes. COMPLETE COVERAGE.',
    };

    return `You are ASTRALIS - a code visualization system that creates COMPLETE flowcharts.

MODE: ${mode.toUpperCase()} - ${modeDescriptions[mode]}

CRITICAL: EVERY CODE CONSTRUCT MUST BE COVERED. Create a node for:
- Import statements (group or individual)
- Each interface/type definition with ALL properties in logic table
- Function definitions
- Each hook (useState, useEffect, useParams)
- Each conditional (if/else)
- Each API call (fetch, await)
- Each return statement
- Guard clauses (early returns)

RESPOND WITH ONLY VALID JSON (no markdown):

{
  "fileName": "string",
  "language": "string",
  "totalLines": number,
  "totalSections": number,
  "nodes": [...],
  "edges": [...]
}

NODE FORMAT:
{
  "id": "unique_id",
  "label": "NODE LABEL",
  "subtitle": "description",
  "shape": "rectangle|diamond|rounded|hexagon",
  "color": "blue|green|orange|purple|red|cyan",
  "narrative": "What this section does",
  "codeSnippet": "actual code",
  "lineStart": 1,
  "lineEnd": 10,
  "logicTable": [
    { "step": "1", "trigger": "...", "action": "...", "output": "...", "codeRef": "..." }
  ]
}

SHAPES: rectangle=definitions, diamond=conditionals, rounded=start/end, hexagon=async/api
COLORS: blue=imports/types, green=state, orange=logic, purple=effects/api, red=errors, cyan=render`;
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

    if (!apiKey) {
        console.log('⚠️ No LLM_API_KEY, using mock parser');
        return generateMockResponse(fileName, language, code);
    }

    const systemPrompt = buildSystemPrompt(mode);
    const userPrompt = `Analyze this ${language} code from "${fileName}":\n\n\`\`\`${language}\n${code}\n\`\`\``;

    try {
        console.log(`🤖 Calling LLM (${model})...`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                'X-Title': 'ASTRALIS',
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
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json() as {
            choices?: { message?: { content?: string } }[];
        };
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('No content in response');
        }

        const parsed = JSON.parse(content) as AnalysisResult;
        console.log('✅ LLM parsed successfully');
        return parsed;
    } catch (error) {
        console.error('LLM failed:', error);
        console.log('⚠️ Falling back to mock');
        return generateMockResponse(fileName, language, code);
    }
}

// ============================================================================
// Mock Response - SMART CODE PARSER
// ============================================================================
function generateMockResponse(fileName: string, language: string, code: string): AnalysisResult {
    const lines = code.split('\n');
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    let nodeId = 0;
    let prevId: string | null = null;

    const addNode = (node: FlowNode) => {
        nodes.push(node);
        if (prevId) {
            edges.push({ id: `e${nodeId}`, source: prevId, target: node.id });
        }
        prevId = node.id;
    };

    // Find imports (group them)
    const importLines = lines.map((l, i) => ({ line: l, num: i + 1 }))
        .filter(x => x.line.trim().startsWith('import '));

    if (importLines.length > 0) {
        const firstImport = importLines[0]!;
        const lastImport = importLines[importLines.length - 1]!;
        nodeId++;
        addNode({
            id: `n${nodeId}`,
            label: 'IMPORTS',
            subtitle: 'External Dependencies',
            shape: 'rectangle',
            color: 'blue',
            narrative: 'Import required modules and dependencies.',
            codeSnippet: importLines.map(x => x.line).join('\n'),
            lineStart: firstImport.num,
            lineEnd: lastImport.num,
            logicTable: importLines.map((x, i) => ({
                step: String(i + 1),
                trigger: 'File load',
                action: `Import from ${x.line.match(/from ['"](.+)['"]/)?.[1] || 'module'}`,
                output: 'Module ready',
                codeRef: x.line.trim(),
                lineStart: x.num,
                lineEnd: x.num,
            })),
        });
    }

    // Find interfaces
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('interface ') && line.includes('{')) {
            const match = line.match(/interface\s+(\w+)/);
            const name = match?.[1] || 'Interface';
            const startLine = i + 1;
            const properties: string[] = [];

            // Find all properties until closing brace
            let braces = 0;
            let j = i;
            do {
                braces += (lines[j].match(/{/g) || []).length;
                braces -= (lines[j].match(/}/g) || []).length;
                const propMatch = lines[j].match(/^\s+(\w+)(\?)?:\s*(.+)/);
                if (propMatch) {
                    properties.push(`${propMatch[1]}: ${propMatch[3].replace(';', '').trim()}`);
                }
                j++;
            } while (braces > 0 && j < lines.length);

            const endLine = j;
            nodeId++;
            addNode({
                id: `n${nodeId}`,
                label: `Interface: ${name}`,
                subtitle: 'Type Definition',
                shape: 'rectangle',
                color: 'blue',
                narrative: `Define the ${name} interface structure.`,
                codeSnippet: lines.slice(i, j).join('\n'),
                lineStart: startLine,
                lineEnd: endLine,
                logicTable: properties.map((prop, idx) => ({
                    step: String(idx + 1),
                    trigger: 'TypeScript compile',
                    action: `Define ${prop}`,
                    output: 'Property typed',
                    codeRef: prop,
                })),
            });
            i = j - 1; // Skip processed lines
        }
    }

    // Find function/component definition
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if ((line.includes('export default function') || line.includes('export function') ||
            (line.includes('function ') && !line.trim().startsWith('//'))) &&
            !nodes.some(n => n.lineStart === i + 1)) {
            const match = line.match(/function\s+(\w+)/);
            const name = match?.[1] || 'Component';
            nodeId++;
            addNode({
                id: `n${nodeId}`,
                label: `Function: ${name}`,
                subtitle: 'Component Definition',
                shape: 'rectangle',
                color: 'green',
                narrative: `Define the ${name} function component.`,
                codeSnippet: line,
                lineStart: i + 1,
                lineEnd: i + 1,
                logicTable: [{
                    step: '1',
                    trigger: 'Module load',
                    action: `Define ${name}`,
                    output: 'Function ready',
                    codeRef: line.trim().substring(0, 60),
                }],
            });
        }
    }

    // Find useState hooks
    lines.forEach((line, i) => {
        if (line.includes('useState')) {
            const match = line.match(/const\s+\[(\w+)/);
            const name = match?.[1] || 'state';
            nodeId++;
            addNode({
                id: `n${nodeId}`,
                label: `useState: ${name}`,
                subtitle: 'State Hook',
                shape: 'rectangle',
                color: 'green',
                narrative: `Initialize ${name} state variable.`,
                codeSnippet: line.trim(),
                lineStart: i + 1,
                lineEnd: i + 1,
                logicTable: [{
                    step: '1',
                    trigger: 'Component mount',
                    action: `Initialize ${name}`,
                    output: 'State ready',
                    codeRef: line.trim(),
                }],
            });
        }
    });

    // Find useEffect
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('useEffect')) {
            const startLine = i + 1;
            let braces = 0;
            let j = i;
            do {
                braces += (lines[j].match(/{/g) || []).length;
                braces -= (lines[j].match(/}/g) || []).length;
                j++;
            } while (braces > 0 && j < lines.length);

            nodeId++;
            addNode({
                id: `n${nodeId}`,
                label: 'useEffect',
                subtitle: 'Side Effect',
                shape: 'hexagon',
                color: 'purple',
                narrative: 'Execute side effects when dependencies change.',
                codeSnippet: lines.slice(i, Math.min(i + 6, j)).join('\n'),
                lineStart: startLine,
                lineEnd: j,
                logicTable: [{
                    step: '1',
                    trigger: 'Dependencies change',
                    action: 'Run effect',
                    output: 'Effect executed',
                    codeRef: 'useEffect(() => {...})',
                }],
            });
            i = j - 1;
        }
    }

    // Find async functions
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('async function')) {
            const match = line.match(/async\s+function\s+(\w+)/);
            const name = match?.[1] || 'asyncFunc';
            const startLine = i + 1;
            let braces = 0;
            let j = i;
            do {
                braces += (lines[j].match(/{/g) || []).length;
                braces -= (lines[j].match(/}/g) || []).length;
                j++;
            } while (braces > 0 && j < lines.length);

            nodeId++;
            addNode({
                id: `n${nodeId}`,
                label: `Async: ${name}`,
                subtitle: 'Async Function',
                shape: 'hexagon',
                color: 'purple',
                narrative: `Async function ${name} for data fetching.`,
                codeSnippet: lines.slice(i, Math.min(i + 8, j)).join('\n'),
                lineStart: startLine,
                lineEnd: j,
                logicTable: [{
                    step: '1',
                    trigger: 'Function called',
                    action: 'Execute async',
                    output: 'Promise',
                    codeRef: `async function ${name}`,
                }],
            });
            i = j - 1;
        }
    }

    // Find guard clauses (if ... return)
    lines.forEach((line, i) => {
        if ((line.includes('if (') || line.includes('if(')) && line.includes('return')) {
            const condition = line.match(/if\s*\(([^)]+)\)/)?.[1] || 'condition';
            nodeId++;
            addNode({
                id: `n${nodeId}`,
                label: `Guard: ${condition}`,
                subtitle: 'Early Return',
                shape: 'diamond',
                color: 'orange',
                isDecision: true,
                condition,
                narrative: 'Guard clause for early return.',
                codeSnippet: line.trim(),
                lineStart: i + 1,
                lineEnd: i + 1,
                logicTable: [{
                    step: '1',
                    trigger: 'Render',
                    action: `Check ${condition}`,
                    output: 'Branch',
                    codeRef: line.trim(),
                }],
            });
        }
    });

    // Find main return (JSX)
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        if (line.trim().startsWith('return (') || line.trim().startsWith('return <')) {
            const startLine = i + 1;
            let parens = 0;
            let j = i;
            do {
                parens += (lines[j].match(/\(/g) || []).length;
                parens -= (lines[j].match(/\)/g) || []).length;
                j++;
            } while (parens > 0 && j < lines.length);

            nodeId++;
            addNode({
                id: `n${nodeId}`,
                label: 'RENDER',
                subtitle: 'JSX Output',
                shape: 'rounded',
                color: 'cyan',
                narrative: 'Return JSX to render the component UI.',
                codeSnippet: lines.slice(i, Math.min(i + 8, j)).join('\n'),
                lineStart: startLine,
                lineEnd: j,
                logicTable: [{
                    step: '1',
                    trigger: 'Render phase',
                    action: 'Return JSX',
                    output: 'UI displayed',
                    codeRef: 'return (...)',
                }],
            });
            break;
        }
    }

    return {
        fileName,
        language,
        nodes,
        edges,
        totalLines: lines.length,
        totalSections: nodes.length,
    };
}
