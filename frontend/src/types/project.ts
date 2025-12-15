// ============================================================================
// Project & File Types
// ============================================================================

export interface FileNode {
    id: string;
    name: string;
    path: string;
    type: 'file' | 'folder';
    language?: string;
    visualizable: boolean;
    content?: string;
    children?: FileNode[];
}

// Supported code file extensions
export const CODE_EXTENSIONS: Record<string, string> = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.go': 'go',
    '.rs': 'rust',
    '.cs': 'csharp',
    '.cpp': 'cpp',
    '.c': 'c',
    '.rb': 'ruby',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.vue': 'vue',
    '.svelte': 'svelte',
};

// Files/folders to ignore
export const IGNORED_PATTERNS = [
    'node_modules',
    '.git',
    '.next',
    '.nuxt',
    'dist',
    'build',
    '.cache',
    '.vscode',
    '.idea',
    '__pycache__',
    '.DS_Store',
    'Thumbs.db',
    '.env',
    '.env.local',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
];
