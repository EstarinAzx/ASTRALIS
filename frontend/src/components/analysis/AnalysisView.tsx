// ============================================================================
// Analysis View - Main ASTRALIS Display
// ============================================================================

import { useState, useCallback } from 'react';
import { Sparkles, Zap, BookOpen, GitBranch } from 'lucide-react';
import { api } from '../../lib/api';
import type { FileNode } from '../../types/project';
import type { AnalysisResult, VerbosityMode } from '../../types/astralis';
import { LayerTabs } from './LayerTabs';

interface Props {
    selectedFile: FileNode | null;
}

export function AnalysisView({ selectedFile }: Props) {
    const [mode, setMode] = useState<VerbosityMode>('standard');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);

    const handleAnalyze = useCallback(async () => {
        if (!selectedFile?.content) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<AnalysisResult>('/analyze', {
                code: selectedFile.content,
                fileName: selectedFile.name,
                language: selectedFile.language,
                mode,
            });

            setResult(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Analysis failed');
        } finally {
            setIsLoading(false);
        }
    }, [selectedFile, mode]);

    // ============================================================================
    // No file selected state
    // ============================================================================
    if (!selectedFile) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 flex items-center justify-center mb-6">
                    <Sparkles className="w-10 h-10 text-[var(--color-primary)]" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                    Select a Code File
                </h2>
                <p className="text-[var(--text-secondary)] max-w-md">
                    Drop a project folder on the left, then click any code file to generate
                    its ASTRALIS Code Mind Map.
                </p>
            </div>
        );
    }

    // ============================================================================
    // File selected, ready to analyze
    // ============================================================================
    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-[var(--color-primary)]" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-[var(--text-primary)]">
                                {selectedFile.name}
                            </h2>
                            <p className="text-sm text-[var(--text-muted)]">
                                {selectedFile.language} • {selectedFile.path}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Mode selector */}
                        <div className="flex rounded-lg border border-[var(--border-color)] overflow-hidden">
                            <ModeButton
                                mode="concise"
                                currentMode={mode}
                                onClick={setMode}
                                icon={Zap}
                                label="Concise"
                            />
                            <ModeButton
                                mode="standard"
                                currentMode={mode}
                                onClick={setMode}
                                icon={BookOpen}
                                label="Standard"
                            />
                            <ModeButton
                                mode="deep_dive"
                                currentMode={mode}
                                onClick={setMode}
                                icon={GitBranch}
                                label="Deep Dive"
                            />
                        </div>

                        {/* Analyze button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading}
                            className="px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Generate Map
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {error && (
                    <div className="m-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                        {error}
                    </div>
                )}

                {result && !isLoading && (
                    <LayerTabs result={result.result} mode={mode} />
                )}

                {!result && !isLoading && !error && (
                    <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
                        Click "Generate Map" to analyze this file
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Mode Button
// ============================================================================
interface ModeButtonProps {
    mode: VerbosityMode;
    currentMode: VerbosityMode;
    onClick: (mode: VerbosityMode) => void;
    icon: React.FC<{ className?: string }>;
    label: string;
}

function ModeButton({ mode, currentMode, onClick, icon: Icon, label }: ModeButtonProps) {
    const isActive = mode === currentMode;

    return (
        <button
            onClick={() => onClick(mode)}
            className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${isActive
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );
}
