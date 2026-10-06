import { useState, useEffect, useCallback, useRef } from 'react';
import { SwriteIpc } from '../lib/ipc';
import {
  PaginationResult,
  PreflightCheckResult,
  PublicationProfile,
} from '../types/ipc';
import { PreviewViewMode } from './types';

interface UsePublishStateProps {
  projectRoot: string;
  projectName: string;
}

export function usePublishState({ projectRoot, projectName }: UsePublishStateProps) {
  const [profiles, setProfiles] = useState<PublicationProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<PublicationProfile | null>(null);
  const [pagination, setPagination] = useState<PaginationResult | null>(null);
  const [preflight, setPreflight] = useState<PreflightCheckResult | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<PreviewViewMode>('single');

  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingPagination, setLoadingPagination] = useState(false);
  const [loadingPreflight, setLoadingPreflight] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccessPath, setExportSuccessPath] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load profiles on mount
  const loadProfiles = useCallback(async () => {
    if (!projectRoot) return;
    setLoadingProfiles(true);
    try {
      const data = await SwriteIpc.publishProfilesLoad(projectRoot, projectName || 'Manuscript');
      setProfiles(data.custom_profiles);
      const active = data.custom_profiles.find((p) => p.id === data.active_profile_id) || data.custom_profiles[0] || null;
      setActiveProfile(active);
    } catch (e) {
      console.error('Failed to load publish profiles:', e);
    } finally {
      setLoadingProfiles(false);
    }
  }, [projectRoot, projectName]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // 2. Re-run pagination and preflight when activeProfile changes
  const runPaginationAndPreflight = useCallback(
    async (profile: PublicationProfile) => {
      if (!projectRoot) return;
      setLoadingPagination(true);
      setLoadingPreflight(true);

      try {
        const [pagesResult, preflightResult] = await Promise.all([
          SwriteIpc.publishPaginate(projectRoot, profile),
          SwriteIpc.publishPreflightRun(projectRoot, profile),
        ]);
        setPagination(pagesResult);
        setPreflight(preflightResult);
      } catch (e) {
        console.error('Pagination/Preflight failed:', e);
      } finally {
        setLoadingPagination(false);
        setLoadingPreflight(false);
      }
    },
    [projectRoot]
  );

  useEffect(() => {
    if (!activeProfile) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      runPaginationAndPreflight(activeProfile);
    }, 150);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [activeProfile, runPaginationAndPreflight]);

  // Actions
  const selectProfile = useCallback(
    (profileId: string) => {
      const target = profiles.find((p) => p.id === profileId);
      if (target) {
        setActiveProfile(target);
        setCurrentPageIndex(0);
        SwriteIpc.publishProfileSave(projectRoot, target, true).catch(console.error);
      }
    },
    [profiles, projectRoot]
  );

  const updateActiveProfile = useCallback(
    (updater: (prev: PublicationProfile) => PublicationProfile) => {
      setActiveProfile((prev) => {
        if (!prev) return null;
        const updated = updater(prev);
        // Save if custom
        if (!updated.is_builtin) {
          SwriteIpc.publishProfileSave(projectRoot, updated, true)
            .then((data) => setProfiles(data.custom_profiles))
            .catch(console.error);
        }
        return updated;
      });
    },
    [projectRoot]
  );

  const duplicateProfile = useCallback(
    async (profileId: string, newName: string) => {
      const source = profiles.find((p) => p.id === profileId);
      if (!source) return;

      const newId = `custom_profile_${Date.now()}`;
      const duplicated: PublicationProfile = {
        ...source,
        id: newId,
        name: newName || `${source.name} (Copy)`,
        description: `Custom profile based on ${source.name}`,
        is_builtin: false,
      };

      try {
        const data = await SwriteIpc.publishProfileSave(projectRoot, duplicated, true);
        setProfiles(data.custom_profiles);
        setActiveProfile(duplicated);
        return duplicated;
      } catch (e) {
        console.error('Failed to duplicate profile:', e);
      }
    },
    [profiles, projectRoot]
  );

  const deleteProfile = useCallback(
    async (profileId: string) => {
      try {
        const data = await SwriteIpc.publishProfileDelete(projectRoot, profileId);
        setProfiles(data.custom_profiles);
        const active = data.custom_profiles.find((p) => p.id === data.active_profile_id) || data.custom_profiles[0] || null;
        setActiveProfile(active);
      } catch (e) {
        console.error('Failed to delete profile:', e);
      }
    },
    [projectRoot]
  );

  const exportManuscript = useCallback(
    async (targetPath: string) => {
      if (!activeProfile || !projectRoot) return;
      setExporting(true);
      setExportError(null);
      setExportSuccessPath(null);

      try {
        const result = await SwriteIpc.publishExport(projectRoot, activeProfile, targetPath);
        setExportSuccessPath(result);
        return result;
      } catch (e: any) {
        setExportError(typeof e === 'string' ? e : e?.message || 'Export failed.');
        throw e;
      } finally {
        setExporting(false);
      }
    },
    [activeProfile, projectRoot]
  );

  // Navigation
  const goToNextPage = useCallback(() => {
    if (!pagination) return;
    const step = viewMode === 'spread' ? 2 : 1;
    setCurrentPageIndex((prev) => Math.min(pagination.total_pages - 1, prev + step));
  }, [pagination, viewMode]);

  const goToPrevPage = useCallback(() => {
    const step = viewMode === 'spread' ? 2 : 1;
    setCurrentPageIndex((prev) => Math.max(0, prev - step));
  }, [viewMode]);

  const goToPage = useCallback(
    (index: number) => {
      if (!pagination) return;
      setCurrentPageIndex(Math.max(0, Math.min(pagination.total_pages - 1, index)));
    },
    [pagination]
  );

  return {
    profiles,
    activeProfile,
    pagination,
    preflight,
    currentPageIndex,
    zoomLevel,
    viewMode,
    loadingProfiles,
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
    refresh: loadProfiles,
  };
}
