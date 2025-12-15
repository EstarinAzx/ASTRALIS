// ============================================================================
// Dashboard Page - Main App Layout
// ============================================================================

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';
import { ProjectTree } from '../components/project/ProjectTree';
import { AnalysisView } from '../components/analysis/AnalysisView';
import type { FileNode } from '../types/project';

export function DashboardPage() {
    const { user } = useAuth();
    const [projectTree, setProjectTree] = useState<FileNode[]>([]);
    const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);

    const handleFilesDropped = (files: FileNode[]) => {
        setProjectTree(files);
        setSelectedFile(null);
    };

    const handleFileSelect = (file: FileNode) => {
        if (file.type === 'file' && file.visualizable) {
            setSelectedFile(file);
        }
    };

    return (
        <div className="min-h-screen flex bg-[var(--bg-primary)]">
            {/* Sidebar */}
            <Sidebar user={user} />

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Project Tree Panel */}
                <div className="w-80 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col">
                    <ProjectTree
                        tree={projectTree}
                        selectedFile={selectedFile}
                        onFilesDropped={handleFilesDropped}
                        onFileSelect={handleFileSelect}
                    />
                </div>

                {/* Analysis Panel */}
                <div className="flex-1 overflow-hidden">
                    <AnalysisView selectedFile={selectedFile} />
                </div>
            </div>
        </div>
    );
}
