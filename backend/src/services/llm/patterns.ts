// ============================================================================
// Code Detection Patterns
// ============================================================================

import type { CodePattern, PatternMatch, SectionColor } from './types.js';
import { findBlockEnd, findParenEnd, conditionToEnglish, extractSnippet } from './helpers.js';

// ============================================================================
// Pattern: Imports
// ============================================================================
const importPattern: CodePattern = {
    name: 'imports',
    priority: 100,
    match: (line) => line.trim().startsWith('import '),
    extract: (line, index, lines) => {
        // Group consecutive imports
        let endIndex = index;
        while (endIndex + 1 < lines.length && lines[endIndex + 1]?.trim().startsWith('import ')) {
            endIndex++;
        }

        return {
            label: 'IMPORTS',
            subtitle: 'External Dependencies',
            shape: 'rectangle',
            color: 'blue',
            lineStart: index + 1,
            lineEnd: endIndex + 1,
            codeSnippet: lines.slice(index, endIndex + 1).join('\n'),
        };
    },
};

// ============================================================================
// Pattern: TypeScript Interfaces/Types
// ============================================================================
const interfacePattern: CodePattern = {
    name: 'interface',
    priority: 95,
    match: (line) => /^(export\s+)?(interface|type)\s+\w+/.test(line.trim()),
    extract: (line, index, lines) => {
        const match = line.match(/(interface|type)\s+(\w+)/);
        const name = match?.[2] || 'Type';
        const isInterface = line.includes('interface');

        const endLine = findBlockEnd(lines, index);

        return {
            label: `${isInterface ? 'Interface' : 'Type'}: ${name}`,
            subtitle: 'Type Definition',
            shape: 'rectangle',
            color: 'blue',
            lineStart: index + 1,
            lineEnd: endLine,
            codeSnippet: extractSnippet(lines, index, endLine),
        };
    },
};

// ============================================================================
// Pattern: Express Route Handlers
// ============================================================================
const expressRoutePattern: CodePattern = {
    name: 'expressRoute',
    priority: 90,
    match: (line) => /router\.(get|post|put|patch|delete)\s*\(/.test(line),
    extract: (line, index, lines) => {
        const methodMatch = line.match(/router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/);
        const method = methodMatch?.[1]?.toUpperCase() || 'ROUTE';
        const path = methodMatch?.[2] || '/';

        const endLine = findBlockEnd(lines, index);

        return {
            label: `${method} ${path}`,
            subtitle: 'Express Route',
            shape: 'hexagon',
            color: 'purple',
            lineStart: index + 1,
            lineEnd: endLine,
            codeSnippet: extractSnippet(lines, index, endLine),
        };
    },
};

// ============================================================================
// Pattern: Async Functions
// ============================================================================
const asyncFunctionPattern: CodePattern = {
    name: 'asyncFunction',
    priority: 85,
    match: (line) => /async\s+function\s+\w+/.test(line) || /const\s+\w+\s*=\s*async\s*\(/.test(line),
    extract: (line, index, lines) => {
        // Extract function name
        let name = 'asyncFunc';
        const funcMatch = line.match(/async\s+function\s+(\w+)/);
        const arrowMatch = line.match(/const\s+(\w+)\s*=\s*async/);

        if (funcMatch) name = funcMatch[1] ?? name;
        else if (arrowMatch) name = arrowMatch[1] ?? name;

        const endLine = findBlockEnd(lines, index);
        const fnContent = lines.slice(index, endLine).join('\n').toLowerCase();

        // Determine if it's an API call, handler, etc.
        let label = `Async: ${name}`;
        let color: SectionColor = 'purple';

        if (fnContent.includes('fetch(') || fnContent.includes('axios')) {
            label = `API: ${name}`;
        } else if (name.toLowerCase().startsWith('handle')) {
            label = `Handler: ${name}`;
        }

        return {
            label,
            subtitle: 'Async Function',
            shape: 'hexagon',
            color,
            lineStart: index + 1,
            lineEnd: endLine,
            codeSnippet: extractSnippet(lines, index, endLine),
        };
    },
};

// ============================================================================
// Pattern: Regular Functions
// ============================================================================
const functionPattern: CodePattern = {
    name: 'function',
    priority: 80,
    match: (line) => {
        // Match: function name(), export default function name(), const name = () =>
        return (
            (/^(export\s+)?(default\s+)?function\s+\w+/.test(line.trim()) && !line.includes('async')) ||
            (/^const\s+\w+\s*=\s*\([^)]*\)\s*(:\s*[^=]+)?\s*=>/.test(line.trim()) && !line.includes('async'))
        );
    },
    extract: (line, index, lines) => {
        let name = 'function';
        const funcMatch = line.match(/function\s+(\w+)/);
        const arrowMatch = line.match(/const\s+(\w+)\s*=/);

        if (funcMatch) name = funcMatch[1] ?? name;
        else if (arrowMatch) name = arrowMatch[1] ?? name;

        // Check if this is a React component (capitalized, or has JSX return)
        const isComponent = /^[A-Z]/.test(name);
        const endLine = findBlockEnd(lines, index);

        // For React components, only capture the signature line
        // This allows internal hooks/functions/render to be parsed separately
        if (isComponent) {
            return {
                label: `Component: ${name}`,
                subtitle: 'React Component',
                shape: 'rounded',
                color: 'cyan',
                lineStart: index + 1,
                lineEnd: index + 1, // Only signature line!
                codeSnippet: line.trim(),
            };
        }

        // Regular functions capture the whole block
        return {
            label: `Function: ${name}`,
            subtitle: 'Function Definition',
            shape: 'rectangle',
            color: 'green',
            lineStart: index + 1,
            lineEnd: endLine,
            codeSnippet: extractSnippet(lines, index, endLine),
        };
    },
};

// ============================================================================
// Pattern: Prisma Queries
// ============================================================================
const prismaPattern: CodePattern = {
    name: 'prisma',
    priority: 75,
    match: (line) => /await\s+prisma\.\w+\.\w+\s*\(/.test(line) || /prisma\.\w+\.\w+\s*\(/.test(line),
    extract: (line, index, lines) => {
        const match = line.match(/prisma\.(\w+)\.(\w+)/);
        const model = match?.[1] || 'model';
        const method = match?.[2] || 'query';

        // Find end of the prisma call (could span multiple lines)
        let endLine = index;
        if (line.includes('({')) {
            endLine = findBlockEnd(lines, index) - 1;
        } else if (line.includes('(')) {
            endLine = findParenEnd(lines, index) - 1;
        }

        return {
            label: `Prisma: ${model}.${method}`,
            subtitle: 'Database Query',
            shape: 'hexagon',
            color: 'purple',
            lineStart: index + 1,
            lineEnd: Math.max(endLine + 1, index + 1),
            codeSnippet: extractSnippet(lines, index, endLine + 1),
        };
    },
};

// ============================================================================
// Pattern: useState Hook
// ============================================================================
const useStatePattern: CodePattern = {
    name: 'useState',
    priority: 70,
    match: (line) => line.includes('useState'),
    extract: (line, index, lines) => {
        const match = line.match(/const\s+\[(\w+)/);
        const name = match?.[1] || 'state';

        // Check if useState has multi-line object/array initializer
        let endLine = index;
        if (line.includes('useState({') || line.includes('useState([')) {
            // Find closing brace/bracket
            endLine = findBlockEnd(lines, index) - 1;
        } else if (line.includes('useState(') && !line.includes(');')) {
            // Might span multiple lines
            endLine = findParenEnd(lines, index) - 1;
        }

        return {
            label: `useState: ${name}`,
            subtitle: 'State Hook',
            shape: 'rectangle',
            color: 'green',
            lineStart: index + 1,
            lineEnd: Math.max(endLine + 1, index + 1),
            codeSnippet: extractSnippet(lines, index, endLine + 1),
        };
    },
};

// ============================================================================
// Pattern: useEffect Hook
// ============================================================================
const useEffectPattern: CodePattern = {
    name: 'useEffect',
    priority: 70,
    match: (line) => line.includes('useEffect'),
    extract: (line, index, lines) => {
        const endLine = findBlockEnd(lines, index);

        return {
            label: 'useEffect',
            subtitle: 'Side Effect',
            shape: 'hexagon',
            color: 'purple',
            lineStart: index + 1,
            lineEnd: endLine,
            codeSnippet: extractSnippet(lines, index, endLine),
        };
    },
};

// ============================================================================
// Pattern: Custom Hooks
// ============================================================================
const customHookPattern: CodePattern = {
    name: 'customHook',
    priority: 65,
    match: (line) => /=\s*use[A-Z]\w+\s*\(/.test(line) && !line.includes('useState') && !line.includes('useEffect'),
    extract: (line, index) => {
        const match = line.match(/use[A-Z]\w+/);
        const hookName = match?.[0] || 'useHook';

        return {
            label: `Hook: ${hookName}`,
            subtitle: 'Custom Hook',
            shape: 'rectangle',
            color: 'green',
            lineStart: index + 1,
            lineEnd: index + 1,
            codeSnippet: line.trim(),
        };
    },
};

// ============================================================================
// Pattern: Guard Clauses (if with return)
// ============================================================================
const guardClausePattern: CodePattern = {
    name: 'guardClause',
    priority: 60,
    match: (line) => /if\s*\([^)]+\)/.test(line) && line.includes('return'),
    extract: (line, index, lines) => {
        const condMatch = line.match(/if\s*\(([^)]+(?:\([^)]*\))?[^)]*)\)/);
        const condition = condMatch?.[1] || 'condition';
        const readable = conditionToEnglish(condition);

        // Single-line guard: if (!x) return ...;
        // Extract the return content
        let yesContent = '';
        const returnMatch = line.match(/return\s+(.+?);?\s*$/);
        if (returnMatch) {
            yesContent = `return ${returnMatch[1]}`;
        }

        // Determine yes branch label
        let yesLabel = 'Early Return';
        let yesColor: SectionColor = 'red';
        if (yesContent.includes('<')) {
            yesLabel = 'Return JSX';
            yesColor = 'cyan';
        } else if (yesContent.includes('null')) {
            yesLabel = 'Return Null';
        } else if (yesContent.includes('error') || yesContent.includes('Error')) {
            yesLabel = 'Return Error';
        }

        return {
            label: readable,
            subtitle: 'Guard Clause',
            shape: 'diamond',
            color: 'red',
            lineStart: index + 1,
            lineEnd: index + 1,
            codeSnippet: line.trim(),
            isDecision: true,
            condition: readable,
            branches: {
                yes: {
                    label: yesLabel,
                    lineStart: index + 1,
                    lineEnd: index + 1,
                    content: yesContent,
                },
            },
        };
    },
};

// ============================================================================
// Pattern: If Blocks (multi-line)
// ============================================================================
const ifBlockPattern: CodePattern = {
    name: 'ifBlock',
    priority: 55,
    match: (line) => /if\s*\([^)]+\)\s*\{/.test(line) && !line.includes('return'),
    extract: (line, index, lines) => {
        const condMatch = line.match(/if\s*\(([^)]+(?:\([^)]*\))?[^)]*)\)/);
        const condition = condMatch?.[1] || 'condition';
        const readable = conditionToEnglish(condition);

        const blockEnd = findBlockEnd(lines, index);
        const blockContent = lines.slice(index + 1, blockEnd - 1).join('\n');

        // Determine what the if block does
        let yesLabel = 'Execute Block';
        let yesColor: SectionColor = 'blue';

        if (blockContent.includes('return')) {
            yesLabel = 'Return Early';
            yesColor = 'red';
        } else if (blockContent.includes('set')) {
            yesLabel = 'Update State';
            yesColor = 'green';
        } else if (blockContent.includes('throw')) {
            yesLabel = 'Throw Error';
            yesColor = 'red';
        }

        return {
            label: readable,
            subtitle: 'Decision',
            shape: 'diamond',
            color: 'orange',
            lineStart: index + 1,
            lineEnd: blockEnd,
            codeSnippet: extractSnippet(lines, index, blockEnd),
            isDecision: true,
            condition: readable,
            branches: {
                yes: {
                    label: yesLabel,
                    lineStart: index + 2,
                    lineEnd: blockEnd - 1,
                    content: blockContent,
                },
            },
        };
    },
};

// ============================================================================
// Pattern: Try/Catch
// ============================================================================
const tryCatchPattern: CodePattern = {
    name: 'tryCatch',
    priority: 50,
    match: (line) => line.trim().startsWith('try {') || line.trim() === 'try',
    extract: (line, index, lines) => {
        const endLine = findBlockEnd(lines, index);

        return {
            label: 'Try Block',
            subtitle: 'Error Handling',
            shape: 'rounded',
            color: 'orange',
            lineStart: index + 1,
            lineEnd: endLine,
            codeSnippet: extractSnippet(lines, index, endLine),
        };
    },
};

// ============================================================================
// Pattern: Switch Statements
// ============================================================================
const switchPattern: CodePattern = {
    name: 'switch',
    priority: 48,
    match: (line) => /switch\s*\(/.test(line),
    extract: (line, index, lines) => {
        const match = line.match(/switch\s*\(([^)]+)\)/);
        const switchVar = match?.[1]?.trim() || 'value';

        const endLine = findBlockEnd(lines, index);

        return {
            label: `Switch: ${switchVar}`,
            subtitle: 'Multi-Branch Decision',
            shape: 'diamond',
            color: 'orange',
            lineStart: index + 1,
            lineEnd: endLine,
            codeSnippet: extractSnippet(lines, index, endLine),
            isDecision: true,
        };
    },
};

// ============================================================================
// Pattern: Return Statements (JSX)
// ============================================================================
const returnJsxPattern: CodePattern = {
    name: 'returnJsx',
    priority: 45,
    match: (line) => line.trim().startsWith('return (') || line.trim().startsWith('return('),
    extract: (line, index, lines) => {
        const endLine = findParenEnd(lines, index);

        return {
            label: 'RENDER',
            subtitle: 'Component Output',
            shape: 'rounded',
            color: 'cyan',
            lineStart: index + 1,
            lineEnd: endLine,
            codeSnippet: extractSnippet(lines, index, endLine),
        };
    },
};

// ============================================================================
// Pattern: Variable Declaration (const with Router, etc.)
// ============================================================================
const constDeclarationPattern: CodePattern = {
    name: 'constDeclaration',
    priority: 40,
    match: (line) => /^const\s+\w+\s*=\s*\w+\s*\(/.test(line.trim()),
    extract: (line, index) => {
        const match = line.match(/const\s+(\w+)\s*=\s*(\w+)\s*\(/);
        const varName = match?.[1] || 'variable';
        const factoryName = match?.[2] || 'factory';

        return {
            label: `${varName} = ${factoryName}()`,
            subtitle: 'Initialization',
            shape: 'rectangle',
            color: 'blue',
            lineStart: index + 1,
            lineEnd: index + 1,
            codeSnippet: line.trim(),
        };
    },
};

// ============================================================================
// Pattern: Export Statements
// ============================================================================
const exportPattern: CodePattern = {
    name: 'export',
    priority: 30,
    match: (line) => line.trim().startsWith('export default') || line.trim().startsWith('export {'),
    extract: (line, index) => {
        const isDefault = line.includes('default');

        return {
            label: isDefault ? 'Export Default' : 'Named Exports',
            subtitle: 'Module Export',
            shape: 'rectangle',
            color: 'blue',
            lineStart: index + 1,
            lineEnd: index + 1,
            codeSnippet: line.trim(),
        };
    },
};

// ============================================================================
// Export All Patterns (sorted by priority)
// ============================================================================
export const codePatterns: CodePattern[] = [
    importPattern,
    interfacePattern,
    expressRoutePattern,
    asyncFunctionPattern,
    functionPattern,
    prismaPattern,
    useStatePattern,
    useEffectPattern,
    customHookPattern,
    guardClausePattern,
    ifBlockPattern,
    tryCatchPattern,
    switchPattern,
    returnJsxPattern,
    constDeclarationPattern,
    exportPattern,
].sort((a, b) => b.priority - a.priority);
