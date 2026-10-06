import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EditorCanvas } from '../canvas/EditorCanvas';
import { TYPOGRAPHY_PRESETS, getPresetStyleVariables } from '../canvas/typographyPresets';

vi.mock('../../lib/ipc', () => {
  return {
    SwriteIpc: {
      saveDraft: vi.fn().mockResolvedValue(true),
      clearDraft: vi.fn().mockResolvedValue(true),
      fileWrite: vi.fn().mockResolvedValue(true),
      fileRead: vi.fn().mockResolvedValue(''),
    },
  };
});

vi.mock('../core/createEditor', () => {
  return {
    createSwriteEditor: vi.fn().mockImplementation(async ({ initialMarkdown, callbacks }) => {
      let currentMd = initialMarkdown;
      return {
        editor: {},
        getMarkdown: () => currentMd,
        setMarkdown: (md: string) => {
          currentMd = md;
          callbacks?.onChange?.(md, {
            characters: md.length,
            charactersNoSpaces: md.replace(/\s+/g, '').length,
            words: md.trim().split(/\s+/).filter(Boolean).length,
            paragraphs: md.split(/\n+/).filter(Boolean).length,
            readingTimeMinutes: 1,
          });
        },
        getView: () => null,
        destroy: vi.fn().mockResolvedValue(undefined),
        focus: vi.fn(),
      };
    }),
  };
});

describe('Milestone 15.2: Manuscript Page Layout & Editor Geometry E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('verifies canonical layout hierarchy and toolbar docking separation', () => {
    const rawDocument = `---
title: Chapter 1: The Gathering
author: S. Author
---

# Chapter 1: The Gathering

The dawn broke cold and grey over the northern ridges.`;

    const { container } = render(
      <EditorCanvas
        documentId="doc-geom-e2e"
        relativePath="Manuscript/Chapter 01.md"
        initialContent={rawDocument}
      />
    );

    // Verify root editor container
    const editorContainer = container.querySelector('.swrite-editor-container');
    expect(editorContainer).toBeTruthy();

    // Verify dedicated toolbar zone exists and contains formatting bar
    const toolbarZone = container.querySelector('.swrite-editor-toolbar-zone');
    expect(toolbarZone).toBeTruthy();
    const formattingBar = toolbarZone?.querySelector('.swrite-formatting-bar');
    expect(formattingBar).toBeTruthy();

    // Verify scroll viewport is outside and below the toolbar zone
    const scrollViewport = container.querySelector('.swrite-scroll-viewport');
    expect(scrollViewport).toBeTruthy();
    expect(toolbarZone?.contains(scrollViewport)).toBe(false);
    expect(scrollViewport?.contains(toolbarZone)).toBe(false);

    // Verify manuscript page is inside scroll viewport
    const manuscriptPage = scrollViewport?.querySelector('.swrite-manuscript-page');
    expect(manuscriptPage).toBeTruthy();

    // Verify metadata card and prose content are contained in the manuscript page
    const metadataCard = manuscriptPage?.querySelector('.swrite-document-metadata-card');
    expect(metadataCard).toBeTruthy();
    const milkdownWrapper = manuscriptPage?.querySelector('.milkdown-wrapper');
    expect(milkdownWrapper).toBeTruthy();
  });

  it('verifies all typography presets establish canonical page measures (800-840px)', () => {
    Object.values(TYPOGRAPHY_PRESETS).forEach((preset) => {
      const vars = getPresetStyleVariables(preset);
      const widthVal = parseInt(vars['--manuscript-page-width'], 10);
      expect(widthVal).toBeGreaterThanOrEqual(800);
      expect(widthVal).toBeLessThanOrEqual(840);
      expect(vars['--editor-max-width']).toBe(`${preset.maxWidth}px`);
    });
  });

  it('preserves geometry and single alignment system across Rich and Source modes', () => {
    const rawDocument = `---
status: draft
chapter: 1
---

# Title of Chapter

This is the opening paragraph of the manuscript.`;

    const { container } = render(
      <EditorCanvas
        documentId="doc-modes"
        relativePath="Manuscript/Chapter 01.md"
        initialContent={rawDocument}
      />
    );

    // Rich mode verification
    let manuscriptPage = container.querySelector('.swrite-manuscript-page');
    expect(manuscriptPage).toBeTruthy();
    expect(container.querySelector('.milkdown-wrapper')).toBeTruthy();

    // Switch to Source mode
    const modeBtn = screen.getByTitle(/toggle markdown source mode/i);
    fireEvent.click(modeBtn);

    // Source mode should be contained in the scroll viewport
    const scrollViewport = container.querySelector('.swrite-scroll-viewport');
    const sourceEditor = container.querySelector('.swrite-source-editor-container');
    expect(sourceEditor).toBeTruthy();
    expect(scrollViewport?.contains(sourceEditor)).toBe(true);

    // Switch back to Rich mode
    fireEvent.click(modeBtn);
    expect(container.querySelector('.milkdown-wrapper')).toBeTruthy();
  });

  it('maintains layout consistency during document editing and saving', () => {
    const rawDocument = `# Prologue\n\nNight fell over the quiet valley.`;
    const savedUpdates: string[] = [];

    const { container } = render(
      <EditorCanvas
        documentId="doc-save"
        relativePath="Manuscript/Prologue.md"
        initialContent={rawDocument}
        onContentChange={(md) => savedUpdates.push(md)}
      />
    );

    // Switch to source mode to simulate edit
    const modeBtn = screen.getByTitle(/toggle markdown source mode/i);
    fireEvent.click(modeBtn);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, {
      target: { value: '# Prologue\n\nNight fell softly over the quiet valley.' },
    });

    expect(savedUpdates.length).toBeGreaterThan(0);
    expect(savedUpdates[savedUpdates.length - 1]).toContain('softly over the quiet valley');

    // In Source mode, formatting toolbar is hidden and source editor is mounted
    expect(container.querySelector('.swrite-source-editor-container')).toBeTruthy();
    expect(container.querySelector('.swrite-scroll-viewport')).toBeTruthy();

    // Switch back to Rich mode -> toolbar zone reappears
    fireEvent.click(modeBtn);
    expect(container.querySelector('.swrite-editor-toolbar-zone')).toBeTruthy();
    expect(container.querySelector('.swrite-manuscript-page')).toBeTruthy();
  });
});
