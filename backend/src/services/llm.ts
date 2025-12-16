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

YOUR GOAL: Create a flowchart that shows the LOGICAL EXECUTION FLOW of the code, not just its structure.
Think of it like explaining the code to a junior developer step by step.

IMPORTANT PRINCIPLES:
1. Each node represents a LOGICAL STEP (not just a code construct)
   - "Provider mounts in the app" NOT "export const AuthProvider"
   - "Create user and loading state" NOT "useState calls"
   - "Try to restore session from browser storage" NOT "useEffect"

2. Use DECISION DIAMONDS for real conditionals with Yes/No branches:
   - "Valid token and user data found?"
   - "Is there a logged-in user?"
   - "Login successful?"

3. Group related code into logical steps:
   - Multiple lines that work together = one node
   - Show the PURPOSE not just the syntax

4. Narratives must explain WHAT the code does in plain English

RESPOND WITH ONLY VALID JSON:

{
  "fileName": "string",
  "language": "string",
  "totalLines": number,
  "totalSections": number,
  "nodes": [
    {
      "id": "unique_id",
      "label": "Human-readable step name",
      "subtitle": "Brief description",
      "shape": "rectangle|diamond|rounded|hexagon",
      "color": "blue|green|orange|purple|red|cyan",
      "narrative": "Plain English explanation of what this code section does and why",
      "codeSnippet": "FULL source code - NO abbreviation like {...} or ... - include COMPLETE code",
      "lineStart": 1,
      "lineEnd": 10,
      "isDecision": true/false,
      "condition": "The question being asked (for diamonds)",
      "yesTarget": "node_id for Yes branch",
      "noTarget": "node_id for No branch",
      "next": ["node_id"] (for non-decision nodes),
      "logicTable": [
        {
          "step": "1",
          "trigger": "What causes this step",
          "action": "What happens",
          "output": "The result",
          "codeRef": "Specific code reference"
        }
      ]
    }
  ],
  "edges": [
    { "id": "e1", "source": "node1", "target": "node2", "label": "" },
    { "id": "e2", "source": "decision1", "target": "yes_node", "label": "Yes" },
    { "id": "e3", "source": "decision1", "target": "no_node", "label": "No" }
  ]
}

🔴🔴🔴 CRITICAL EDGE RULES - YOU MUST FOLLOW THESE 🔴🔴🔴

1. EVERY node (except final render) MUST have outgoing edge(s)

2. ⚠️ DECISION DIAMONDS - ABSOLUTE REQUIREMENT:
   Every diamond node MUST have EXACTLY 2 edges with LABELS:
   
   ✅ REQUIRED FORMAT:
   { "id": "e5", "source": "diamond_id", "target": "success_node", "label": "Yes" }
   { "id": "e6", "source": "diamond_id", "target": "failure_node", "label": "No" }
   
   ❌ NEVER DO THIS (no labels):
   { "id": "e5", "source": "diamond_id", "target": "next_node" }  // MISSING LABEL!
   
   ❌ NEVER DO THIS (only one edge):
   Only having Yes edge without No edge

3. The "label" field MUST be exactly "Yes" or "No" (case sensitive!)
   - "label": "Yes" → for the success/true path
   - "label": "No" → for the failure/false path

4. Create nodes for BOTH paths:
   - Yes path → usually continue normal flow (could be same as No path merge point)
   - No path → error handling, return early, or merge back to main flow

5. Regular (non-diamond) nodes: edge to next step WITHOUT label


SHAPES:
- "rectangle" = State, definitions, assignments, setup steps
- "diamond" = if/else, conditionals, checks (MUST have Yes/No branches)
- "rounded" = Start/end nodes, final renders
- "hexagon" = API calls, fetch, async operations

⚠️ DIAMOND LABEL RULES - CRITICAL:
- The "condition" and "label" for diamonds MUST be PLAIN ENGLISH QUESTIONS
- ❌ WRONG: "!editingProduct", "confirm('Delete?')", "response.ok"
- ✅ RIGHT: "Is editing a product?", "User confirmed delete?", "Was response successful?"
- Always phrase as a YES/NO question in natural language
- Examples:
  * Code: if (!user) → Diamond: "Is user logged in?"
  * Code: if (response.ok) → Diamond: "Was API call successful?"
  * Code: if (confirm('Sure?')) → Diamond: "Did user confirm action?"
  * Code: if (items.length > 0) → Diamond: "Are there items in the list?"

COLORS:
- "blue" = Imports, setup, initialization
- "green" = State declarations, hooks
- "orange" = Conditionals, decisions, logic
- "purple" = API calls, async, side effects
- "red" = Error handling, catch blocks, failures
- "cyan" = Render output, return JSX

⚠️ SEQUENTIAL FLOW RULE - VERY IMPORTANT:
- Nodes MUST be connected in LINE ORDER (top to bottom of file)
- First node (imports) at lineStart 1
- Each node connects to the next node in the file
- Even if code blocks seem independent, they have reading order
- Node with lineStart 1-10 → connects to → Node with lineStart 11-20 → etc.
- NO ORPHAN NODES - every node must have incoming edge (except first)
- Exception: Decision branches (Yes/No paths that merge later)

EXAMPLE: If your nodes are ordered by lineStart as: A(1-5), B(8-15), C(20-30), D(35-50)
Then edges MUST include: A→B, B→C, C→D (plus any decision branches)

FLOW PATTERN FOR REACT COMPONENTS:
1. Component mounts → Create state → Check/restore saved data
2. Decision: Data found? → Yes: use it, No: handle missing
3. Effects run → API calls → Decision: Success? → Yes: store, No: error
4. Render decision: Loading? → Yes: show loader, No: render UI
5. User actions → Functions (login, logout, etc.) each with their own flow

LOGIC TABLE: For each node, break down into steps that explain:
- What triggers this code to run
- What action it takes
- What the output/result is
- The specific code reference

CRITICAL COVERAGE REQUIREMENT:
- EVERY line of code must be covered by at least one node
- lineStart and lineEnd MUST span the entire file from line 1 to the last line
- NO GAPS: If the code has 200 lines, your nodes must cover lines 1-200
- Check your work: Add up all lineStart-lineEnd ranges = total lines
- Include: imports, interfaces, types, function signatures, hooks, conditionals, returns, everything
- When grouping, use lineStart of first line and lineEnd of last line in the group

CODE SNIPPET RULES:
- codeSnippet MUST contain the COMPLETE source code for that node
- NEVER abbreviate with {...} or ... or [truncated]
- For interfaces: include ALL properties, even nested ones
- For functions: include the FULL function body
- If code is long, that's OK - include it all

LINE RANGE RULES:
- lineStart = first line of the code section
- lineEnd = LAST line of the code section (including closing braces)
- For FUNCTIONS: lineStart = function keyword line, lineEnd = closing } brace
  * Example: function foo() { ... } on lines 10-50 → lineStart: 10, lineEnd: 50
- For INTERFACES/TYPES: include opening brace to closing brace
  * Example: interface User { ... } on lines 5-20 → lineStart: 5, lineEnd: 20
- For COMPONENTS: cover the entire component function body
- NEVER set lineStart === lineEnd unless it truly is a single-line statement

VERIFICATION: Before responding, verify:
□ First node starts at line 1
□ Last node ends at the final line
□ No line numbers are skipped between nodes
□ Every interface has its properties in a logic table
□ Every function/method is represented
□ codeSnippet contains FULL code, not abbreviated

REMEMBER: The goal is COMPLETE coverage - every single piece of code must be visualized.`;
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

        // Extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            content = jsonMatch[1].trim();
            console.log('📦 Extracted JSON from code block');
        }

        // Try to find JSON object if response has extra text
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
            content = content.substring(jsonStart, jsonEnd + 1);
        }

        const parsed = JSON.parse(content) as AnalysisResult;
        console.log('✅ LLM parsed successfully with', parsed.nodes?.length || 0, 'nodes');
        return parsed;
    } catch (error) {
        console.error('❌ LLM failed:', error);
        console.log('⚠️ Falling back to mock parser');
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
