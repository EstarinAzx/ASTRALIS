// ============================================================================
// Language Select Component
// ============================================================================

import { ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from '../../types/astralis';

interface Props {
    value: string;
    onChange: (value: string) => void;
}

export function LanguageSelect({ value, onChange }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = SUPPORTED_LANGUAGES.find((l) => l.value === value)?.label ?? 'Select Language';

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-primary)]">
                Language
            </label>

            <div ref={ref} className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--color-primary)] transition-colors"
                >
                    <span>{selectedLabel}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl max-h-60 overflow-auto">
                        {SUPPORTED_LANGUAGES.map((lang) => (
                            <button
                                key={lang.value}
                                onClick={() => {
                                    onChange(lang.value);
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center justify-between px-4 py-2 text-left text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            >
                                <span>{lang.label}</span>
                                {value === lang.value && (
                                    <Check className="w-4 h-4 text-[var(--color-primary)]" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Auto-detect indicator */}
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                Auto-detect enabled
            </div>
        </div>
    );
}
