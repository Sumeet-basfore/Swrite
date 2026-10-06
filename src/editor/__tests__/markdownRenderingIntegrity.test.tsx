import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EditorCanvas } from '../canvas/EditorCanvas';

// Mock milkdown editor instance for fast component-level testing
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

describe('Markdown Rendering Integrity & Mode Switching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('separates frontmatter from manuscript body and displays metadata header', async () => {
    const initialContent = `---
type: chapter_draft
series: Vaelrion
chapter: 1
title: The Sanctuary of Routine
status: draft
pov: Lucan
---

# The Sanctuary of Routine

The lantern flickered on the desk as the wind stirred.`;

    const onContentChange = vi.fn();

    render(
      <EditorCanvas
        documentId="doc-1"
        relativePath="Manuscript/Chapter 01.md"
        initialContent={initialContent}
        onContentChange={onContentChange}
      />
    );

    // Frontmatter appears in metadata card, not as raw prose
    expect(screen.getByText('Document Metadata')).toBeTruthy();
    expect(screen.getByText('draft')).toBeTruthy();
    expect(screen.getByText('Lucan')).toBeTruthy();

    // Toggle to Source mode
    const sourceBtn = screen.getByTitle(/toggle markdown source mode/i);
    fireEvent.click(sourceBtn);

    // In Source mode, full frontmatter is displayed in textarea
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toContain('---');
    expect(textarea.value).toContain('type: chapter_draft');
    expect(textarea.value).toContain('# The Sanctuary of Routine');

    // Edit in source mode
    fireEvent.change(textarea, {
      target: {
        value: `---
type: chapter_draft
series: Vaelrion
chapter: 1
title: The Sanctuary of Routine
status: revised
pov: Kael
---

# The Sanctuary of Routine

Kael looked through the ancient window.`,
      },
    });

    // Toggle back to Rich mode
    fireEvent.click(sourceBtn);

    // Metadata card reflects updated frontmatter
    expect(screen.getByText('Kael')).toBeTruthy();
    expect(screen.getByText('revised')).toBeTruthy();
  });

  it('preserves clean markdown without frontmatter across mode switching', async () => {
    const initialContent = `# Chapter Two\n\nPure prose without any YAML frontmatter header.`;

    render(
      <EditorCanvas
        documentId="doc-2"
        relativePath="Manuscript/Chapter 02.md"
        initialContent={initialContent}
      />
    );

    // No metadata card rendered
    expect(screen.queryByText('Document Metadata')).toBeNull();

    // Toggle to Source mode
    const sourceBtn = screen.getByTitle(/toggle markdown source mode/i);
    fireEvent.click(sourceBtn);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe(initialContent);

    // Toggle back to Rich mode
    fireEvent.click(sourceBtn);
    expect(screen.queryByText('Document Metadata')).toBeNull();
  });

  it('renders reading mode with clean body prose only', async () => {
    const initialContent = `---
title: Secret Title
status: draft
---

First paragraph of story.

Second paragraph of story.`;

    render(
      <EditorCanvas
        documentId="doc-3"
        relativePath="Manuscript/Chapter 03.md"
        initialContent={initialContent}
      />
    );

    // Toggle reading mode
    const readingBtn = screen.getByTitle(/toggle reading mode/i);
    fireEvent.click(readingBtn);

    expect(screen.getByText('Reading Mode')).toBeTruthy();
    expect(screen.getByText('First paragraph of story.')).toBeTruthy();
    expect(screen.getByText('Second paragraph of story.')).toBeTruthy();
    expect(screen.queryByText('title: Secret Title')).toBeNull();
  });
});
