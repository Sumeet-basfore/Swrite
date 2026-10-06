import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SwriteIpc } from '../../lib/ipc';
import {
  ProjectSummary,
  OutlinePlanningData,
  TimelineData,
  MoodboardData,
  CommentsData,
  PreflightCheckResult,
  PublicationProfile,
} from '../../types/ipc';

describe('Complete Author Journey E2E Integration Suite', () => {
  const projectRoot = '/home/sumeet/Documents/writers-tool/Swrite/test-projects/Chronomancer_RC';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('executes full end-to-end author journey across all five studios', async () => {
    // 1. Create / Initialize Project
    const projectSummary: ProjectSummary = {
      project_id: 'proj-1',
      name: 'The Chronomancer Saga',
      root_path: projectRoot,
      manifest: {
        schema_version: 1,
        project_id: 'proj-1',
        name: 'The Chronomancer Saga',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        document_identities: {},
        metadata: {},
      },
      file_counts: {
        manuscript_count: 1,
        planning_count: 1,
        desk_count: 1,
        asset_count: 1,
      },
    };

    vi.spyOn(SwriteIpc, 'projectOpen').mockResolvedValue(projectSummary);
    const opened = await SwriteIpc.projectOpen(projectRoot);
    expect(opened.name).toBe('The Chronomancer Saga');

    // 2. Create Manuscript Chapter & Scene
    vi.spyOn(SwriteIpc, 'fileCreate').mockResolvedValue('Manuscript/01_Chapter_1.md');
    const chapterPath = await SwriteIpc.fileCreate('Manuscript/01_Chapter_1.md', 'document');
    expect(chapterPath).toBe('Manuscript/01_Chapter_1.md');

    // 3. Write & Save Prose
    const draftProse = `# Chapter 1: The Chronomancer's Clock

The grandfather clock in the study ticked backward, its bronze hands slicing against time.

* * *

<!-- bookmark: Revisit antagonist dialogue -->

A shadow detached itself from the doorway.`;

    vi.spyOn(SwriteIpc, 'fileWrite').mockResolvedValue();
    vi.spyOn(SwriteIpc, 'fileRead').mockResolvedValue(draftProse);

    await SwriteIpc.fileWrite(chapterPath, draftProse);
    const readBack = await SwriteIpc.fileRead(chapterPath);
    expect(readBack).toContain('# Chapter 1');
    expect(readBack).toContain('<!-- bookmark: Revisit antagonist dialogue -->');

    // 4. Planning Studio: Outline & Timeline
    const outlineData: OutlinePlanningData = {
      items: [
        {
          relative_path: chapterPath,
          title: 'The Backward Clock',
          summary: 'The protagonist discovers temporal anomalies in the study.',
          status: 'Drafted',
          custom_order: 1,
        },
      ],
    };

    const timelineData: TimelineData = {
      events: [
        {
          id: 'event-1',
          title: 'Clock anomaly',
          temporal_position: 'Day 1, 23:59',
          description: 'Clock starts ticking backward',
          linked_scene: chapterPath,
          notes: 'Important turning point',
          order_index: 1,
        },
      ],
    };

    vi.spyOn(SwriteIpc, 'outlineMetaSave').mockResolvedValue();
    vi.spyOn(SwriteIpc, 'outlineMetaLoad').mockResolvedValue(outlineData);
    vi.spyOn(SwriteIpc, 'timelineSave').mockResolvedValue();
    vi.spyOn(SwriteIpc, 'timelineLoad').mockResolvedValue(timelineData);

    await SwriteIpc.outlineMetaSave(outlineData);
    const plan = await SwriteIpc.outlineMetaLoad();
    expect(plan.items[0].title).toBe('The Backward Clock');

    await SwriteIpc.timelineSave(timelineData);
    const timeline = await SwriteIpc.timelineLoad();
    expect(timeline.events[0].temporal_position).toBe('Day 1, 23:59');

    // 5. Creative Desk: Character Lore & Moodboard
    const deskNote = `# Lord Malakor

- Role: Temporal Weaver
- Eye color: Quicksilver
- Weakness: Temporal anchor severance`;

    const deskPath = 'Desk/Characters/Malakor.md';
    await SwriteIpc.fileWrite(deskPath, deskNote);

    const moodboardData: MoodboardData = {
      id: 'mb-citadel',
      name: 'Obsidian Citadel Aesthetics',
      updated_at: Date.now(),
      canvas: {
        pan_x: 0,
        pan_y: 0,
        zoom: 1,
      },
      items: [
        {
          type: 'image',
          id: 'item-1',
          asset_path: 'Assets/spire.png',
          x: 100,
          y: 150,
          width: 300,
          height: 200,
          z_index: 1,
          caption: 'Spire entrance',
        },
      ],
    };

    vi.spyOn(SwriteIpc, 'moodboardSave').mockResolvedValue();
    vi.spyOn(SwriteIpc, 'moodboardLoad').mockResolvedValue(moodboardData);

    await SwriteIpc.moodboardSave('mb-citadel', moodboardData);
    const mb = await SwriteIpc.moodboardLoad('mb-citadel');
    expect(mb.items.length).toBe(1);

    // 6. Edit Studio: Comments & Proofreading
    const commentsData: CommentsData = {
      comments: [
        {
          id: 'c-1',
          anchor: {
            document_id: 'doc-1',
            relative_path: chapterPath,
            start_offset: 10,
            end_offset: 50,
            exact_text: 'A shadow detached itself from the doorway.',
            prefix_context: 'time.',
            suffix_context: '',
          },
          content: 'Check pacing here; introduce the sound of footsteps first.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'open',
          replies: [],
        },
      ],
    };

    vi.spyOn(SwriteIpc, 'commentsSave').mockResolvedValue();
    vi.spyOn(SwriteIpc, 'commentsLoad').mockResolvedValue(commentsData);

    await SwriteIpc.commentsSave(commentsData);
    const comments = await SwriteIpc.commentsLoad();
    expect(comments.comments.length).toBe(1);
    expect(comments.comments[0].status).toBe('open');

    // 7. Publish Studio: Preflight & Multi-Format Export
    const mockProfile: PublicationProfile = {
      id: 'standard_manuscript',
      name: 'Standard Manuscript (Shunn)',
      description: 'Shunn standard format',
      is_builtin: true,
      format: 'pdf',
      page_size: {
        width_in: 8.5,
        height_in: 11.0,
        preset: 'Letter',
      },
      margins: {
        top_in: 1.0,
        bottom_in: 1.0,
        inside_in: 1.0,
        outside_in: 1.0,
      },
      typography: {
        body_font: 'Courier',
        heading_font: 'Courier',
        font_size_pt: 12,
        line_height: 2.0,
        paragraph_indent_in: 0.5,
        paragraph_spacing_pt: 0,
        text_align: 'left',
      },
      chapter_style: {
        numbering_style: 'Numeric',
        title_case: 'Uppercase',
        alignment: 'center',
        spacing_top_pt: 72,
        drop_cap: false,
      },
      scene_break_style: {
        style: 'Asterisks',
        custom_text: '#',
      },
      headers_footers: {
        show_header: true,
        show_footer: false,
        left_header: '',
        center_header: '',
        right_header: 'AUTHOR / NOVEL',
        left_footer: '',
        center_footer: '',
        right_footer: '',
        suppress_first_page: true,
        odd_even_different: false,
      },
      page_numbering: {
        style: 'Arabic',
        start_at: 1,
        position: 'top_right',
      },
      front_matter: {
        include_title_page: true,
        title: 'The Chronomancer Saga',
        author: 'Jane Author',
      },
      back_matter: {
        include_acknowledgements: false,
        include_about_author: false,
      },
    };

    const preflightResult: PreflightCheckResult = {
      is_valid: true,
      chapters_checked: 1,
      images_checked: 1,
      links_checked: 0,
      issues: [],
      blocking_count: 0,
      warning_count: 0,
      info_count: 0,
    };

    vi.spyOn(SwriteIpc, 'publishPreflightRun').mockResolvedValue(preflightResult);
    const preflight = await SwriteIpc.publishPreflightRun(projectRoot, mockProfile);
    expect(preflight.is_valid).toBe(true);

    vi.spyOn(SwriteIpc, 'publishExport').mockResolvedValue('dist/The_Chronomancer_Saga.pdf');
    const exportResult = await SwriteIpc.publishExport(projectRoot, mockProfile, 'dist/The_Chronomancer_Saga.pdf');
    expect(exportResult).toContain('.pdf');

    // 8. Project Reload & Continuation
    const reloaded = await SwriteIpc.projectOpen(projectRoot);
    expect(reloaded.root_path).toBe(projectRoot);
  });
});
