import React, { useState } from 'react';
import { usePublishState } from './usePublishState';
import { PublishSettingsPanel } from './settings/PublishSettingsPanel';
import { LivePagePreview } from './preview/LivePagePreview';
import { PreflightDrawer } from './preflight/PreflightDrawer';
import { ExportModal } from './export/ExportModal';
import './publish.css';

interface PublishStudioProps {
  projectRoot: string;
  projectName: string;
  onNavigateToDocument?: (path: string) => void;
}

export const PublishStudio: React.FC<PublishStudioProps> = ({
  projectRoot,
  projectName,
  onNavigateToDocument,
}) => {
  const {
    profiles,
    activeProfile,
    pagination,
    preflight,
    currentPageIndex,
    zoomLevel,
    viewMode,
    loadingPagination,
    loadingPreflight,
    exporting,
    exportSuccessPath,
    exportError,
    setZoomLevel,
    setViewMode,
    selectProfile,
    updateActiveProfile,
    duplicateProfile,
    deleteProfile,
    exportManuscript,
    goToNextPage,
    goToPrevPage,
    goToPage,
  } = usePublishState({ projectRoot, projectName });

  const [showPreflightDrawer, setShowPreflightDrawer] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <div className="publish-studio-root">
      {/* Left Settings Sidebar */}
      <PublishSettingsPanel
        profiles={profiles}
        activeProfile={activeProfile}
        preflight={preflight}
        onSelectProfile={selectProfile}
        onUpdateProfile={updateActiveProfile}
        onDuplicateProfile={duplicateProfile}
        onDeleteProfile={deleteProfile}
        onOpenPreflight={() => setShowPreflightDrawer(true)}
        onOpenExport={() => setShowExportModal(true)}
      />

      {/* Center / Right Live Preview Surface */}
      <main className="publish-studio-preview-area">
        <LivePagePreview
          profile={activeProfile}
          pagination={pagination}
          loading={loadingPagination}
          currentPageIndex={currentPageIndex}
          zoomLevel={zoomLevel}
          viewMode={viewMode}
          onNextPage={goToNextPage}
          onPrevPage={goToPrevPage}
          onGoToPage={goToPage}
          onZoomChange={setZoomLevel}
          onViewModeChange={setViewMode}
        />
      </main>

      {/* Preflight Verification Drawer */}
      {showPreflightDrawer && (
        <div className="revision-modal-overlay" onClick={() => setShowPreflightDrawer(false)}>
          <div className="preflight-modal-wrapper" onClick={(e) => e.stopPropagation()}>
            <PreflightDrawer
              preflight={preflight}
              loading={loadingPreflight}
              onNavigateToDocument={onNavigateToDocument}
              onClose={() => setShowPreflightDrawer(false)}
            />
          </div>
        </div>
      )}

      {/* Export Confirmation Modal */}
      {showExportModal && activeProfile && (
        <ExportModal
          profile={activeProfile}
          projectRoot={projectRoot}
          projectName={projectName}
          pagination={pagination}
          preflight={preflight}
          exporting={exporting}
          exportSuccessPath={exportSuccessPath}
          exportError={exportError}
          onExport={exportManuscript}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};
