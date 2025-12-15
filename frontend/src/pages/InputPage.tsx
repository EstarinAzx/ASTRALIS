// ============================================================================
// Input Page - Code Input & Configuration
// ============================================================================

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Upload, ClipboardPaste, Zap, BookOpen, Microscope, Clock } from 'lucide-react';
import { CodeEditor } from '../components/input/CodeEditor';
import { LanguageSelect } from '../components/input/LanguageSelect';
import { VerbosityCard } from '../components/input/VerbosityCard';
import { RecentGenerations } from '../components/input/RecentGenerations';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { VerbosityMode, AnalysisResult } from '../types/astralis';

export function InputPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [code, setCode] = useState('// Paste your code here or drag a file...\n// Example:\ndef calculate_complexity(graph):\n    nodes = graph.get_nodes()\n    if not nodes:\n        return 0\n    ...');
    const [fileName, setFileName] = useState('main.py');
    const [language, setLanguage] = useState('python');
    const [mode, setMode] = useState<VerbosityMode>('standard');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Line count
    const lineCount = code.split('\n').length;

    // Handle file upload
    const handleFileUpload = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.js,.ts,.tsx,.jsx,.py,.java,.go,.rs,.cs,.cpp,.c,.rb,.php';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const text = await file.text();
                setCode(text);
                setFileName(file.name);
                // Auto-detect language from extension
                const ext = file.name.split('.').pop()?.toLowerCase();
                const langMap: Record<string, string> = {
                    js: 'javascript', jsx: 'javascript',
                    ts: 'typescript', tsx: 'typescript',
                    py: 'python', java: 'java', go: 'go',
                    rs: 'rust', cs: 'csharp', cpp: 'cpp',
                    c: 'cpp', rb: 'ruby', php: 'php',
                };
                if (ext && langMap[ext]) {
                    setLanguage(langMap[ext]);
                }
            }
        };
        input.click();
    }, []);

    // Handle paste from clipboard
    const handlePaste = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();
            setCode(text);
        } catch {
            setError('Failed to read clipboard');
        }
    }, []);

    // Handle generate
    const handleGenerate = async () => {
        if (!code.trim()) {
            setError('Please enter some code');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<AnalysisResult>('/analyze', {
                code,
                fileName,
                language,
                mode,
            });

            // Navigate to dashboard with result
            navigate(`/dashboard/${response.data.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Analysis failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-[var(--text-primary)]">ASTRALIS</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Credits (placeholder) */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-tertiary)] text-sm">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            <span className="text-[var(--text-secondary)]">1,200 Credits</span>
                        </div>

                        {/* User avatar */}
                        <div
                            className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium"
                            title={user?.email}
                        >
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left: Code Editor (3 cols) */}
                    <div className="lg:col-span-3 space-y-4">
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                                Input Source Code
                            </h1>
                            <p className="text-[var(--text-secondary)]">
                                Paste your logic below to generate the multi-layer mind map.
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleFileUpload}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Upload File
                            </button>
                            <button
                                onClick={handlePaste}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            >
                                <ClipboardPaste className="w-4 h-4" />
                                Paste
                            </button>
                        </div>

                        {/* Editor */}
                        <CodeEditor
                            value={code}
                            onChange={setCode}
                            language={language}
                            fileName={fileName}
                            lineCount={lineCount}
                        />
                    </div>

                    {/* Right: Configuration (2 cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
                                Configuration
                            </h2>
                            <p className="text-sm text-[var(--text-muted)]">
                                Customize generation parameters.
                            </p>
                        </div>

                        {/* Language Select */}
                        <LanguageSelect value={language} onChange={setLanguage} />

                        {/* Verbosity Mode */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[var(--text-primary)]">
                                    Verbosity Mode
                                </span>
                                <button className="text-xs text-[var(--color-accent)] hover:underline">
                                    Help?
                                </button>
                            </div>

                            <div className="space-y-2">
                                <VerbosityCard
                                    mode="concise"
                                    currentMode={mode}
                                    onSelect={setMode}
                                    icon={Zap}
                                    title="Concise"
                                    description="High-level architectural view only. Ignores minor helpers."
                                />
                                <VerbosityCard
                                    mode="standard"
                                    currentMode={mode}
                                    onSelect={setMode}
                                    icon={BookOpen}
                                    title="Standard"
                                    description="Balanced structure and logic flow. The default choice."
                                />
                                <VerbosityCard
                                    mode="deep_dive"
                                    currentMode={mode}
                                    onSelect={setMode}
                                    icon={Microscope}
                                    title="Deep Dive"
                                    description="Full variable tracking, loops, and comprehensive flow control."
                                />
                            </div>
                        </div>

                        {/* Generate Button */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full py-3 px-4 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generate Map
                                </>
                            )}
                        </button>

                        {/* Recent Generations */}
                        <div className="pt-4 border-t border-[var(--border-color)]">
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                                <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                    Recent Generations
                                </span>
                            </div>
                            <RecentGenerations />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
