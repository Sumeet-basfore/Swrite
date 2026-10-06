import React, { useState, useEffect } from 'react';
import { DiscoveredFile } from '../types/ipc';
import { EditStudioTab } from './types';
import { ReviewQueueView } from './review/ReviewQueueView';
import { CommentsView } from './comments/CommentsView';
import { RevisionsView } from './revisions/RevisionsView';
import { HistoryView } from './history/HistoryView';
import { FindReplaceModal } from './findreplace/FindReplaceModal';
import './edit.css';

interface EditStudioProps {
  currentDocumentPath: string | null;
  manuscriptFiles: DiscoveredFile[];
  onNavigateToDocument: (filePath: string, startOffset?: number, endOffset?: number) => void;
  onSelectDocument: (filePath: string) => void;
}

export const EditStudio: React.FC<EditStudioProps> = ({
  currentDocumentPath,
  manuscriptFiles,
  onNavigateToDocument,
  onSelectDocument,
}) => {
  const [activeTab, setActiveTab] = useState<EditStudioTab>('review');
  const [showFindReplace, setShowFindReplace] = useState(false);

  // Global hotkey Mod+F to open Find/Replace modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowFindReplace((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="edit-studio-root">
      {/* Studio Sub-Header */}
      <header className="edit-studio-header">
        <div className="edit-studio-nav-tabs">
          <button
            type="button"
            className={`edit-studio-tab ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            Review Queue
          </button>
          <button
            type="button"
            className={`edit-studio-tab ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            Comments
          </button>
          <button
            type="button"
            className={`edit-studio-tab ${activeTab === 'revisions' ? 'active' : ''}`}
            onClick={() => setActiveTab('revisions')}
          >
            Revisions
          </button>
          <button
            type="button"
            className={`edit-studio-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History & Diffs
          </button>
        </div>

        <div className="edit-studio-actions">
          <button
            type="button"
            className="edit-find-replace-trigger-btn"
            onClick={() => setShowFindReplace(true)}
            title="Open Find & Replace (Mod+F)"
          >
            🔍 Find & Replace
          </button>
        </div>
      </header>

      {/* Main Studio View Area */}
      <main className="edit-studio-main">
        {activeTab === 'review' && (
          <ReviewQueueView
            currentDocumentPath={currentDocumentPath}
            manuscriptFiles={manuscriptFiles}
            onNavigateToPassage={onNavigateToDocument}
          />
        )}

        {activeTab === 'comments' && (
          <CommentsView
            currentDocumentPath={currentDocumentPath}
            onNavigateToPassage={onNavigateToDocument}
          />
        )}

        {activeTab === 'revisions' && (
          <RevisionsView
            currentDocumentPath={currentDocumentPath}
            onNavigateToPassage={onNavigateToDocument}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            currentDocumentPath={currentDocumentPath}
            manuscriptFiles={manuscriptFiles}
            onSelectDocument={onSelectDocument}
          />
        )}
      </main>

      {/* Find & Replace Modal */}
      {showFindReplace && (
        <FindReplaceModal
          currentDocumentPath={currentDocumentPath}
          manuscriptFiles={manuscriptFiles}
          onClose={() => setShowFindReplace(false)}
          onNavigateToPassage={onNavigateToDocument}
        />
      )}
    </div>
  );
};
