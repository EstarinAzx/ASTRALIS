// ============================================================================
// LLM Service - Main Entry Point
// ============================================================================

import type { VerbosityMode, AnalysisResult } from './types.js';
import { parseCode } from './parser.js';
import { verifyFlowWithLLM } from './verifier.js';
import { buildSystemPrompt } from './prompts.js';

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
 * Main LLM call function - generates flowchart from code
 */
export async function callLLM(
    code: string,
    fileName: string,
    language: string,
    mode: VerbosityMode = 'standard'
): Promise<AnalysisResult> {
    console.log(`🚀 ASTRALIS: Processing ${fileName} (${language}, mode: ${mode})`);
    console.log(`📝 Code length: ${code.length} chars, ${code.split('\n').length} lines`);

    const apiKey = process.env.LLM_API_KEY;
    const apiUrl = process.env.LLM_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const model = process.env.LLM_MODEL || 'meta-llama/llama-3.2-3b-instruct:free';

    // Try LLM first if API key is available
    if (apiKey) {
        try {
            console.log('🤖 Calling LLM...');

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: buildSystemPrompt(mode) },
                        { role: 'user', content: `Analyze this ${language} code from file "${fileName}":\n\n\`\`\`${language}\n${code}\n\`\`\`` },
                    ],
                    temperature: 0.3,
                    max_tokens: 8000,
                }),
            });

            if (response.ok) {
                const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
                let content = data.choices?.[0]?.message?.content?.trim();

                if (content) {
                    // Extract JSON
                    if (content.includes('```json')) {
                        content = content.replace(/```json\s*/g, '').replace(/```/g, '').trim();
                    } else if (content.includes('{')) {
                        const jsonStart = content.indexOf('{');
                        const jsonEnd = content.lastIndexOf('}');
                        if (jsonStart !== -1 && jsonEnd !== -1) {
                            content = content.substring(jsonStart, jsonEnd + 1);
                        }
                    }

                    const parsed = JSON.parse(content) as AnalysisResult;

                    if (parsed.nodes && parsed.nodes.length > 0) {
                        console.log(`✅ LLM returned ${parsed.nodes.length} nodes`);

                        // Run verifier
                        const verified = await verifyFlowWithLLM(parsed, code, fileName, language);
                        return verified;
                    }
                }
            }
        } catch (error) {
            console.error('❌ LLM error, falling back to parser:', error);
        }
    }

    // Fallback to pattern-based parser
    console.log('📊 Using pattern-based parser...');
    const result = parseCode(code, fileName, language);
    console.log(`✅ Parser generated ${result.nodes.length} nodes, ${result.edges.length} edges`);

    return result;
}
