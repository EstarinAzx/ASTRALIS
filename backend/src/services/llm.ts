// ============================================================================
// ASTRALIS LLM Service
// ============================================================================
// Handles communication with the LLM API and response validation

import type { AstralisResponse, VerbosityMode } from '../types/astralis.js';
import { AppError } from '../middleware/errorHandler.js';

// ============================================================================
// System Prompt for ASTRALIS Generation
// ============================================================================
const getSystemPrompt = (mode: VerbosityMode): string => {
    const basePrompt = `You are ASTRALIS (Abstract Syntax Tree Rendering And Logic Interpretation System).
Your job is to analyze code and produce a multi-layered "Code Mind Map" in structured JSON.

You MUST return ONLY valid JSON matching this exact structure:
{
  "layer0_imports": [{ "name": string, "source": string, "type": string, "purpose": string }],
  "layer1_summary": { "what": string, "why": string, "complexity": number },
  "layer2_journey": [string array of plain English execution steps],
  "layer3_mermaid": { "chartType": string, "definition": string },
  "layer4_logic": {
    "sections": [{
      "title": string (e.g., "🟩 SECTION 1 — INITIAL STATE"),
      "rows": [{
        "line": string (e.g., "10-15"),
        "step": string,
        "trigger": string,
        "action": string,
        "result": string
      }]
    }]
  },
  "layer5_codemap": [{
    "lineStart": number,
    "lineEnd": number,
    "snippet": string,
    "note": string
  }]
}

CRITICAL RULES:
1. Every line of code must be accounted for in Layer 4 and Layer 5.
2. Use emojis in Layer 4 section titles (🟦 for imports, 🟩 for main sections).
3. The Mermaid diagram in Layer 3 must be valid Mermaid.js syntax.
4. Maintain terminology consistency across all layers (Golden Thread).
5. Return ONLY the JSON object, no markdown code blocks.`;

    if (mode === 'concise') {
        return basePrompt + `\n\nMODE: CONCISE - Focus on Layers 1, 3, and 4 only. Keep Layer 0, 2, and 5 minimal.`;
    } else if (mode === 'deep_dive') {
        return basePrompt + `\n\nMODE: DEEP DIVE - Include edge cases, potential bugs, and detailed explanations in every layer.`;
    }
    return basePrompt + `\n\nMODE: STANDARD - Provide comprehensive but not excessive detail in all layers.`;
};

// ============================================================================
// LLM API Call
// ============================================================================
export async function callLLM(
    code: string,
    fileName: string,
    language: string,
    mode: VerbosityMode
): Promise<AstralisResponse> {
    const apiKey = process.env.LLM_API_KEY;
    const apiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
    const model = process.env.LLM_MODEL || 'gpt-4o';

    if (!apiKey) {
        // Return mock data if no API key configured
        console.warn('⚠️  No LLM_API_KEY configured - returning mock data');
        return getMockResponse(fileName, language);
    }

    const systemPrompt = getSystemPrompt(mode);
    const userPrompt = `Analyze this ${language} file named "${fileName}":\n\n${code}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.3,
                max_tokens: 4096,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new AppError(502, `LLM API error: ${error}`);
        }

        const data = await response.json() as {
            choices: { message: { content: string } }[];
        };

        const content = data.choices[0]?.message?.content;
        if (!content) {
            throw new AppError(502, 'Empty response from LLM');
        }

        // Parse and validate JSON
        const parsed = JSON.parse(content) as AstralisResponse;
        return validateAstralisResponse(parsed);
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new AppError(502, 'LLM returned invalid JSON');
        }
        throw error;
    }
}

// ============================================================================
// Response Validation
// ============================================================================
function validateAstralisResponse(response: unknown): AstralisResponse {
    const r = response as AstralisResponse;

    // Basic structure validation
    if (!r.layer0_imports || !Array.isArray(r.layer0_imports)) {
        throw new AppError(502, 'Invalid layer0_imports');
    }
    if (!r.layer1_summary || typeof r.layer1_summary.what !== 'string') {
        throw new AppError(502, 'Invalid layer1_summary');
    }
    if (!r.layer2_journey || !Array.isArray(r.layer2_journey)) {
        throw new AppError(502, 'Invalid layer2_journey');
    }
    if (!r.layer3_mermaid || typeof r.layer3_mermaid.definition !== 'string') {
        throw new AppError(502, 'Invalid layer3_mermaid');
    }
    if (!r.layer4_logic?.sections || !Array.isArray(r.layer4_logic.sections)) {
        throw new AppError(502, 'Invalid layer4_logic');
    }
    if (!r.layer5_codemap || !Array.isArray(r.layer5_codemap)) {
        throw new AppError(502, 'Invalid layer5_codemap');
    }

    return r;
}

// ============================================================================
// Mock Response (for development without API key)
// ============================================================================
function getMockResponse(fileName: string, language: string): AstralisResponse {
    return {
        layer0_imports: [
            { name: 'React', source: 'react', type: 'Library', purpose: 'Core React library' },
            { name: 'useState', source: 'react', type: 'Hook', purpose: 'State management hook' },
        ],
        layer1_summary: {
            what: `This ${language} file "${fileName}" is a placeholder component.`,
            why: 'Used for demonstration purposes in the ASTRALIS system.',
            complexity: 3,
        },
        layer2_journey: [
            'Step 1: Import necessary dependencies',
            'Step 2: Define the main component',
            'Step 3: Set up initial state',
            'Step 4: Render the UI',
        ],
        layer3_mermaid: {
            chartType: 'flowchart',
            definition: `flowchart TD
    A[Start] --> B[Import Dependencies]
    B --> C[Define Component]
    C --> D[Initialize State]
    D --> E[Render UI]
    E --> F[End]`,
        },
        layer4_logic: {
            sections: [
                {
                    title: '🟦 LAYER 0 — IMPORTS (Setup Phase)',
                    rows: [
                        { line: '1-2', step: 'Import', trigger: 'Module load', action: 'Import React', result: 'React available' },
                    ],
                },
                {
                    title: '🟩 SECTION 1 — COMPONENT DEFINITION',
                    rows: [
                        { line: '4-10', step: 'Define', trigger: 'Export', action: 'Create component', result: 'Component ready' },
                    ],
                },
            ],
        },
        layer5_codemap: [
            { lineStart: 1, lineEnd: 2, snippet: "import React from 'react';", note: 'Core React import' },
            { lineStart: 4, lineEnd: 10, snippet: 'export function Component() { ... }', note: 'Main component body' },
        ],
    };
}
