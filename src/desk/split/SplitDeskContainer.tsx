import React, { useState } from 'react';
import { EditorCanvas } from '../../editor';
import { MoodboardCanvas } from '../moodboard/MoodboardCanvas';
import { DiscoveredFile } from '../../types/ipc';
import { X, Maximize2, Minimize2 } from 'lucide-react';

export interface SplitDeskContainerProps {
  primaryDocumentPath: string;
  primaryFileContent: string;
  secondaryDocumentPath: string;
  secondaryFileContent: string;
  projectAssets: DiscoveredFile[];
  onCloseSplit: () => void;
  onOpenDocument: (relativePath: string) => void;
  onRefreshFiles: () => Promise<void>;
}

export const SplitDeskContainer: React.FC<SplitDeskContainerProps> = ({
  primaryDocumentPath,
  primaryFileContent,
  secondaryDocumentPath,
  secondaryFileContent,
  projectAssets,
  onCloseSplit,
  onOpenDocument,
  onRefreshFiles,
}) => {
  const [splitRatio, setSplitRatio] = useState<number>(50); // 50% / 50%
  const isSecondaryMoodboard =
    secondaryDocumentPath.endsWith('board.json') ||
    secondaryDocumentPath.includes('/Moodboards/');

  const handleRatioChange = (ratio: number) => {
    setSplitRatio(Math.min(75, Math.max(25, ratio)));
  };

  return (
    <div className="swrite-split-container">
      {/* Primary Pane: Manuscript */}
      <div
        className="split-pane pane-primary"
        style={{ width: `${splitRatio}%` }}
      >
        <div className="split-pane-header">
          <span className="pane-label">MANUSCRIPT: {primaryDocumentPath.split('/').pop()}</span>
        </div>
        <div className="split-pane-body">
          <EditorCanvas
            key={primaryDocumentPath}
            documentId={primaryDocumentPath}
            relativePath={primaryDocumentPath}
            initialContent={primaryFileContent}
          />
        </div>
      </div>

      {/* Split Divider Handle */}
      <div
        className="split-divider-handle"
        onMouseDown={(e) => {
          const startX = e.clientX;
          const initialRatio = splitRatio;
          const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const containerWidth = window.innerWidth;
            const deltaPercent = (deltaX / containerWidth) * 100;
            handleRatioChange(initialRatio + deltaPercent);
          };
          const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
          };
          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
        }}
      />

      {/* Secondary Pane: Desk Document or Moodboard */}
      <div
        className="split-pane pane-secondary"
        style={{ width: `${100 - splitRatio}%` }}
      >
        <div className="split-pane-header secondary-header">
          <span className="pane-label">
            SUPPORTING: {secondaryDocumentPath.split('/').pop()}
          </span>
          <div className="pane-header-actions">
            <button
              className="pane-btn"
              onClick={() => handleRatioChange(splitRatio === 50 ? 30 : 50)}
              title="Toggle Pane Width"
            >
              {splitRatio === 50 ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
            </button>
            <button
              className="pane-btn close"
              onClick={onCloseSplit}
              title="Close Split View"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="split-pane-body">
          {isSecondaryMoodboard ? (
            <MoodboardCanvas
              boardPath={secondaryDocumentPath}
              projectAssets={projectAssets}
              onOpenDocument={onOpenDocument}
              onBackToDesk={onCloseSplit}
              onRefreshFiles={onRefreshFiles}
            />
          ) : (
            <EditorCanvas
              key={secondaryDocumentPath}
              documentId={secondaryDocumentPath}
              relativePath={secondaryDocumentPath}
              initialContent={secondaryFileContent}
            />
          )}
        </div>
      </div>
    </div>
  );
};
