// ============================================================================
// Dashboard Page - Code Mind Map Visualization
// ============================================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Sparkles, FileText, Download, Share2, Search,
    ChevronRight, Settings, Bell,
} from 'lucide-react';
import { LayerTabs } from '../components/dashboard/LayerTabs';
import { DiagramView } from '../components/dashboard/DiagramView';
import { InspectorPanel } from '../components/dashboard/InspectorPanel';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { AnalysisResult, DiagramNode } from '../types/astralis';

type LayerKey = 'L0_context' | 'L1_container' | 'L2_component' | 'L3_code' | 'L4_data' | 'L5_infra';

export function DashboardPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeLayer, setActiveLayer] = useState<LayerKey>('L2_component');
    const [selectedNode, setSelectedNode] = useState<DiagramNode | null>(null);

    useEffect(() => {
        async function fetchAnalysis() {
            if (!id) return;

            try {
                const response = await api.get<AnalysisResult>(`/analyze/${id}`);
                setAnalysis(response.data);

                // Select first node by default
                const firstLayer = response.data.result.layers[activeLayer];
                if (firstLayer?.nodes?.[0]) {
                    setSelectedNode(firstLayer.nodes[0]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load analysis');
            } finally {
                setIsLoading(false);
            }
        }
        fetchAnalysis();
    }, [id, activeLayer]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[var(--text-secondary)]">Loading analysis...</p>
                </div>
            </div>
        );
    }

    if (error || !analysis) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error ?? 'Analysis not found'}</p>
                    <button
                        onClick={() => navigate('/input')}
                        className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const currentLayer = analysis.result.layers[activeLayer];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
            {/* Header */}
            <header className="border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className="px-6 py-3 flex items-center justify-between">
                    {/* Left: Logo + Search */}
                    <div className="flex items-center gap-6">
                        <Link to="/input" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <span className="text-lg font-bold text-[var(--text-primary)]">ASTRALIS</span>
                                <span className="text-xs text-[var(--text-muted)] block -mt-1">Multi-Layer Code Mapper</span>
                            </div>
                        </Link>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search nodes, functions, or logic..."
                                className="w-80 pl-10 pr-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                            />
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        <button className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                            <Settings className="w-5 h-5" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                            <Bell className="w-5 h-5" />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white font-medium">
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                        <div
                            className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium"
                            title={user?.email}
                        >
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </header>

            {/* Sub-header: Breadcrumb + Export */}
            <div className="px-6 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--text-muted)]">src</span>
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-[var(--text-muted)]">auth</span>
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-[var(--text-primary)] font-medium">{analysis.fileName}</span>
                    <span className="ml-2 px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400 font-medium">
                        Active
                    </span>
                </div>

                {/* Title + Export */}
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                        Map: {analysis.fileName}
                    </h1>

                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">
                            <FileText className="w-4 h-4" />
                            Markdown
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">
                            <Download className="w-4 h-4" />
                            Export PNG
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">
                            <Sparkles className="w-4 h-4" />
                            JSON API
                        </button>
                    </div>
                </div>
            </div>

            {/* Layer Tabs */}
            <LayerTabs activeLayer={activeLayer} onLayerChange={setActiveLayer} />

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Diagram View */}
                <div className="flex-1 overflow-auto">
                    <DiagramView
                        layer={currentLayer}
                        selectedNode={selectedNode}
                        onNodeSelect={setSelectedNode}
                    />
                </div>

                {/* Inspector Panel */}
                <InspectorPanel node={selectedNode} />
            </div>
        </div>
    );
}
