// ============================================================================
// Dashboard Page - Unified Flowchart View
// ============================================================================

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Search,
    Settings,
    Bell,
    Share2,
    ChevronRight,
    FileCode,
    Download,
    Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { FlowchartView } from '../components/dashboard/FlowchartView';
import { InspectorPanel } from '../components/dashboard/InspectorPanel';
import type { AnalysisResult, FlowNode } from '../types/astralis';

export function DashboardPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();

    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch analysis result
    useEffect(() => {
        if (!id) return;

        const fetchResult = async () => {
            try {
                setLoading(true);
                setError(null);

                // api.get<T> returns { status: string, data: T }
                // Backend data: { id, fileName, language, result: {...} }
                interface AnalysisData {
                    id: string;
                    fileName: string;
                    language: string;
                    result: AnalysisResult;
                }

                const response = await api.get<AnalysisData>(`/analyze/${id}`);

                console.log('📥 Dashboard API Response:', response);

                if (response.status === 'success' && response.data?.result) {
                    const analysisResult = {
                        ...response.data.result,
                        id: response.data.id,
                    };
                    setResult(analysisResult);
                    // Select first node by default
                    if (analysisResult.nodes && analysisResult.nodes.length > 0) {
                        setSelectedNode(analysisResult.nodes[0]);
                    }
                } else {
                    console.error('❌ Response check failed:', response);
                    setError('Analysis not found');
                }
            } catch (err) {
                console.error('Failed to fetch analysis:', err);
                setError('Failed to load analysis');
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [id]);

    const handleNodeSelect = (node: FlowNode) => {
        setSelectedNode(node);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-[var(--color-primary)]" />
                    <p className="text-[var(--text-secondary)]">Loading analysis...</p>
                </div>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error || 'Analysis not found'}</p>
                    <Link
                        to="/input"
                        className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm"
                    >
                        ← Back to Input
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
            {/* Header */}
            <header className="h-14 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center px-4 gap-4">
                {/* Logo */}
                <Link to="/input" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">A</span>
                    </div>
                    <span className="font-semibold text-[var(--text-primary)]">ASTRALIS</span>
                </Link>

                {/* Search */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search sections..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                        />
                    </div>
                </div>

                {/* Map name */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)]">
                    <FileCode className="w-4 h-4 text-[var(--color-primary)]" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                        {result.fileName}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-auto">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] text-sm">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90">
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>
                    <button className="w-9 h-9 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">
                        <Bell className="w-4 h-4" />
                    </button>
                    <button className="w-9 h-9 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">
                        <Settings className="w-4 h-4" />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                </div>
            </header>

            {/* Sub-header */}
            <div className="h-12 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center px-4">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--text-muted)]">src</span>
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-[var(--text-muted)]">pages</span>
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-[var(--text-primary)] font-medium">{result.fileName}</span>
                </div>

                {/* Stats */}
                <div className="ml-auto flex items-center gap-4 text-xs text-[var(--text-muted)]">
                    <span>{result.totalLines} lines</span>
                    <span>{result.totalSections} sections</span>
                    <span>{result.language}</span>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Flowchart */}
                <div className="flex-1 relative">
                    <FlowchartView
                        nodes={result.nodes}
                        edges={result.edges}
                        selectedNode={selectedNode}
                        onNodeSelect={handleNodeSelect}
                    />
                </div>

                {/* Inspector */}
                <InspectorPanel node={selectedNode} />
            </div>
        </div>
    );
}
