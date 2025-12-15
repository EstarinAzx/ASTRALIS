// ============================================================================
// Project Tree Component - Folder Drop & File Browser
// ============================================================================

import { useState, useCallback } from 'react';
import {
    FolderOpen,
    File,
    ChevronRight,
    ChevronDown,
    Upload,
    Code2,
} from 'lucide-react';
import type { FileNode } from '../../types/project';
import { CODE_EXTENSIONS, IGNORED_PATTERNS } from '../../types/project';

interface Props {
    tree: FileNode[];
    selectedFile: FileNode | null;
    onFilesDropped: (files: FileNode[]) => void;
    onFileSelect: (file: FileNode) => void;
}

export function ProjectTree({
    tree,
    selectedFile,
    onFilesDropped,
    onFileSelect,
}: Props) {
    const [isDragging, setIsDragging] = useState(false);

    // ============================================================================
    // File System Processing
    // ============================================================================
    const processFileEntry = async (
        entry: FileSystemEntry,
        path: string
    ): Promise<FileNode | null> => {
        const name = entry.name;
        const fullPath = path ? `${path}/${name}` : name;

        // Check if ignored
        if (IGNORED_PATTERNS.some((pattern) => name === pattern || name.startsWith('.'))) {
            return null;
        }

        if (entry.isFile) {
            const fileEntry = entry as FileSystemFileEntry;
            const file = await new Promise<File>((resolve) =>
                fileEntry.file(resolve)
            );

            const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
            const language = CODE_EXTENSIONS[ext];
            const visualizable = !!language;

            // Read content for code files
            let content: string | undefined;
            if (visualizable) {
                content = await file.text();
            }

            return {
                id: crypto.randomUUID(),
                name,
                path: fullPath,
                type: 'file',
                language,
                visualizable,
                content,
            };
        }

        if (entry.isDirectory) {
            const dirEntry = entry as FileSystemDirectoryEntry;
            const reader = dirEntry.createReader();

            const entries = await new Promise<FileSystemEntry[]>((resolve) => {
                const allEntries: FileSystemEntry[] = [];
                const readEntries = () => {
                    reader.readEntries((entries) => {
                        if (entries.length === 0) {
                            resolve(allEntries);
                        } else {
                            allEntries.push(...entries);
                            readEntries();
                        }
                    });
                };
                readEntries();
            });

            const children = (
                await Promise.all(entries.map((e) => processFileEntry(e, fullPath)))
            ).filter(Boolean) as FileNode[];

            // Sort: folders first, then alphabetically
            children.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
                return a.name.localeCompare(b.name);
            });

            return {
                id: crypto.randomUUID(),
                name,
                path: fullPath,
                type: 'folder',
                visualizable: false,
                children,
            };
        }

        return null;
    };

    // ============================================================================
    // Drag & Drop Handlers
    // ============================================================================
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const items = e.dataTransfer.items;
            const entries: FileSystemEntry[] = [];

            for (let i = 0; i < items.length; i++) {
                const entry = items[i].webkitGetAsEntry();
                if (entry) entries.push(entry);
            }

            const nodes = (
                await Promise.all(entries.map((e) => processFileEntry(e, '')))
            ).filter(Boolean) as FileNode[];

            nodes.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
                return a.name.localeCompare(b.name);
            });

            onFilesDropped(nodes);
        },
        [onFilesDropped]
    );

    // ============================================================================
    // Render
    // ============================================================================
    return (
        <div
            className="h-full flex flex-col"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-color)]">
                <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-[var(--color-accent)]" />
                    Project Explorer
                </h2>
            </div>

            {/* Tree or Drop Zone */}
            <div className="flex-1 overflow-auto p-2">
                {tree.length === 0 ? (
                    <div
                        className={`h-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-colors ${isDragging
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                                : 'border-[var(--border-color)]'
                            }`}
                    >
                        <Upload
                            className={`w-12 h-12 mb-4 ${isDragging ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'
                                }`}
                        />
                        <p className="text-[var(--text-secondary)] text-sm text-center px-4">
                            Drag & drop a project folder here
                        </p>
                        <p className="text-[var(--text-muted)] text-xs mt-2">
                            or click to browse
                        </p>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {tree.map((node) => (
                            <TreeNode
                                key={node.id}
                                node={node}
                                selectedFile={selectedFile}
                                onSelect={onFileSelect}
                                depth={0}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Tree Node Component
// ============================================================================
interface TreeNodeProps {
    node: FileNode;
    selectedFile: FileNode | null;
    onSelect: (file: FileNode) => void;
    depth: number;
}

function TreeNode({ node, selectedFile, onSelect, depth }: TreeNodeProps) {
    const [isExpanded, setIsExpanded] = useState(depth < 2);
    const isFolder = node.type === 'folder';
    const isSelected = selectedFile?.id === node.id;

    const handleClick = () => {
        if (isFolder) {
            setIsExpanded(!isExpanded);
        } else {
            onSelect(node);
        }
    };

    return (
        <div>
            <button
                onClick={handleClick}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left ${isSelected
                        ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                    } ${!node.visualizable && !isFolder ? 'opacity-50' : ''}`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
                {/* Chevron or spacer */}
                {isFolder ? (
                    isExpanded ? (
                        <ChevronDown className="w-4 h-4 shrink-0" />
                    ) : (
                        <ChevronRight className="w-4 h-4 shrink-0" />
                    )
                ) : (
                    <span className="w-4" />
                )}

                {/* Icon */}
                {isFolder ? (
                    <FolderOpen className="w-4 h-4 shrink-0 text-[var(--color-warning)]" />
                ) : node.visualizable ? (
                    <Code2 className="w-4 h-4 shrink-0 text-[var(--color-accent)]" />
                ) : (
                    <File className="w-4 h-4 shrink-0" />
                )}

                {/* Name */}
                <span className="truncate">{node.name}</span>

                {/* Language badge */}
                {node.language && (
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                        {node.language}
                    </span>
                )}
            </button>

            {/* Children */}
            {isFolder && isExpanded && node.children && (
                <div>
                    {node.children.map((child) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            selectedFile={selectedFile}
                            onSelect={onSelect}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
