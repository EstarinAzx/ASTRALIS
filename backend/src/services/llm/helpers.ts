// ============================================================================
// LLM Service Helpers
// ============================================================================

/**
 * Find the end line of a code block using brace counting
 */
export function findBlockEnd(lines: string[], startIndex: number): number {
    let braces = 0;
    let j = startIndex;
    do {
        braces += (lines[j]?.match(/{/g) || []).length;
        braces -= (lines[j]?.match(/}/g) || []).length;
        j++;
    } while (braces > 0 && j < lines.length);
    return j;
}

/**
 * Find the end of a parenthesized block (for JSX returns, function calls)
 */
export function findParenEnd(lines: string[], startIndex: number): number {
    let parens = 0;
    let j = startIndex;
    do {
        parens += (lines[j]?.match(/\(/g) || []).length;
        parens -= (lines[j]?.match(/\)/g) || []).length;
        j++;
    } while (parens > 0 && j < lines.length);
    return j;
}

/**
 * Convert code conditions to human-readable English
 */
export function conditionToEnglish(condition: string): string {
    const c = condition.trim();

    // Negation: !user, !token, !loading
    const negationMatch = c.match(/^!(\w+)$/);
    if (negationMatch && negationMatch[1]) {
        const varName = negationMatch[1];
        const readable = varName.replace(/([A-Z])/g, ' $1').toLowerCase().trim();

        if (readable === 'token') return 'Is token missing?';
        if (readable.includes('loading')) return 'Is not loading?';
        if (readable.includes('user')) return 'Is user logged out?';
        if (readable.includes('data')) return 'Is data missing?';
        if (readable.includes('error')) return 'No error?';
        if (readable.includes('auth')) return 'Not authenticated?';

        return `Is ${readable} missing?`;
    }

    // Positive check: user, loading, authenticated
    const positiveMatch = c.match(/^(\w+)$/);
    if (positiveMatch && positiveMatch[1]) {
        const varName = positiveMatch[1];
        const readable = varName.replace(/([A-Z])/g, ' $1').toLowerCase().trim();

        if (readable === 'token') return 'Has valid token?';
        if (readable.includes('loading')) return 'Is loading?';
        if (readable.includes('user')) return 'Is user logged in?';
        if (readable.includes('error')) return 'Has error?';
        if (readable.includes('auth')) return 'Is authenticated?';

        return `Is ${readable} true?`;
    }

    // OR conditions: !content || !postId
    if (c.includes('||')) {
        const parts = c.split('||').map(p => p.trim());
        if (parts.every(p => p.startsWith('!'))) {
            const names = parts.map(p => p.replace('!', '').replace(/([A-Z])/g, ' $1').toLowerCase().trim());
            return `Not ${names.join(' or not ')}?`;
        }
    }

    // AND conditions
    if (c.includes('&&')) {
        const parts = c.split('&&').map(p => p.trim());
        const readable = parts.map(p => {
            if (p.startsWith('!')) return `no ${p.slice(1)}`;
            return p;
        });
        return `${readable.join(' and ')}?`;
    }

    // Comparison: a === b, a !== b
    if (c.includes('===') || c.includes('!==')) {
        const isNot = c.includes('!==');
        const parts = c.split(/===|!==/).map(p => p.trim());
        if (parts.length === 2 && parts[0] && parts[1]) {
            const left = parts[0].replace(/([A-Z])/g, ' $1').toLowerCase().trim();
            const right = parts[1];

            if (right === 'null' || right === 'undefined') {
                return isNot ? `Does ${left} exist?` : `Is ${left} empty?`;
            }
            return isNot ? `Is ${left} different from ${right}?` : `Is ${left} equal to ${right}?`;
        }
    }

    // Property access: response.ok, user.id
    const propMatch = c.match(/^!?(\w+)\.(\w+)$/);
    if (propMatch && propMatch[1] && propMatch[2]) {
        const isNegated = c.startsWith('!');
        const obj = propMatch[1];
        const prop = propMatch[2];

        if (prop === 'ok') return isNegated ? 'Did request fail?' : 'Is response OK?';
        return isNegated ? `Is ${obj}.${prop} false?` : `Is ${obj}.${prop} true?`;
    }

    // Default: clean up and make readable
    let readable = c
        .replace(/!/g, 'not ')
        .replace(/&&/g, ' and ')
        .replace(/\|\|/g, ' or ')
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

    if (readable.length > 35) {
        readable = readable.substring(0, 32) + '...';
    }

    return readable.charAt(0).toUpperCase() + readable.slice(1) + '?';
}

/**
 * Extract a snippet of code (first N lines)
 */
export function extractSnippet(lines: string[], start: number, end: number, maxLines = 6): string {
    const actualEnd = Math.min(start + maxLines, end);
    return lines.slice(start, actualEnd).join('\n');
}

/**
 * Determine if a line is empty or just whitespace/comments
 */
export function isEmptyOrComment(line: string): boolean {
    const trimmed = line.trim();
    return trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
}
