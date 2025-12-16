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
// System Prompt - Semantic Flowchart (like user example)
// ============================================================================
function buildSystemPrompt(mode: VerbosityMode): string {
    const modeDescriptions = {
        concise: 'Create 10-15 logical flow nodes. Group related steps.',
        standard: 'Create 15-25 logical flow nodes. Show all major paths.',
        deep_dive: 'Create 25+ nodes. Every decision, function, and flow step visible.',
    };

    return `You are ASTRALIS - a code visualization system that creates SEMANTIC FLOWCHARTS.

MODE: ${mode.toUpperCase()} - ${modeDescriptions[mode]}

PROCESS OVERVIEW:
1. **PLANNING PHASE**: First, think about the code structure using Mermaid syntax.
2. **GENERATION PHASE**: Then, generate the strict JSON output based on your plan.

YOUR GOAL: Create a flowchart that shows the LOGICAL EXECUTION FLOW of the code.

... (principles omitted for brevity, keeping existing logical rules) ...

RESPONSE FORMAT:
You MUST respond in this EXACT format:

<PLANNING>
graph TD
A[Start] --> B{Is Valid?}
B -- Yes --> C[Continue]
B -- No --> D[Error]
... (Draft your full flowchart here in Mermaid syntax first) ...
</PLANNING>

<JSON>
{
  "fileName": "string",
  ... (The actual JSON output) ...
}
</JSON>

... (rest of the prompt remains the same) ...
`;
}
// ============================================================================
// Call LLM
// ============================================================================
// ============================================================================
// Helpers
// ============================================================================

interface CodeAnchor {
    line: number;
    type: 'API' | 'EFFECT' | 'RETURN' | 'HOOK';
    content: string;
}

function analyzeCodeAnchors(code: string): CodeAnchor[] {
    const lines = code.split('\n');
    const anchors: CodeAnchor[] = [];

    lines.forEach((line, index) => {
        const l = line.trim();
        const lineNum = index + 1;

        // 1. API Calls
        if (l.match(/fetch\(|axios\.|query\(|mutation\(/i)) {
            anchors.push({ line: lineNum, type: 'API', content: l.substring(0, 50) });
        }
        // 2. Effects
        else if (l.startsWith('useEffect')) {
            anchors.push({ line: lineNum, type: 'EFFECT', content: 'Side Effect Trigger' });
        }
        // 3. Early Returns (Guards)
        else if (l.startsWith('if') && l.includes('return')) {
            anchors.push({ line: lineNum, type: 'RETURN', content: 'Logic Guard' });
        }
    });

    return anchors;
}

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

    // 1. Deterministic Anchor Analysis
    const anchors = analyzeCodeAnchors(code);
    const anchorList = anchors.map(a => `- Line ${a.line} [${a.type}]: ${a.content}`).join('\n');

    const systemPrompt = buildSystemPrompt(mode);
    const userPrompt = `Analyze this ${language} code from "${fileName}".

CRITICAL INSTRUCTION:
You MUST include nodes for the following DETECTED ANCHORS in the code. Do not skip them:
${anchorList}

CODE:
\`\`\`${language}
${code}
\`\`\``;

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
                max_tokens: 8000,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ OpenRouter error:', response.status, errorText);
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json() as {
            choices?: { message?: { content?: string } }[];
        };
        let content = data.choices?.[0]?.message?.content;

        if (!content) {
            console.error('❌ No content in response:', JSON.stringify(data).substring(0, 500));
            throw new Error('No content in response');
        }

        console.log('📥 Raw LLM response (first 500 chars):', content.substring(0, 500));

        // EXTRACTION LOGIC:
        // The response might contain <PLANNING> ... </PLANNING> blocks.
        // We only want the JSON part.

        let jsonContent = content;

        // 1. Try to find the JSON block inside <JSON> tags if present
        const jsonTagMatch = content.match(/<JSON>([\s\S]*?)<\/JSON>/i);
        if (jsonTagMatch) {
            jsonContent = jsonTagMatch[1];
            console.log('📦 Extracted JSON from <JSON> tags');
        } else {
            // 2. Fallback: Extract from markdown code block
            const codeBlockMatch = content.match(/```json\s*([\s\S]*?)```/);
            if (codeBlockMatch) {
                jsonContent = codeBlockMatch[1];
            } else {
                // 3. Fallback: Find first { and last }
                const start = content.indexOf('{');
                const end = content.lastIndexOf('}');
                if (start !== -1 && end !== -1 && end > start) {
                    jsonContent = content.substring(start, end + 1);
                }
            }
        }

        content = jsonContent;

        const parsed = JSON.parse(content) as AnalysisResult;
        console.log('✅ LLM parsed successfully with', parsed.nodes?.length || 0, 'nodes');

        // 1. GAP VALIDATION (Mathematical)
        console.log('🛡️ Step 1: Running Gap Validator...');
        const gapFilled = validateAndFillGaps(parsed, code, fileName, language);

        // 2. VERIFIER AGENT (LLM Audit)
        console.log('🕵️ Step 2: Running Verifier Agent...');
        const verified = await verifyFlowWithLLM(gapFilled, code, fileName, language);

        return verified;
    } catch (error) {
        console.error('❌ LLM failed:', error);
        console.log('⚠️ Falling back to mock parser');
        return generateMockResponse(fileName, language, code);
    }
}

// ============================================================================
// Verifier Agent - Audits the flow for accuracy and hallucinations
// ============================================================================
async function verifyFlowWithLLM(
    currentResult: AnalysisResult,
    code: string,
    fileName: string,
    language: string
): Promise<AnalysisResult> {
    const apiKey = process.env.LLM_API_KEY;
    const apiUrl = process.env.LLM_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const model = process.env.LLM_MODEL || 'meta-llama/llama-3.2-3b-instruct:free';

    if (!apiKey) return currentResult; // Skip if no API key

    const systemPrompt = `You are ASTRALIS VERIFIER - an advanced code auditor.
YOUR JOB: strict audit of a generated flowchart against source code.

PROCESS:
1. "CRITIQUE": List every single error, hallucination, or label mismatch you find.
2. "JSON": Return the FULL corrected JSON.

AUDIT RULES:
1. CHECK LABELS: Do node labels accurately reflect the code? 
   - ❌ "Handle Submit" -> ✅ "Handle Form Submission"
   
2. CHECK DIAMONDS (CRITICAL):
   - Labels must be PLAIN ENGLISH QUESTIONS.
   - ❌ "!editingProduct" -> ✅ "Is editing product?"
   - ❌ "!confirm(...)" -> ✅ "Did user confirm?"
   - Must have "Yes" and "No" edges.

3. CHECK MISSING LOGIC (STRICT):
   - ❌ MISSING API CALLS: If the code has \`fetch()\` or \`async/await\`, it MUST be in the flowchart.
   - ❌ MISSING SIDE EFFECTS: If \`useEffect\` triggers a function, that function MUST be visualized.
   - ❌ MISSING GUARDS: If there is a \`if (loading) return ...\`, it MUST be a Diamond node.

4. CHECK CONTINUITY:
   - Do NOT skip from \`useEffect\` directly to \`Render\` if there is logic in between.

OUTPUT FORMAT:
CRITIQUE:
- Node X has wrong label...
- Missing specific edge...
- Missing API call in useEffect...
- Missing Loading State check...

JSON:
\`\`\`json
{ ...valid json... }
\`\`\``;

    const userPrompt = `AUDIT THIS FLOWCHART:

SOURCE CODE:
\`\`\`${language}
${code}
\`\`\`

CURRENT FLOWCHART JSON:
\`\`\`json
${JSON.stringify(currentResult, null, 2)}
\`\`\`

Find every tiny inconsistency. Then return the PERFECTED JSON.`;

    try {
        console.log(`🕵️ Verifying with ${model}...`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                'X-Title': 'ASTRALIS-VERIFIER',
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.0, // ABSOLUTE ZERO for strict logic
                max_tokens: 8000,
            }),
        });

        if (!response.ok) {
            console.error('❌ Verifier failed, returning unverified result');
            return currentResult;
        }

        const data = await response.json() as { choices?: { message?: { content?: string } }[] };
        let content = data.choices?.[0]?.message?.content;

        if (!content) return currentResult;

        console.log('📝 Verifier Critique Preview:', content.substring(0, 200) + '...');

        // Extract JSON
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            content = jsonMatch[1].trim();
        } else {
            // Fallback: look for JSON block after "JSON:" or similar
            const jsonStart = content.indexOf('{');
            const jsonEnd = content.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                content = content.substring(jsonStart, jsonEnd + 1);
            }
        }

        const verifiedResult = JSON.parse(content) as AnalysisResult;
        console.log(`✅ Verified! Node count: ${currentResult.nodes.length} -> ${verifiedResult.nodes.length}`);

        return verifiedResult;

    } catch (error) {
        console.error('❌ Verifier loop error:', error);
        return currentResult; // Fallback to original if verifier crashes
    }
}

// ============================================================================
// Gap Validator - Ensures 100% code coverage
// ============================================================================
function validateAndFillGaps(
    result: AnalysisResult,
    code: string,
    fileName: string,
    language: string
): AnalysisResult {
    const totalLines = code.split('\n').length;
    let nodes = [...result.nodes];
    const edges = [...result.edges];

    // 1. Force Sort by lineStart
    nodes.sort((a, b) => (a.lineStart || 0) - (b.lineStart || 0));

    // 2. Remove duplicates or perfectly overlapping nodes
    nodes = nodes.filter((node, index, self) =>
        index === self.findIndex((n) => (
            n.id === node.id || (n.lineStart === node.lineStart && n.lineEnd === node.lineEnd)
        ))
    );

    const gaps: { start: number; end: number; afterNodeId: string | null }[] = [];
    let lastEnd = 0;
    let lastNodeId: string | null = null;

    // 3. Find gaps with strict continuity
    for (const node of nodes) {
        const start = node.lineStart || 0;
        const end = node.lineEnd || 0;

        // If current node starts AFTER the last one ended + 1, we have a gap
        if (start > lastEnd + 1) {
            gaps.push({ start: lastEnd + 1, end: start - 1, afterNodeId: lastNodeId });
        }

        // Update lastEnd, but handle overlaps (max)
        lastEnd = Math.max(lastEnd, end);
        lastNodeId = node.id;
    }

    // Check end gap
    if (lastEnd < totalLines) {
        gaps.push({ start: lastEnd + 1, end: totalLines, afterNodeId: lastNodeId });
    }

    // Check start gap
    if (nodes.length > 0 && (nodes[0].lineStart || 0) > 1) {
        gaps.unshift({ start: 1, end: (nodes[0].lineStart || 1) - 1, afterNodeId: null });
    }

    if (gaps.length > 0) {
        console.log(`⚠️ Found ${gaps.length} coverage gaps, filling...`);

        const codeLines = code.split('\n');

        for (const gap of gaps) {
            const gapCode = codeLines.slice(gap.start - 1, gap.end).join('\n');
            const gapId = `gap_${gap.start}_${gap.end}`;

            // Determine what kind of code this is
            const detection = detectCodeType(gapCode, gap.start, gap.end);
            const label = detection.label;

            const newNode: FlowNode = {
                id: gapId,
                label: label,
                subtitle: `Lines ${gap.start}-${gap.end}`,
                shape: detection.shape, // Use detected shape
                color: detection.color, // Use detected color
                narrative: `Code section from lines ${gap.start} to ${gap.end} that was not captured by the analysis.`,
                codeSnippet: gapCode,
                lineStart: gap.start,
                lineEnd: gap.end,
                logicTable: [{
                    step: '1',
                    trigger: 'Code execution',
                    action: label,
                    output: 'See code',
                }],
                next: [],
            };

            nodes.push(newNode);

            // Add edge from previous node to this gap
            if (gap.afterNodeId) {
                edges.push({
                    id: `e_to_${gapId}`,
                    source: gap.afterNodeId,
                    target: gapId,
                });
            }

            console.log(`  📍 Filled gap: Lines ${gap.start}-${gap.end} → "${label}"`);
        }

        // Re-sort after adding gap nodes
        nodes.sort((a, b) => (a.lineStart || 0) - (b.lineStart || 0));
    }

    return {
        ...result,
        nodes,
        edges,
        totalLines,
    };
}

// Helper to detect what type of code a section contains
function detectCodeType(code: string, lineStart: number, lineEnd: number): { label: string, shape: NodeShape, color: SectionColor } {
    const lower = code.toLowerCase().trim();

    // 1. Loading Checks (Diamond)
    if (lower.match(/if\s*\(\s*!*loading/)) {
        return { label: 'Is Loading?', shape: 'diamond', color: 'orange' };
    }

    // 2. Early Returns / Error Checks (Diamond)
    if (lower.match(/if\s*\(\s*!/) || lower.match(/if\s*\(/)) {
        if (lower.includes('return')) {
            return { label: 'Logic Check & Return', shape: 'diamond', color: 'red' };
        }
        return { label: 'Logic Condition', shape: 'diamond', color: 'orange' };
    }

    // 3. API Calls
    if (lower.includes('async') && lower.includes('fetch')) return { label: 'API Fetch Function', shape: 'hexagon', color: 'purple' };
    if (lower.includes('fetch(')) return { label: 'Data Fetching', shape: 'hexagon', color: 'purple' };

    // 4. Handlers
    if (lower.includes('handle') && lower.includes('async')) return { label: 'Event Handler (Async)', shape: 'rectangle', color: 'purple' };
    if (lower.includes('handle')) return { label: 'Event Handler', shape: 'rectangle', color: 'blue' };

    // 5. Hooks
    if (lower.startsWith('useeffect')) return { label: 'Side Effect (useEffect)', shape: 'rounded', color: 'green' };
    if (lower.startsWith('usestate')) return { label: 'State Declaration', shape: 'rectangle', color: 'green' };

    // 6. Structure
    if (lower.includes('interface') || lower.includes('type ')) return { label: 'Type Definition', shape: 'rectangle', color: 'blue' };
    if (lower.includes('import')) return { label: 'Imports', shape: 'rectangle', color: 'blue' };

    // 7. Render & JSX
    if (lower.includes('return') && lower.includes('<')) return { label: 'Component Render', shape: 'rounded', color: 'cyan' };

    // 8. Default
    return { label: `Code Block (Lines ${lineStart}-${lineEnd})`, shape: 'rectangle', color: 'orange' };
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
