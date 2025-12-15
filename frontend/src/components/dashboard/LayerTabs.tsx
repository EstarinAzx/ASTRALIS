// ============================================================================
// Layer Tabs Component
// ============================================================================

type LayerKey = 'L0_context' | 'L1_container' | 'L2_component' | 'L3_code' | 'L4_data' | 'L5_infra';

interface Props {
    activeLayer: LayerKey;
    onLayerChange: (layer: LayerKey) => void;
}

const LAYERS = [
    { key: 'L0_context' as LayerKey, label: 'Context', shortLabel: 'L0' },
    { key: 'L1_container' as LayerKey, label: 'Container', shortLabel: 'L1' },
    { key: 'L2_component' as LayerKey, label: 'Component', shortLabel: 'L2' },
    { key: 'L3_code' as LayerKey, label: 'Code', shortLabel: 'L3' },
    { key: 'L4_data' as LayerKey, label: 'Data', shortLabel: 'L4' },
    { key: 'L5_infra' as LayerKey, label: 'Infra', shortLabel: 'L5' },
];

export function LayerTabs({ activeLayer, onLayerChange }: Props) {
    return (
        <div className="px-6 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <div className="flex">
                {LAYERS.map((layer) => {
                    const isActive = activeLayer === layer.key;

                    return (
                        <button
                            key={layer.key}
                            onClick={() => onLayerChange(layer.key)}
                            className={`relative px-6 py-3 text-sm font-medium transition-colors ${isActive
                                    ? 'text-[var(--color-primary)]'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                }`}
                        >
                            <span className="text-xs text-[var(--text-muted)] mr-1">{layer.shortLabel}</span>
                            {layer.label}

                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
