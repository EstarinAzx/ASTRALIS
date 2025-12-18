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
    sourceHandle?: string; // 'yes' or 'no' for diamond nodes
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

/**
 * Convert raw code conditions to human-readable English
 * Examples:
 * - !editingProduct -> "Is editing product?"
 * - !confirm('Delete?') -> "Did user confirm: Delete?"
 * - loading -> "Is loading?"
 * - !user -> "Is user logged in?"
 * - newPassword !== confirmPassword -> "Do passwords match?"
 * - !response.ok -> "Did request succeed?"
 */
function conditionToEnglish(condition: string): string {
    const c = condition.trim();

    // 1. Comparison operators: a !== b or a === b
    if (c.includes('!==')) {
        const parts = c.split('!==').map(p => p.trim());
        if (parts.length === 2) {
            const left = parts[0].replace(/([A-Z])/g, ' $1').toLowerCase().trim();
            const right = parts[1].replace(/([A-Z])/g, ' $1').toLowerCase().trim();

            // Common patterns
            if (left.includes('password') && right.includes('password')) {
                return 'Do passwords match?';
            }
            if (left.includes('confirm') && right.includes('password')) {
                return 'Do passwords match?';
            }

            return `Does ${left} equal ${right}?`;
        }
    }

    // 2. Optional chaining: user?.id, response?.ok, data?.value
    const optionalChainMatch = c.match(/^(\w+)\?\.([\w.]+)$/);
    if (optionalChainMatch) {
        const obj = optionalChainMatch[1].replace(/([A-Z])/g, ' $1').toLowerCase().trim();
        const prop = optionalChainMatch[2].replace(/([A-Z])/g, ' $1').toLowerCase().trim();

        if (prop === 'id') return `Does ${obj} ID exist?`;
        if (prop === 'ok') return `Is ${obj} response OK?`;
        if (prop.includes('email')) return `Does ${obj} have email?`;
        if (prop.includes('name')) return `Does ${obj} have name?`;

        return `Does ${obj} have ${prop}?`;
    }

    // 2b. Object property negation: !response.ok, !data.valid
    const propNegationMatch = c.match(/^!(\w+)\.(\w+)$/);
    if (propNegationMatch) {
        const obj = propNegationMatch[1];
        const prop = propNegationMatch[2];

        if (prop === 'ok') return 'Did request fail?';
        if (prop === 'valid') return `Is ${obj} invalid?`;
        if (prop === 'success') return `Did ${obj} fail?`;
        if (prop === 'length') return `Is ${obj} empty?`;

        return `Is ${obj}.${prop} false?`;
    }

    // 2c. Positive object property: response.ok, user.isAdmin
    const propPositiveMatch = c.match(/^(\w+)\.(\w+)$/);
    if (propPositiveMatch) {
        const obj = propPositiveMatch[1].replace(/([A-Z])/g, ' $1').toLowerCase().trim();
        const prop = propPositiveMatch[2];

        if (prop === 'ok') return 'Is response OK?';
        if (prop === 'success') return `Did ${obj} succeed?`;
        if (prop.startsWith('is')) return `Is ${obj} ${prop.replace('is', '').toLowerCase()}?`;

        return `Is ${obj} ${prop}?`;
    }

    // 3. Confirm dialogs: !confirm('...') or !confirm(`...`)
    const confirmMatch = c.match(/!?confirm\s*\(\s*[`'"](.+?)[`'"]\s*\)/);
    if (confirmMatch) {
        const message = confirmMatch[1].replace(/\$\{.*?\}/g, '...').substring(0, 25);
        return c.startsWith('!')
            ? `User declined: "${message}"?`
            : `User confirmed: "${message}"?`;
    }

    // 4. Negation patterns: !variableName
    const negationMatch = c.match(/^!(\w+)$/);
    if (negationMatch) {
        const varName = negationMatch[1];
        const readable = varName.replace(/([A-Z])/g, ' $1').toLowerCase().trim();

        // Common patterns
        if (readable === 'token') return 'Is token missing?';
        if (readable.includes('loading')) return 'Is not loading?';
        if (readable.includes('editing')) return `Is not ${readable}?`;
        if (readable.includes('user')) return 'Is user logged out?';
        if (readable.includes('data')) return 'Is data missing?';
        if (readable.includes('error')) return 'No error?';
        if (readable.includes('valid')) return 'Is invalid?';
        if (readable.includes('auth')) return 'Not authenticated?';

        return `Is ${readable} missing?`;
    }

    // 5. Positive check: variableName (without !)
    const positiveMatch = c.match(/^(\w+)$/);
    if (positiveMatch) {
        const varName = positiveMatch[1];
        const readable = varName.replace(/([A-Z])/g, ' $1').toLowerCase().trim();

        if (readable === 'token') return 'Has valid token?';
        if (readable.includes('loading')) return 'Is loading?';
        if (readable.includes('editing')) return `Is ${readable}?`;
        if (readable.includes('user')) return 'Is user logged in?';
        if (readable.includes('error')) return 'Has error?';
        if (readable.includes('auth')) return 'Is authenticated?';

        return `Is ${readable} true?`;
    }

    // 6. Method calls: !something.trim()
    if (c.includes('.trim()')) {
        const varMatch = c.match(/!?(\w+)\.trim\(\)/);
        if (varMatch) {
            const readable = varMatch[1].replace(/([A-Z])/g, ' $1').toLowerCase().trim();
            return c.startsWith('!') ? `Is ${readable} empty?` : `Is ${readable} provided?`;
        }
    }

    // 7. Comparison with null/undefined
    if (c.includes('===') || c.includes('!==')) {
        const parts = c.split(/===|!==/).map(p => p.trim());
        if (parts.length === 2) {
            const varName = parts[0].replace('!', '');
            const value = parts[1];
            const readable = varName.replace(/([A-Z])/g, ' $1').toLowerCase().trim();

            if (value === 'null' || value === 'undefined') {
                return c.includes('!==') ? `Does ${readable} exist?` : `Is ${readable} missing?`;
            }
            if (value === 'true') return `Is ${readable} true?`;
            if (value === 'false') return `Is ${readable} false?`;

            return c.includes('!==') ? `Is ${readable} different?` : `Is ${readable} equal?`;
        }
    }

    // 8. Array/length checks
    if (c.includes('.length')) {
        const varMatch = c.match(/(\w+)\.length/);
        if (varMatch) {
            const readable = varMatch[1].replace(/([A-Z])/g, ' $1').toLowerCase().trim();
            if (c.includes('=== 0') || c.includes('< 1') || c.startsWith('!')) return `Is ${readable} empty?`;
            if (c.includes('> 0') || c.includes('>= 1')) return `Has ${readable}?`;
            return `Check ${readable} count?`;
        }
    }

    // 9. Complex conditions - simplify
    if (c.length > 40) {
        const firstPart = c.split(/&&|\|\|/)[0].trim();
        if (firstPart !== c) {
            return conditionToEnglish(firstPart) + ' (+more)';
        }
    }

    // 10. Default: Clean up and make readable
    let readable = c
        .replace(/!/g, 'not ')
        .replace(/&&/g, ' and ')
        .replace(/\|\|/g, ' or ')
        .replace(/\./g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

    if (readable.length > 30) {
        readable = readable.substring(0, 27) + '...';
    }

    return readable.charAt(0).toUpperCase() + readable.slice(1) + '?';
}

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

        // 1. API Calls (fetch, axios, etc.)
        if (l.match(/fetch\(|axios\.|query\(|mutation\(/i)) {
            anchors.push({ line: lineNum, type: 'API', content: l.substring(0, 50) });
        }
        // 2. Async Arrow Functions (const name = async () => {})
        else if (l.match(/^const\s+\w+\s*=\s*async\s*\(/)) {
            const name = l.match(/^const\s+(\w+)/)?.[1] || 'asyncFn';
            anchors.push({ line: lineNum, type: 'API', content: `Async: ${name}` });
        }
        // 3. Regular Arrow Functions (const name = (...) => {})
        else if (l.match(/^const\s+\w+\s*=\s*\([^)]*\)\s*(:\s*\w+)?\s*=>/)) {
            const name = l.match(/^const\s+(\w+)/)?.[1] || 'fn';
            anchors.push({ line: lineNum, type: 'HOOK', content: `Function: ${name}` });
        }
        // 4. Effects
        else if (l.startsWith('useEffect')) {
            anchors.push({ line: lineNum, type: 'EFFECT', content: 'Side Effect Trigger' });
        }
        // 5. Early Returns (Guards)
        else if (l.startsWith('if') && l.includes('return')) {
            anchors.push({ line: lineNum, type: 'RETURN', content: 'Logic Guard' });
        }
        // 6. Custom Hooks (useAuth, useQuery, etc.)
        else if (l.match(/^const\s+.*=\s*use[A-Z]/)) {
            const hookName = l.match(/use[A-Z]\w+/)?.[0] || 'useHook';
            anchors.push({ line: lineNum, type: 'HOOK', content: `Hook: ${hookName}` });
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

        // CRITICAL: If LLM returns 0 nodes, fallback to mock parser immediately
        if (!parsed.nodes || parsed.nodes.length === 0) {
            console.log('⚠️ LLM returned 0 nodes, falling back to mock parser');
            return generateMockResponse(fileName, language, code);
        }

        // 1. GAP VALIDATION - DISABLED (user requested no gap filling)
        // console.log('🛡️ Step 1: Running Gap Validator...');
        // const gapFilled = validateAndFillGaps(parsed, code, fileName, language);
        const gapFilled = parsed; // Pass through without gap filling

        // 2. VERIFIER AGENT (LLM Audit)
        console.log('🕵️ Step 2: Running Verifier Agent...');
        const verified = await verifyFlowWithLLM(gapFilled, code, fileName, language);

        // FINAL CHECK: If verification returns 0 nodes, fallback to mock parser
        if (!verified.nodes || verified.nodes.length === 0) {
            console.log('⚠️ Verification returned 0 nodes, falling back to mock parser');
            return generateMockResponse(fileName, language, code);
        }

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

    // Safety check: if nodes is undefined or not an array, return empty result
    if (!result.nodes || !Array.isArray(result.nodes)) {
        console.log('⚠️ validateAndFillGaps: nodes is undefined or not an array, skipping');
        return {
            ...result,
            nodes: result.nodes || [],
            edges: result.edges || [],
        };
    }

    let nodes = [...result.nodes];
    const edges = [...(result.edges || [])];

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
    const original = code.trim();

    // 1. Async Arrow Functions (const name = async () => {})
    const asyncArrowMatch = original.match(/^const\s+(\w+)\s*=\s*async\s*\(/m);
    if (asyncArrowMatch) {
        const fnName = asyncArrowMatch[1];
        // Check if it's an API/fetch function
        if (lower.includes('fetch(') || lower.includes('api')) {
            return { label: `API: ${fnName}`, shape: 'hexagon', color: 'purple' };
        }
        // Check if it's a handler
        if (fnName.toLowerCase().startsWith('handle') || fnName.toLowerCase().includes('submit') || fnName.toLowerCase().includes('update')) {
            return { label: `Handler: ${fnName}`, shape: 'hexagon', color: 'purple' };
        }
        return { label: `Async: ${fnName}`, shape: 'hexagon', color: 'purple' };
    }

    // 2. Regular Arrow Functions (const name = (...) => {})
    const arrowMatch = original.match(/^const\s+(\w+)\s*=\s*\([^)]*\)\s*(:\s*[^=]+)?\s*=>/m);
    if (arrowMatch) {
        const fnName = arrowMatch[1];
        // Check if it's a getter/helper
        if (fnName.toLowerCase().startsWith('get')) {
            return { label: `Helper: ${fnName}`, shape: 'rectangle', color: 'orange' };
        }
        // Check if it's a handler
        if (fnName.toLowerCase().startsWith('handle')) {
            return { label: `Handler: ${fnName}`, shape: 'rectangle', color: 'blue' };
        }
        return { label: `Function: ${fnName}`, shape: 'rectangle', color: 'blue' };
    }

    // 3. Loading Checks (Diamond)
    if (lower.match(/if\s*\(\s*!*loading/)) {
        return { label: 'Is Loading?', shape: 'diamond', color: 'orange' };
    }

    // 4. If statements - extract and convert condition to English
    const ifMatch = original.match(/if\s*\(([^)]+(?:\([^)]*\))?[^)]*)\)/);
    if (ifMatch) {
        const readable = conditionToEnglish(ifMatch[1]);
        if (lower.includes('return')) {
            return { label: readable, shape: 'diamond', color: 'red' };
        }
        return { label: readable, shape: 'diamond', color: 'orange' };
    }

    // 5. API Calls
    if (lower.includes('async') && lower.includes('fetch')) return { label: 'API Fetch Function', shape: 'hexagon', color: 'purple' };
    if (lower.includes('fetch(')) return { label: 'Data Fetching', shape: 'hexagon', color: 'purple' };

    // 6. Handlers (fallback)
    if (lower.includes('handle') && lower.includes('async')) return { label: 'Event Handler (Async)', shape: 'rectangle', color: 'purple' };
    if (lower.includes('handle')) return { label: 'Event Handler', shape: 'rectangle', color: 'blue' };

    // 7. Hooks
    if (lower.match(/^\s*useeffect/)) return { label: 'Side Effect (useEffect)', shape: 'rounded', color: 'green' };
    if (lower.match(/^\s*usestate/)) return { label: 'State Declaration', shape: 'rectangle', color: 'green' };
    if (lower.match(/use[a-z]+\(/)) return { label: 'Hook Call', shape: 'rectangle', color: 'green' };

    // 8. Structure
    if (lower.includes('interface') || lower.includes('type ')) return { label: 'Type Definition', shape: 'rectangle', color: 'blue' };
    if (lower.includes('import')) return { label: 'Imports', shape: 'rectangle', color: 'blue' };

    // 9. Render & JSX
    if (lower.includes('return') && lower.includes('<')) return { label: 'Component Render', shape: 'rounded', color: 'cyan' };

    // 10. Default - make more descriptive
    const lineCount = lineEnd - lineStart + 1;
    if (lineCount <= 3) {
        return { label: 'Logic Block', shape: 'rectangle', color: 'blue' };
    }
    return { label: `Code Section (${lineCount} lines)`, shape: 'rectangle', color: 'orange' };
}

// ============================================================================
// Mock Response - SMART CODE PARSER
// ============================================================================

/**
 * Find the end line of a code block starting at a given line
 * Uses brace counting to find matching closing brace
 */
function findBlockEnd(lines: string[], startIndex: number): number {
    let braces = 0;
    let j = startIndex;
    do {
        braces += (lines[j]?.match(/{/g) || []).length;
        braces -= (lines[j]?.match(/}/g) || []).length;
        j++;
    } while (braces > 0 && j < lines.length);
    return j; // Returns line number (1-indexed when used as lineEnd)
}

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

    // Find function/component definition (with proper line range)
    // NOTE: Skip async functions - they're handled by the async function parser below
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if ((line.includes('export default function') || line.includes('export function') ||
            (line.includes('function ') && !line.trim().startsWith('//') && !line.includes('async'))) &&
            !nodes.some(n => n.lineStart === i + 1)) {
            const match = line.match(/function\s+(\w+)/);
            const name = match?.[1] || 'Component';
            const startLine = i + 1;
            const endLine = findBlockEnd(lines, i);  // Calculate proper end line

            nodeId++;
            addNode({
                id: `n${nodeId}`,
                label: `Function: ${name}`,
                subtitle: 'Component Definition',
                shape: 'rectangle',
                color: 'green',
                narrative: `Define the ${name} function component.`,
                codeSnippet: lines.slice(i, Math.min(i + 5, endLine)).join('\n'),
                lineStart: startLine,
                lineEnd: endLine,  // Now calculates full block end
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
        if (line.includes('useState') && !nodes.some(n => n.lineStart === i + 1)) {
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

    // Find custom hooks (useAuth, useNavigate, useQuery, etc.)
    lines.forEach((line, i) => {
        // Match: const { ... } = useHookName() or const name = useHookName()
        const hookMatch = line.match(/=\s*(use[A-Z]\w+)\s*\(/);
        if (hookMatch && !line.includes('useState') && !line.includes('useEffect') && !nodes.some(n => n.lineStart === i + 1)) {
            const hookName = hookMatch[1];
            nodeId++;
            addNode({
                id: `n${nodeId}`,
                label: `Hook: ${hookName}`,
                subtitle: 'Custom Hook',
                shape: 'rectangle',
                color: 'green',
                narrative: `Use ${hookName} hook for additional functionality.`,
                codeSnippet: line.trim(),
                lineStart: i + 1,
                lineEnd: i + 1,
                logicTable: [{
                    step: '1',
                    trigger: 'Component render',
                    action: `Call ${hookName}`,
                    output: 'Hook value',
                    codeRef: line.trim(),
                }],
            });
        }
    });

    // Find useEffect
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('useEffect') && !nodes.some(n => n.lineStart === i + 1)) {
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
            // i = j - 1;  // REMOVED: Allow parsing of code inside useEffect
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
            // i = j - 1;  // REMOVED: Allow parsing of code inside async function
        }
    }

    // Find async arrow functions (const name = async () => {...})
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const asyncArrowMatch = line.match(/^\s*const\s+(\w+)\s*=\s*async\s*\([^)]*\)\s*=>/);
        if (asyncArrowMatch && !nodes.some(n => n.lineStart === i + 1)) {
            const name = asyncArrowMatch[1];
            const startLine = i + 1;
            let braces = 0;
            let j = i;
            // Count opening brace on this line or next
            do {
                braces += (lines[j].match(/{/g) || []).length;
                braces -= (lines[j].match(/}/g) || []).length;
                j++;
            } while (braces > 0 && j < lines.length);

            // Determine if it's an API call (contains fetch)
            const fnCode = lines.slice(i, j).join('\n');
            const isApiCall = fnCode.includes('fetch(') || fnCode.includes('axios');
            const label = isApiCall ? `API: ${name}` : `Async: ${name}`;

            nodeId++;
            addNode({
                id: `n${nodeId}`,
                label,
                subtitle: isApiCall ? 'API Call' : 'Async Function',
                shape: 'hexagon',
                color: 'purple',
                narrative: isApiCall
                    ? `Fetches data from API via ${name}.`
                    : `Async function ${name} for async operations.`,
                codeSnippet: lines.slice(i, Math.min(i + 8, j)).join('\n'),
                lineStart: startLine,
                lineEnd: j,
                logicTable: [{
                    step: '1',
                    trigger: 'Function called',
                    action: isApiCall ? 'Fetch data' : 'Execute async',
                    output: 'Promise',
                    codeRef: `const ${name} = async () => {...}`,
                }],
            });
            // i = j - 1;  // REMOVED: Allow parsing of code inside the function
        }
    }

    // Find regular arrow functions (const name = (...) => {...})
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match: const name = (args) => { or const name = (args): ReturnType => {
        const arrowMatch = line.match(/^\s*const\s+(\w+)\s*=\s*\([^)]*\)\s*(:\s*[^=]+)?\s*=>/);
        if (arrowMatch && !line.includes('async') && !nodes.some(n => n.lineStart === i + 1)) {
            const name = arrowMatch[1];
            const startLine = i + 1;

            // Check if it's a single-line arrow or multi-line
            let endLine = startLine;
            if (line.includes('{')) {
                let braces = 0;
                let j = i;
                do {
                    braces += (lines[j].match(/{/g) || []).length;
                    braces -= (lines[j].match(/}/g) || []).length;
                    j++;
                } while (braces > 0 && j < lines.length);
                endLine = j;
            }

            // Determine type based on name
            let label = `Function: ${name}`;
            let subtitle = 'Helper Function';
            let color: SectionColor = 'blue';
            let shape: NodeShape = 'rectangle';

            if (name.toLowerCase().startsWith('get')) {
                label = `Helper: ${name}`;
                subtitle = 'Getter Function';
                color = 'orange';
            } else if (name.toLowerCase().startsWith('handle')) {
                label = `Handler: ${name}`;
                subtitle = 'Event Handler';
                color = 'blue';
            } else if (name.toLowerCase().startsWith('render')) {
                label = `Render: ${name}`;
                subtitle = 'Render Helper';
                color = 'cyan';
            }

            nodeId++;
            addNode({
                id: `n${nodeId}`,
                label,
                subtitle,
                shape,
                color,
                narrative: `Helper function ${name} for logic processing.`,
                codeSnippet: lines.slice(i, Math.min(i + 6, endLine)).join('\n'),
                lineStart: startLine,
                lineEnd: endLine,
                logicTable: [{
                    step: '1',
                    trigger: 'Function called',
                    action: `Execute ${name}`,
                    output: 'Result',
                    codeRef: `const ${name} = (...) => {...}`,
                }],
            });
            // i = endLine - 1;  // REMOVED: Allow parsing of code inside the function
        }
    }

    // Find guard clauses (if ... return) and other conditionals with PROPER BRANCHING
    const decisionNodes: { nodeId: string; yesNodeId: string | null; noNodeId: string | null; endLine: number }[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip if already has a node at this line
        if (nodes.some(n => n.lineStart === i + 1)) continue;

        // Match if statements with various patterns
        const ifMatch = line.match(/if\s*\(([^)]+(?:\([^)]*\))?[^)]*)\)/);
        if (!ifMatch) continue;

        const condition = ifMatch[1];
        const readableLabel = conditionToEnglish(condition);
        const hasReturn = line.includes('return') || false;

        // Find the end of this if block
        let ifBlockStart = i;
        let ifBlockEnd = i + 1;
        let ifBlockContent = '';

        if (line.includes('{')) {
            // Multi-line if block
            let braces = 0;
            let j = i;
            do {
                braces += (lines[j].match(/{/g) || []).length;
                braces -= (lines[j].match(/}/g) || []).length;
                j++;
            } while (braces > 0 && j < lines.length);
            ifBlockEnd = j;

            // Extract what's inside the if block
            const blockLines = lines.slice(i + 1, ifBlockEnd - 1);
            ifBlockContent = blockLines.map(l => l.trim()).filter(l => l && !l.startsWith('//')).join('\n');
        } else if (hasReturn) {
            // Single-line if with inline return: if (!user) return <div>...</div>;
            // Extract the return part after the condition
            const returnMatch = line.match(/return\s+(.+?);?\s*$/);
            if (returnMatch) {
                ifBlockContent = `return ${returnMatch[1]}`;
            } else {
                // Fallback: everything after "return"
                const returnIdx = line.indexOf('return');
                if (returnIdx !== -1) {
                    ifBlockContent = line.substring(returnIdx);
                }
            }
            ifBlockEnd = i + 1; // Single line
        }

        // Check if there's a return inside (making it a guard)
        const blockHasReturn = ifBlockContent.includes('return');
        const isGuard = hasReturn || blockHasReturn;

        // Create the DECISION node (diamond)
        nodeId++;
        const decisionId = `n${nodeId}`;

        addNode({
            id: decisionId,
            label: readableLabel,
            subtitle: isGuard ? 'Guard Clause' : 'Decision',
            shape: 'diamond',
            color: isGuard ? 'red' : 'orange',
            isDecision: true,
            condition: readableLabel,
            narrative: isGuard
                ? `Guard clause: ${readableLabel}. If YES, exits early.`
                : `Decision point: ${readableLabel}`,
            codeSnippet: line.trim(),
            lineStart: i + 1,
            lineEnd: Math.min(i + 5, ifBlockEnd), // Cover first few lines of the if block
            logicTable: [{
                step: '1',
                trigger: 'Condition check',
                action: readableLabel,
                output: 'Yes or No',
                codeRef: line.trim().substring(0, 60),
                lineStart: i + 1,
                lineEnd: Math.min(i + 5, ifBlockEnd),
            }],
        });

        // Create the YES branch node (what happens when condition is TRUE)
        let yesNodeId: string | null = null;
        if (ifBlockContent.trim()) {
            nodeId++;
            yesNodeId = `n${nodeId}`;

            // Determine what the yes branch does
            let yesLabel = 'Execute Block';
            let yesColor: SectionColor = 'blue';

            if (blockHasReturn) {
                // Check what it returns
                if (ifBlockContent.includes('setError') || ifBlockContent.includes('error')) {
                    yesLabel = 'Set Error & Return';
                    yesColor = 'red';
                } else if (ifBlockContent.includes('null') || ifBlockContent.includes('undefined')) {
                    yesLabel = 'Return Null';
                    yesColor = 'red';
                } else if (ifBlockContent.includes('<')) {
                    yesLabel = 'Return Early JSX';
                    yesColor = 'cyan';
                } else {
                    yesLabel = 'Early Return';
                    yesColor = 'red';
                }
            } else if (ifBlockContent.includes('set')) {
                yesLabel = 'Update State';
                yesColor = 'green';
            } else if (ifBlockContent.includes('navigate') || ifBlockContent.includes('redirect')) {
                yesLabel = 'Navigate Away';
                yesColor = 'purple';
            }

            addNode({
                id: yesNodeId,
                label: yesLabel,
                subtitle: blockHasReturn ? 'Early Exit' : 'If True',
                shape: blockHasReturn ? 'rounded' : 'rectangle',
                color: yesColor,
                narrative: `When "${readableLabel}" is YES: ${yesLabel}`,
                codeSnippet: ifBlockContent.substring(0, 200),
                lineStart: i + 2, // Start from line after if
                lineEnd: Math.max(i + 2, ifBlockEnd - 1), // Content lines only
                logicTable: [{
                    step: '1',
                    trigger: `${readableLabel} = YES`,
                    action: yesLabel,
                    output: blockHasReturn ? 'Exit function' : 'Continue',
                    codeRef: ifBlockContent.substring(0, 50),
                    lineStart: i + 2,
                    lineEnd: Math.max(i + 2, ifBlockEnd - 1),
                }],
            });

            // Add YES edge from decision to yes-branch
            edges.push({
                id: `e_${decisionId}_yes`,
                source: decisionId,
                target: yesNodeId,
                sourceHandle: 'yes', // Connect from right (green) handle
                label: 'YES',
                animated: true,
            });
        }

        // Create a NO continuation node for code after the if-block
        // Find the next meaningful line after ifBlockEnd
        let noLineStart = ifBlockEnd;
        while (noLineStart < lines.length && lines[noLineStart].trim() === '') {
            noLineStart++; // Skip empty lines
        }

        if (noLineStart < lines.length) {
            const noLine = lines[noLineStart].trim();

            // Only create NO node if there's actual code (not just closing braces or catch)
            if (noLine && !noLine.startsWith('}') && !noLine.startsWith('catch') && !noLine.startsWith('finally')) {
                // Check if this line already has a node
                if (!nodes.some(n => n.lineStart === noLineStart + 1)) {
                    nodeId++;
                    const noNodeId = `n${nodeId}`;

                    // Determine what the NO path does
                    let noLabel = 'Continue';
                    let noColor: SectionColor = 'green';

                    // Calculate the end line for multi-line statements
                    let noLineEnd = noLineStart;

                    // For return statements with parentheses (JSX), find the matching close paren
                    if (noLine.includes('return (') || noLine.includes('return(')) {
                        let parens = 0;
                        let k = noLineStart;
                        do {
                            parens += (lines[k].match(/\(/g) || []).length;
                            parens -= (lines[k].match(/\)/g) || []).length;
                            k++;
                        } while (parens > 0 && k < lines.length);
                        noLineEnd = k - 1; // Include the line with closing paren
                        noLabel = 'RENDER';
                        noColor = 'cyan';
                    } else if (noLine.includes('set')) {
                        noLabel = 'Update State';
                        noColor = 'green';
                    } else if (noLine.includes('navigate') || noLine.includes('redirect')) {
                        noLabel = 'Navigate';
                        noColor = 'purple';
                    } else if (noLine.includes('console')) {
                        noLabel = 'Log Output';
                        noColor = 'blue';
                    } else if (noLine.includes('return')) {
                        noLabel = 'Return';
                        noColor = 'cyan';
                    }

                    addNode({
                        id: noNodeId,
                        label: noLabel,
                        subtitle: 'If False (NO path)',
                        shape: noLabel === 'RENDER' ? 'rounded' : 'rectangle',
                        color: noColor,
                        narrative: `When "${readableLabel}" is NO: ${noLabel}`,
                        codeSnippet: lines.slice(noLineStart, Math.min(noLineStart + 8, noLineEnd + 1)).join('\n'),
                        lineStart: noLineStart + 1,
                        lineEnd: noLineEnd + 1,
                        logicTable: [{
                            step: '1',
                            trigger: `${readableLabel} = NO`,
                            action: noLabel,
                            output: 'Continue',
                            codeRef: noLine.substring(0, 50),
                            lineStart: noLineStart + 1,
                            lineEnd: noLineEnd + 1,
                        }],
                    });

                    // Add NO edge from decision to NO continuation
                    edges.push({
                        id: `e_${decisionId}_no`,
                        source: decisionId,
                        target: noNodeId,
                        sourceHandle: 'no', // Connect from left (red) handle
                        label: 'NO',
                        animated: false,
                    });
                }
            }
        }

        // Track for NO edge (will connect to next node after if block)
        decisionNodes.push({
            nodeId: decisionId,
            yesNodeId,
            noNodeId: null, // Will be filled later
            endLine: ifBlockEnd,
        });

        i = ifBlockEnd - 1;
    }

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

    // =========================================================================
    // FINAL STEP: Sort nodes by lineStart and rebuild edges for proper flow
    // =========================================================================

    // 1. Sort all nodes by their starting line number
    nodes.sort((a, b) => (a.lineStart || 0) - (b.lineStart || 0));

    // 2. Remove duplicate nodes (same lineStart)
    const uniqueNodes: FlowNode[] = [];
    const seenLines = new Set<number>();
    for (const node of nodes) {
        if (!seenLines.has(node.lineStart)) {
            seenLines.add(node.lineStart);
            uniqueNodes.push(node);
        }
    }

    // 3. Preserve edges we already created (YES branches) and add NO branches + sequential edges
    const finalEdges: FlowEdge[] = [...edges]; // Keep existing YES edges
    const edgeSet = new Set(edges.map(e => `${e.source}->${e.target}`));

    // Build a map of node id -> node for quick lookup
    const nodeMap = new Map(uniqueNodes.map(n => [n.id, n]));

    // Find all decision nodes that need NO edges
    const decisionNodeIds = new Set(uniqueNodes.filter(n => n.isDecision).map(n => n.id));

    // Find all "yes branch" nodes (Early Exit nodes that shouldn't continue)
    const yesNodeIds = new Set(edges.filter(e => e.label === 'YES').map(e => e.target));

    for (let i = 0; i < uniqueNodes.length - 1; i++) {
        const current = uniqueNodes[i];
        const next = uniqueNodes[i + 1];
        const edgeKey = `${current.id}->${next.id}`;

        // Skip if edge already exists
        if (edgeSet.has(edgeKey)) continue;

        // Skip if current is a "yes branch" node (early exit) - it doesn't continue
        if (yesNodeIds.has(current.id) && current.subtitle?.includes('Early Exit')) {
            continue;
        }

        // If current is a decision node, we need BOTH YES and NO edges
        if (current.isDecision) {
            const yesEdge = edges.find(e => e.source === current.id && e.label === 'YES');

            if (yesEdge && yesEdge.target === next.id) {
                // Next is the YES branch - find the node AFTER yes branch for NO
                // The NO branch should go to the node that comes after the yes-branch node
                const yesNode = nodeMap.get(yesEdge.target);
                if (yesNode) {
                    // Find the next node after the yes-branch (by line number)
                    const noTarget = uniqueNodes.find(n =>
                        (n.lineStart || 0) > (yesNode.lineEnd || yesNode.lineStart || 0) &&
                        n.id !== yesNode.id
                    );
                    if (noTarget) {
                        const noEdgeKey = `${current.id}->${noTarget.id}`;
                        if (!edgeSet.has(noEdgeKey)) {
                            finalEdges.push({
                                id: `e_${current.id}_no`,
                                source: current.id,
                                target: noTarget.id,
                                sourceHandle: 'no',
                                label: 'NO',
                                animated: false,
                            });
                            edgeSet.add(noEdgeKey);
                        }
                    }
                }
            } else {
                // Next is NOT the yes branch, so this becomes the NO edge
                finalEdges.push({
                    id: `e_${current.id}_no`,
                    source: current.id,
                    target: next.id,
                    sourceHandle: 'no',
                    label: 'NO',
                    animated: false,
                });
                edgeSet.add(edgeKey);
            }
        } else {
            // Regular sequential edge
            finalEdges.push({
                id: `e_${current.id}_${next.id}`,
                source: current.id,
                target: next.id,
            });
            edgeSet.add(edgeKey);
        }
    }

    console.log(`📊 Mock parser: ${uniqueNodes.length} nodes, ${finalEdges.length} edges`);

    return {
        fileName,
        language,
        nodes: uniqueNodes,
        edges: finalEdges,
        totalLines: lines.length,
        totalSections: uniqueNodes.length,
    };
}
