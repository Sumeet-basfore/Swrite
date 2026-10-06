import {
  PaginationResult,
  PreflightCheckResult,
  PublicationProfile,
} from '../types/ipc';

export type SettingsSection =
  | 'profile'
  | 'page'
  | 'typography'
  | 'chapter_style'
  | 'headers_footers'
  | 'front_back_matter'
  | 'advanced';

export type PreviewViewMode = 'single' | 'spread';

export interface PublishState {
  profiles: PublicationProfile[];
  activeProfile: PublicationProfile | null;
  pagination: PaginationResult | null;
  preflight: PreflightCheckResult | null;
  currentPageIndex: number;
  zoomLevel: number;
  viewMode: PreviewViewMode;
  loadingProfiles: boolean;
  loadingPagination: boolean;
  loadingPreflight: boolean;
  exporting: boolean;
  exportSuccessPath: string | null;
  exportError: string | null;
}
