// ============================================================================
// Layer Tabs - Tab navigation for ASTRALIS layers
// ============================================================================

import { useState } from 'react';
import {
    Package,
    FileText,
    Map,
    GitBranch,
    Table2,
    Code2,
} from 'lucide-react';
import type { AstralisResponse, VerbosityMode } from '../../types/astralis';
import { Layer0Imports } from './layers/Layer0Imports';
import { Layer1Summary } from './layers/Layer1Summary';
import { Layer2Journey } from './layers/Layer2Journey';
import { Layer3Mermaid } from './layers/Layer3Mermaid';
import { Layer4Logic } from './layers/Layer4Logic';
import { Layer5CodeMap } from './layers/Layer5CodeMap';

interface Props {
    result: AstralisResponse;
    mode: VerbosityMode;
}

const TABS = [
    { id: 'layer0', label: 'Imports', icon: Package, color: 'var(--layer-0)' },
    { id: 'layer1', label: 'Summary', icon: FileText, color: 'var(--layer-1)' },
    { id: 'layer2', label: 'Journey', icon: Map, color: 'var(--layer-2)' },
    { id: 'layer3', label: 'Diagram', icon: GitBranch, color: 'var(--layer-3)' },
    { id: 'layer4', label: 'Logic', icon: Table2, color: 'var(--layer-4)' },
    { id: 'layer5', label: 'Code Map', icon: Code2, color: 'var(--layer-5)' },
];

export function LayerTabs({ result, mode }: Props) {
    const [activeTab, setActiveTab] = useState('layer1');

    // Filter tabs based on mode
    const visibleTabs = mode === 'concise'
        ? TABS.filter((t) => ['layer1', 'layer3', 'layer4'].includes(t.id))
        : TABS;

    const renderContent = () => {
        switch (activeTab) {
            case 'layer0':
                return <Layer0Imports imports={result.layer0_imports} />;
            case 'layer1':
                return <Layer1Summary summary={result.layer1_summary} />;
            case 'layer2':
                return <Layer2Journey journey={result.layer2_journey} />;
            case 'layer3':
                return <Layer3Mermaid mermaid={result.layer3_mermaid} />;
            case 'layer4':
                return <Layer4Logic logic={result.layer4_logic} />;
            case 'layer5':
                return <Layer5CodeMap codemap={result.layer5_codemap} />;
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Tab bar */}
            <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-card)] px-4 overflow-x-auto">
                {visibleTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                                    ? 'border-current text-[var(--text-primary)]'
                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                }`}
                            style={{ color: isActive ? tab.color : undefined }}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto p-4 animate-fade-in">
                {renderContent()}
            </div>
        </div>
    );
}
