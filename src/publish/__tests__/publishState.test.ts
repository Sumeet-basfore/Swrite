import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePublishState } from '../usePublishState';
import { SwriteIpc } from '../../lib/ipc';
import { PublicationProfile } from '../../types/ipc';

vi.mock('../../lib/ipc', () => ({
  SwriteIpc: {
    publishProfilesLoad: vi.fn(),
    publishProfileSave: vi.fn(),
    publishProfileDelete: vi.fn(),
    publishPreflightRun: vi.fn(),
    publishPaginate: vi.fn(),
    publishExport: vi.fn(),
  },
}));

describe('usePublishState', () => {
  const mockProfiles: PublicationProfile[] = [
    {
      id: 'trade-paperback-6x9',
      name: 'Trade Paperback — 6 × 9 in',
      description: 'Standard 6x9 inch digest paperback layout',
      is_builtin: true,
      format: 'pdf',
      page_size: {
        preset: 'trade-6x9',
        width_in: 6.0,
        height_in: 9.0,
      },
      margins: {
        top_in: 0.75,
        bottom_in: 0.75,
        inside_in: 0.875,
        outside_in: 0.625,
      },
      typography: {
        body_font: 'Garamond',
        heading_font: 'Garamond',
        font_size_pt: 11.0,
        line_height: 1.25,
        paragraph_indent_in: 0.25,
        paragraph_spacing_pt: 0.0,
        text_align: 'justify',
      },
      chapter_style: {
        numbering_style: 'words',
        title_case: 'capitalize',
        alignment: 'center',
        spacing_top_pt: 40.0,
        drop_cap: true,
        ornament: '* * *',
      },
      scene_break_style: {
        style: 'asterisms',
        custom_text: '* * *',
      },
      headers_footers: {
        show_header: true,
        show_footer: false,
        left_header: 'author',
        center_header: '',
        right_header: 'book-title',
        left_footer: '',
        center_footer: '',
        right_footer: '',
        suppress_first_page: true,
        odd_even_different: true,
      },
      page_numbering: {
        style: 'arabic',
        start_at: 1,
        position: 'top-outside',
      },
      front_matter: {
        include_title_page: true,
        title: 'The Starlight Chronicle',
        author: 'A. Author',
        publisher: 'Quiet Desk Press',
      },
      back_matter: {
        include_acknowledgements: false,
        include_about_author: false,
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (SwriteIpc.publishProfilesLoad as any).mockResolvedValue({
      custom_profiles: mockProfiles,
      active_profile_id: 'trade-paperback-6x9',
    });

    (SwriteIpc.publishPreflightRun as any).mockResolvedValue({
      passed: true,
      issues: [],
      timestamp: '2026-10-06T12:00:00Z',
    });

    (SwriteIpc.publishPaginate as any).mockResolvedValue({
      total_pages: 12,
      total_words: 2700,
      total_chapters: 2,
      pages: [
        {
          page_number: 1,
          is_recto: true,
          chapter_title: 'Chapter One',
          is_chapter_first_page: true,
          running_header_left: '',
          running_header_right: '',
          running_footer_left: '',
          running_footer_right: '',
          blocks: [
            {
              block_type: 'heading',
              text: 'Chapter One',
              font_size_pt: 18,
              alignment: 'center',
              is_drop_cap: false,
              is_italic: false,
              is_bold: true,
              margin_top_pt: 40,
              margin_bottom_pt: 20,
            },
          ],
        },
      ],
      estimated_spine_width_in: 0.25,
    });

    (SwriteIpc.publishExport as any).mockResolvedValue(
      '/home/sumeet/Documents/writers-tool/Swrite/Export/The_Starlight_Chronicle.pdf'
    );

    (SwriteIpc.publishProfileSave as any).mockResolvedValue({
      custom_profiles: mockProfiles,
      active_profile_id: 'trade-paperback-6x9',
    });
    (SwriteIpc.publishProfileDelete as any).mockResolvedValue({
      custom_profiles: [],
      active_profile_id: '',
    });
  });

  it('loads profiles and paginates on initialization', async () => {
    const { result } = renderHook(() =>
      usePublishState({
        projectRoot: '/test/project',
        projectName: 'My Novel',
      })
    );

    // Initial load
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.profiles.length).toBe(1);
    expect(result.current.activeProfile?.id).toBe('trade-paperback-6x9');
  });

  it('allows selecting different publication profiles', async () => {
    const { result } = renderHook(() =>
      usePublishState({
        projectRoot: '/test/project',
        projectName: 'My Novel',
      })
    );

    await act(async () => {
      await result.current.refresh();
    });

    act(() => {
      result.current.selectProfile('trade-paperback-6x9');
    });

    expect(result.current.activeProfile?.name).toBe('Trade Paperback — 6 × 9 in');
  });

  it('duplicates an existing profile into a customizable copy', async () => {
    const { result } = renderHook(() =>
      usePublishState({
        projectRoot: '/test/project',
        projectName: 'My Novel',
      })
    );

    await act(async () => {
      await result.current.refresh();
    });

    await act(async () => {
      await result.current.duplicateProfile('trade-paperback-6x9', 'Custom Copy');
    });

    expect(SwriteIpc.publishProfileSave).toHaveBeenCalled();
  });

  it('updates profile settings and triggers save', async () => {
    const { result } = renderHook(() =>
      usePublishState({
        projectRoot: '/test/project',
        projectName: 'My Novel',
      })
    );

    await act(async () => {
      await result.current.refresh();
    });

    await act(async () => {
      result.current.updateActiveProfile((profile) => ({
        ...profile,
        typography: {
          ...profile.typography,
          font_size_pt: 12.0,
        },
      }));
    });

    expect(result.current.activeProfile?.typography.font_size_pt).toBe(12.0);
  });

  it('executes publication export successfully', async () => {
    const { result } = renderHook(() =>
      usePublishState({
        projectRoot: '/test/project',
        projectName: 'My Novel',
      })
    );

    await act(async () => {
      await result.current.refresh();
    });

    let exportResult;
    await act(async () => {
      exportResult = await result.current.exportManuscript(
        '/home/sumeet/Documents/writers-tool/Swrite/Export/output.pdf'
      );
    });

    expect(SwriteIpc.publishExport).toHaveBeenCalled();
    expect(exportResult).toBe(
      '/home/sumeet/Documents/writers-tool/Swrite/Export/The_Starlight_Chronicle.pdf'
    );
  });
});
