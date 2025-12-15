// ============================================================================
// Code Editor Component - Monaco Editor wrapper
// ============================================================================

import Editor from '@monaco-editor/react';

interface Props {
    value: string;
    onChange: (value: string) => void;
    language: string;
    fileName: string;
    lineCount: number;
}

export function CodeEditor({ value, onChange, language, fileName, lineCount }: Props) {
    return (
        <div className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-[#1e1e2e]">
            {/* Title bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#181825] border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                    {/* Traffic lights */}
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="ml-2 text-sm text-[var(--text-secondary)]">{fileName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span>{lineCount} Lines</span>
                    <button className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Editor */}
            <Editor
                height="400px"
                language={language}
                value={value}
                onChange={(val) => onChange(val ?? '')}
                theme="vs-dark"
                options={{
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    renderLineHighlight: 'line',
                    padding: { top: 16, bottom: 16 },
                    automaticLayout: true,
                }}
            />
        </div>
    );
}
