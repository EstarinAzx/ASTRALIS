// ============================================================================
// LLM Verifier Agent
// ============================================================================

import type { AnalysisResult } from './types.js';
import { buildVerifierPrompt } from './prompts.js';

/**
 * Verify the flowchart accuracy using an LLM
 */
export async function verifyFlowWithLLM(
    currentResult: AnalysisResult,
    code: string,
    _fileName: string,
    _language: string
): Promise<AnalysisResult> {
    const apiKey = process.env.LLM_API_KEY;
    const apiUrl = process.env.LLM_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const model = process.env.LLM_MODEL || 'meta-llama/llama-3.2-3b-instruct:free';

    // Skip verification if no API key
    if (!apiKey) {
        console.log('⚠️ Skipping verifier (no API key)');
        return currentResult;
    }

    try {
        console.log('🕵️ Running Verifier Agent...');

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: buildVerifierPrompt() },
                    {
                        role: 'user',
                        content: `SOURCE CODE:\n\`\`\`\n${code}\n\`\`\`\n\nCURRENT FLOWCHART:\n${JSON.stringify(currentResult, null, 2)}`,
                    },
                ],
                temperature: 0.1,
                max_tokens: 4000,
            }),
        });

        if (!response.ok) {
            throw new Error(`Verifier API error: ${response.status}`);
        }

        const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        let content = data.choices?.[0]?.message?.content?.trim();

        if (!content) {
            console.log('⚠️ Verifier returned empty, keeping original');
            return currentResult;
        }

        // Extract JSON from response
        if (content.includes('```json')) {
            content = content.replace(/```json\s*/g, '').replace(/```/g, '').trim();
        } else if (content.includes('{')) {
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
        console.error('❌ Verifier error:', error);
        return currentResult; // Fallback to original
    }
}
