// ============================================================================
// LLM Service - Main Entry Point
// Parser-First Architecture: Pattern parser generates → LLM enhances
// ============================================================================

import type { VerbosityMode, AnalysisResult } from './types.js';
import { parseCode } from './parser.js';

// Re-export types
export type {
    VerbosityMode,
    AnalysisResult,
    FlowNode,
    FlowEdge,
    NodeShape,
    SectionColor
} from './types.js';

/**
 * Build the enhancement prompt for LLM review
 */
function buildEnhancerPrompt(): string {
    return `You are a CODE FLOWCHART ENHANCER. You receive a flowchart JSON and improve the labels.

YOUR ONLY JOB:
1. IMPROVE node labels to be more human-readable (e.g., "Function: handleSubmit" → "Handle Form Submission")
2. KEEP all lineStart and lineEnd values EXACTLY as they are
3. KEEP the same number of nodes and edges

CRITICAL RULES:
- Return ONLY valid JSON, no text before or after
- Do NOT add or remove nodes
- Do NOT change line numbers
- Keep the exact same JSON structure

Return the improved JSON now:`;
}

/**
 * Main LLM call function - generates flowchart from code
     * Uses Parser-First architecture: Pattern parser generates, LLM enhances
     */
export async function callLLM(
    code: string,
    fileName: string,
    language: string,
    mode: VerbosityMode = 'standard'
): Promise<AnalysisResult> {
    console.log(`🚀 ASTRALIS: Processing ${fileName} (${language}, mode: ${mode})`);
    console.log(`📝 Code length: ${code.length} chars, ${code.split('\n').length} lines`);

    // Step 1: Parser generates baseline (always runs first)
    console.log('📊 Step 1: Pattern parser generating baseline...');
    const parserResult = parseCode(code, fileName, language);
    console.log(`✅ Parser generated ${parserResult.nodes.length} nodes, ${parserResult.edges.length} edges`);

    // Step 2: LLM enhances (if API key available)
    const apiKey = process.env.LLM_API_KEY;
    const apiUrl = process.env.LLM_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const model = process.env.LLM_MODEL || 'nvidia/nemotron-3-nano-30b-a3b:free';

    if (!apiKey) {
        console.log('⚠️ No LLM API key, returning parser result as-is');
        return parserResult;
    }

    try {
        console.log('🤖 Step 2: LLM enhancing flowchart...');

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3001',
                'X-Title': 'ASTRALIS Flowchart Visualizer',
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: buildEnhancerPrompt() },
                    {
                        role: 'user',
                        content: `SOURCE CODE (${language}):\n\`\`\`${language}\n${code}\n\`\`\`\n\nPARSER-GENERATED FLOWCHART:\n${JSON.stringify(parserResult, null, 2)}\n\nPlease enhance this flowchart with better labels and fix any issues.`
                    },
                ],
                temperature: 0.2, // Low temp for consistency
                max_tokens: 8000,
            }),
        });

        if (!response.ok) {
            console.error(`❌ LLM API error: ${response.status} ${response.statusText}`);
            return parserResult; // Fallback to parser result
        }

        const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        let content = data.choices?.[0]?.message?.content?.trim();

        if (!content) {
            console.log('⚠️ LLM returned empty, keeping parser result');
            return parserResult;
        }

        // Extract JSON from response
        if (content.includes('```json')) {
            content = content.replace(/```json\s*/g, '').replace(/```/g, '').trim();
        } else if (content.includes('```')) {
            content = content.replace(/```\s*/g, '').trim();
        }

        if (content.includes('{')) {
            const jsonStart = content.indexOf('{');
            const jsonEnd = content.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                content = content.substring(jsonStart, jsonEnd + 1);
            }
        }

        const enhanced = JSON.parse(content) as AnalysisResult;

        // Validate the enhanced result
        if (!enhanced.nodes || enhanced.nodes.length === 0) {
            console.log('⚠️ LLM returned invalid result, keeping parser result');
            return parserResult;
        }

        console.log(`✅ LLM enhanced: ${parserResult.nodes.length} → ${enhanced.nodes.length} nodes`);

        // Preserve parser's accurate line numbers if LLM messed them up
        enhanced.nodes.forEach((node, i) => {
            const parserNode = parserResult.nodes[i];
            if (parserNode && (!node.lineStart || !node.lineEnd)) {
                node.lineStart = parserNode.lineStart;
                node.lineEnd = parserNode.lineEnd;
            }
        });

        return enhanced;

    } catch (error) {
        console.error('❌ LLM enhancement error:', error);
        return parserResult; // Fallback to parser result
    }
}
