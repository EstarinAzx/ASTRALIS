// ============================================================================
// Pattern-Based Code Parser
// ============================================================================

import type { FlowNode, FlowEdge, AnalysisResult, PatternMatch, SectionColor } from './types.js';
import { codePatterns } from './patterns.js';
import { isEmptyOrComment, extractSnippet } from './helpers.js';

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
        patternName: string,
        nextSectionLabel?: string
    ): string {
        nodeId++;
        const id = `n${nodeId}`;

        // Check if this is a multi-line node that should have children
        const lineSpan = (match.lineEnd - match.lineStart);
        const shouldHaveChildren = lineSpan > 5 &&
            (patternName === 'asyncFunction' || patternName === 'expressRoute');

        let children: FlowNode[] | undefined;
        let childEdges: FlowEdge[] | undefined;

        if (shouldHaveChildren) {
            // Parse internal content as sub-nodes (skip first line which is signature)
            const parsed = parseSubNodes(match.lineStart + 1, match.lineEnd - 1);
            if (parsed.children.length > 0) {
                children = parsed.children;
                childEdges = parsed.childEdges;

                // Add "next section" info node at the end
                if (nextSectionLabel) {
                    const endNodeId = `sub${children.length + 1}`;
                    children.push({
                        id: endNodeId,
                        label: `→ ${nextSectionLabel}`,
                        subtitle: 'Next Section',
                        shape: 'rounded',
                        color: 'blue',
                        narrative: `Continues to ${nextSectionLabel}`,
                    });
                    const lastChild = parsed.children[parsed.children.length - 1];
                    if (lastChild && childEdges) {
                        childEdges.push({
                            id: `se${childEdges.length + 1}`,
                            source: lastChild.id,
                            target: endNodeId,
                            label: 'continues',
                        });
                    }
                }
            }
        }

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
            children,
            childEdges,
            nextSectionLabel,
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

    /**
     * Parse sub-nodes within a line range (for drill-down feature)
     * This parses INSIDE blocks (try, if) to show internal logic with proper branching
     */
    function parseSubNodes(startLine: number, endLine: number): { children: FlowNode[], childEdges: FlowEdge[] } {
        const children: FlowNode[] = [];
        const childEdges: FlowEdge[] = [];
        let subNodeId = 0;
        let prevChildId: string | null = null;
        let lastDecisionId: string | null = null;
        let inElseBlock = false;

        function addChild(
            label: string,
            subtitle: string,
            shape: 'rectangle' | 'diamond' | 'rounded' | 'hexagon',
            color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'cyan',
            lineStart: number,
            lineEnd: number,
            codeSnippet: string,
            isDecision?: boolean
        ): string {
            subNodeId++;
            const childId = `sub${subNodeId}`;

            children.push({
                id: childId,
                label,
                subtitle,
                shape,
                color,
                lineStart,
                lineEnd,
                codeSnippet,
                isDecision,
                narrative: `Execute ${label}`,
            });

            // Handle edge creation based on context
            if (prevChildId) {
                // If we're coming from an if block and entering else
                if (inElseBlock && lastDecisionId) {
                    // Connect from decision node's NO branch
                    childEdges.push({
                        id: `se${childEdges.length + 1}`,
                        source: lastDecisionId,
                        target: childId,
                        sourceHandle: 'no',
                        label: 'NO',
                    });
                    inElseBlock = false;
                    lastDecisionId = null;
                } else {
                    childEdges.push({
                        id: `se${childEdges.length + 1}`,
                        source: prevChildId,
                        target: childId,
                        sourceHandle: isDecision ? undefined :
                            (children.find(c => c.id === prevChildId)?.isDecision ? 'yes' : undefined),
                        label: children.find(c => c.id === prevChildId)?.isDecision ? 'YES' : undefined,
                    });
                }
            }

            prevChildId = childId;

            // Track decision nodes for branching
            if (isDecision) {
                lastDecisionId = childId;
            }

            return childId;
        }

        for (let i = startLine - 1; i < endLine && i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;
            const trimmed = line.trim();

            // Skip empty lines, comments, closing braces only
            if (!trimmed || trimmed.startsWith('//') || trimmed === '}' || trimmed === '});') continue;

            // else block - mark for NO branch from last decision
            if (trimmed.startsWith('} else') || trimmed === 'else {' || trimmed === '} else {') {
                inElseBlock = true;
                continue;
            }

            // await fetch - API call
            if (trimmed.includes('await') && trimmed.includes('fetch')) {
                const varMatch = line.match(/const\s+(\w+)\s*=/);
                const varName = varMatch?.[1] || 'response';
                let fetchEnd = i;
                if (!trimmed.includes(');')) {
                    for (let j = i + 1; j < endLine && j < lines.length; j++) {
                        if (lines[j]?.includes(');') || lines[j]?.includes('});')) {
                            fetchEnd = j;
                            break;
                        }
                    }
                }
                addChild(`Fetch: ${varName}`, 'await fetch()', 'hexagon', 'purple', i + 1, fetchEnd + 1, extractSnippet(lines, i, fetchEnd + 1));
                i = fetchEnd;
                continue;
            }

            // await .json() - Parse JSON
            if (trimmed.includes('await') && trimmed.includes('.json()')) {
                const varMatch = line.match(/const\s+(\w+)\s*=/);
                const varName = varMatch?.[1] || 'data';
                addChild(`Parse: ${varName}`, 'await .json()', 'hexagon', 'cyan', i + 1, i + 1, trimmed);
                continue;
            }

            // try block
            if (trimmed.startsWith('try {') || trimmed === 'try') {
                addChild('Try Block', 'Error Handling', 'rounded', 'orange', i + 1, i + 1, trimmed);
                continue;
            }

            // catch block
            if (trimmed.startsWith('catch') || trimmed.startsWith('} catch')) {
                addChild('Catch Error', 'Error Handler', 'rounded', 'red', i + 1, i + 1, trimmed);
                continue;
            }

            // finally block
            if (trimmed.startsWith('finally') || trimmed.startsWith('} finally')) {
                addChild('Finally', 'Cleanup', 'rounded', 'blue', i + 1, i + 1, trimmed);
                continue;
            }

            // if statement - decision node
            if (trimmed.startsWith('if (') || trimmed.startsWith('if(')) {
                const condMatch = line.match(/if\s*\(([^)]+)\)/);
                const cond = condMatch?.[1] || 'condition';
                addChild(`If: ${cond.substring(0, 25)}`, 'Condition', 'diamond', 'orange', i + 1, i + 1, trimmed, true);
                continue;
            }

            // return statement
            if (trimmed.startsWith('return')) {
                const hasValue = trimmed.length > 7;
                addChild(hasValue ? 'Return Value' : 'Return Early', 'Exit', 'rounded', 'red', i + 1, i + 1, trimmed);
                continue;
            }

            // throw statement
            if (trimmed.startsWith('throw')) {
                addChild('Throw Error', 'Exception', 'rounded', 'red', i + 1, i + 1, trimmed);
                continue;
            }

            // navigate call
            if (trimmed.includes('navigate(')) {
                const pathMatch = line.match(/navigate\(['"`]([^'"`]+)['"`]/);
                const path = pathMatch?.[1] || 'page';
                addChild(`Navigate: ${path.substring(0, 20)}`, 'Redirect', 'rounded', 'green', i + 1, i + 1, trimmed);
                continue;
            }

            // State update (setOrders, setUsers, etc.)
            if (trimmed.match(/^set[A-Z]\w*\(/)) {
                const funcMatch = trimmed.match(/^(set[A-Z]\w*)\(/);
                const funcName = funcMatch?.[1] || 'setState';
                let stateEnd = i;
                let parenCount = (trimmed.match(/\(/g) || []).length - (trimmed.match(/\)/g) || []).length;
                while (parenCount > 0 && stateEnd < endLine - 1) {
                    stateEnd++;
                    const nextLine = lines[stateEnd];
                    if (nextLine) {
                        parenCount += (nextLine.match(/\(/g) || []).length - (nextLine.match(/\)/g) || []).length;
                    }
                }
                addChild(funcName, 'State Update', 'rectangle', 'green', i + 1, stateEnd + 1, extractSnippet(lines, i, stateEnd + 1));
                i = stateEnd;
                continue;
            }

            // const with await (generic async call)
            if (trimmed.startsWith('const ') && trimmed.includes('await')) {
                const varMatch = line.match(/const\s+(\w+)\s*=/);
                const varName = varMatch?.[1] || 'result';
                addChild(`Await: ${varName}`, 'Async Call', 'hexagon', 'purple', i + 1, i + 1, trimmed);
                continue;
            }

            // Standalone await (no const assignment) - e.g., await signup(), await delay()
            if (trimmed.startsWith('await ') && !trimmed.startsWith('const ')) {
                const funcMatch = trimmed.match(/await\s+(\w+)/);
                const funcName = funcMatch?.[1] || 'async';
                addChild(`Await: ${funcName}`, 'Async Call', 'hexagon', 'purple', i + 1, i + 1, trimmed);
                continue;
            }

            // const with assignment (no await)
            if (trimmed.startsWith('const ') && trimmed.includes('=')) {
                const varMatch = line.match(/const\s+(\w+)/);
                const varName = varMatch?.[1] || 'variable';
                addChild(`Const: ${varName}`, 'Variable', 'rectangle', 'blue', i + 1, i + 1, trimmed);
                continue;
            }

            // console.log / console.error
            if (trimmed.startsWith('console.')) {
                const method = trimmed.startsWith('console.error') ? 'Log Error' : 'Log';
                addChild(method, 'Debug', 'rectangle', 'cyan', i + 1, i + 1, trimmed);
                continue;
            }

            // Generic function/method call (funcName(); or obj.method();)
            if (trimmed.match(/^[\w.]+\(/) && trimmed.endsWith(';')) {
                // Try to extract meaningful name
                const methodMatch = trimmed.match(/\.(\w+)\(/);
                const funcMatch = trimmed.match(/^(\w+)\(/);
                const name = methodMatch?.[1] || funcMatch?.[1] || 'call';
                addChild(`Call: ${name}`, 'Method', 'rectangle', 'blue', i + 1, i + 1, trimmed);
                continue;
            }
        }

        return { children, childEdges };
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

    for (let i = 0; i < finalMatches.length; i++) {
        const currentMatch = finalMatches[i];
        if (!currentMatch) continue;
        const { patternName, match } = currentMatch;

        // Get the next section's label for the "next section" info node
        const nextMatch = finalMatches[i + 1];
        const nextSectionLabel = nextMatch?.match.label;

        const nodeId = addNode(match, patternName, nextSectionLabel);
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
