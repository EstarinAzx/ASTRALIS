// ============================================================================
// Pattern-Based Code Parser
// ============================================================================

import type { FlowNode, FlowEdge, AnalysisResult, PatternMatch, SectionColor } from './types.js';
import { codePatterns } from './patterns.js';
import { isEmptyOrComment } from './helpers.js';

/**
 * Parse code using pattern matching
 * Returns a complete AnalysisResult with nodes and edges
 */
export function parseCode(code: string, fileName: string, language: string): AnalysisResult {
    const lines = code.split('\n');
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    const matchedLines = new Set<number>(); // Track which lines are already matched
    let nodeId = 0;

    // Helper to add a node
    function addNode(
        match: PatternMatch,
        patternName: string
    ): string {
        nodeId++;
        const id = `n${nodeId}`;

        nodes.push({
            id,
            label: match.label,
            subtitle: match.subtitle,
            shape: match.shape,
            color: match.color,
            lineStart: match.lineStart,
            lineEnd: match.lineEnd,
            codeSnippet: match.codeSnippet,
            isDecision: match.isDecision,
            condition: match.condition,
            narrative: generateNarrative(match, patternName),
            logicTable: [{
                step: '1',
                trigger: match.isDecision ? 'Condition check' : 'Execution',
                action: match.label,
                output: match.isDecision ? 'Yes or No' : 'Continue',
                codeRef: match.codeSnippet?.substring(0, 50),
                lineStart: match.lineStart,
                lineEnd: match.lineEnd,
            }],
        });

        // Mark lines as matched
        for (let i = match.lineStart; i <= match.lineEnd; i++) {
            matchedLines.add(i);
        }

        return id;
    }

    // Helper to add an edge
    function addEdge(
        source: string,
        target: string,
        label?: string,
        sourceHandle?: string
    ): void {
        edges.push({
            id: `e${edges.length + 1}`,
            source,
            target,
            label,
            sourceHandle,
            animated: label === 'YES' || label === 'NO',
        });
    }

    // Generate narrative for a node
    function generateNarrative(match: PatternMatch, patternName: string): string {
        if (match.isDecision) {
            return `Guard clause: ${match.label}. If YES, take action.`;
        }
        switch (patternName) {
            case 'imports':
                return 'Import required modules and dependencies.';
            case 'expressRoute':
                return `Handle ${match.label} HTTP request.`;
            case 'prisma':
                return `Execute ${match.label} database operation.`;
            case 'useState':
                return `Initialize ${match.label.replace('useState: ', '')} state variable.`;
            case 'useEffect':
                return 'Execute side effects when dependencies change.';
            case 'returnJsx':
                return 'Render the component output.';
            default:
                return `Execute ${match.label}.`;
        }
    }

    // ========================================================================
    // Phase 1: Match all patterns
    // ========================================================================
    const matches: { index: number; patternName: string; match: PatternMatch }[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        // Skip empty lines and comments
        if (isEmptyOrComment(line)) continue;

        // Try each pattern (already sorted by priority)
        for (const pattern of codePatterns) {
            if (pattern.match(line, i, lines)) {
                const match = pattern.extract(line, i, lines);
                if (match) {
                    matches.push({ index: i, patternName: pattern.name, match });
                    break; // First match wins (patterns are priority-sorted)
                }
            }
        }
    }

    // ========================================================================
    // Phase 2: Deduplicate overlapping matches (prefer earlier/higher priority)
    // ========================================================================
    const finalMatches: typeof matches = [];

    for (const m of matches) {
        // Check if this match's start line is already covered by a previous match
        const alreadyCovered = finalMatches.some(prev => {
            const prevStart = prev.match.lineStart;
            const prevEnd = prev.match.lineEnd;
            return m.match.lineStart >= prevStart && m.match.lineStart <= prevEnd;
        });

        if (!alreadyCovered) {
            finalMatches.push(m);
        }
    }

    // ========================================================================
    // Phase 3: Create nodes and edges
    // ========================================================================
    let previousNodeId: string | null = null;
    const nodeIdMap = new Map<number, string>(); // lineStart -> nodeId

    for (const { patternName, match } of finalMatches) {
        const nodeId = addNode(match, patternName);
        nodeIdMap.set(match.lineStart, nodeId);

        // Handle branching for decision nodes
        if (match.isDecision && match.branches) {
            // YES branch
            if (match.branches.yes) {
                const yesMatch: PatternMatch = {
                    label: match.branches.yes.label,
                    subtitle: 'Early Exit',
                    shape: 'rounded',
                    color: determineColor(match.branches.yes.label),
                    lineStart: match.branches.yes.lineStart,
                    lineEnd: match.branches.yes.lineEnd,
                    codeSnippet: match.branches.yes.content,
                };
                const yesNodeId = addNode(yesMatch, 'yesBranch');
                addEdge(nodeId, yesNodeId, 'YES', 'yes');
            }

            // Connect previous to decision
            if (previousNodeId) {
                addEdge(previousNodeId, nodeId);
            }

            previousNodeId = nodeId;
        } else {
            // Non-decision node: simple sequential edge
            if (previousNodeId) {
                // Check if previous was a decision - if so, this is the NO path
                const prevNode = nodes.find(n => n.id === previousNodeId);
                if (prevNode?.isDecision) {
                    addEdge(previousNodeId, nodeId, 'NO', 'no');
                } else {
                    addEdge(previousNodeId, nodeId);
                }
            }
            previousNodeId = nodeId;
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

/**
 * Determine color based on label content
 */
function determineColor(label: string): SectionColor {
    const lower = label.toLowerCase();
    if (lower.includes('error') || lower.includes('null') || lower.includes('return')) return 'red';
    if (lower.includes('jsx') || lower.includes('render')) return 'cyan';
    if (lower.includes('state') || lower.includes('update')) return 'green';
    if (lower.includes('navigate') || lower.includes('async')) return 'purple';
    return 'blue';
}
