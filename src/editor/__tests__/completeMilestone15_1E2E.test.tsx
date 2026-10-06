import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EditorCanvas } from '../canvas/EditorCanvas';
import { extractFrontmatter } from '../core/frontmatter';

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

describe('Milestone 15.1: Complete Author Journey & Canvas Containment E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('executes full frontmatter lifecycle, mode switching, and lossless roundtrip', async () => {
    const rawDocument = `---
type: chapter_draft
series: Vaelrion
act: 1
arc: 1
chapter: 1
title: The Sanctuary of Routine
status: draft
pov: Lucan
word_count: 1560
---

# The Sanctuary of Routine

The lantern flickered softly against the stone wall.

* * *

Lucan turned the heavy brass key in the lock.`;

    const savedUpdates: string[] = [];
    const handleContentChange = (md: string) => {
      savedUpdates.push(md);
    };

    render(
      <EditorCanvas
        documentId="doc-e2e-1"
        relativePath="Manuscript/Chapter 01.md"
        initialContent={rawDocument}
        onContentChange={handleContentChange}
      />
    );

    // 1. Verify frontmatter is extracted and rendered in the metadata card
    expect(screen.getByText('Document Metadata')).toBeTruthy();
    expect(screen.getByText('draft')).toBeTruthy();
    expect(screen.getByText('Lucan')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();

    // 2. Toggle to Source Editor
    const modeBtn = screen.getByTitle(/toggle markdown source mode/i);
    fireEvent.click(modeBtn);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toContain('type: chapter_draft');
    expect(textarea.value).toContain('# The Sanctuary of Routine');
    expect(textarea.value).toContain('* * *');

    // 3. Edit both metadata and body in Source Editor
    const updatedSource = `---
type: chapter_draft
series: Vaelrion
act: 1
arc: 1
chapter: 1
title: The Sanctuary of Routine
status: revised
pov: Lucan
word_count: 1620
---

# The Sanctuary of Routine

The lantern flickered softly against the ancient stone wall.

* * *

Lucan turned the heavy brass key in the lock, and the door creaked open.`;

    fireEvent.change(textarea, { target: { value: updatedSource } });

    // 4. Switch back to Rich mode
    fireEvent.click(modeBtn);

    // 5. Verify updated metadata card reflects changes
    expect(screen.getByText('revised')).toBeTruthy();

    // 6. Verify last updated document is lossless
    const lastContent = savedUpdates[savedUpdates.length - 1];
    expect(lastContent).toBe(updatedSource);

    const parsed = extractFrontmatter(lastContent);
    expect(parsed.metadata.status).toBe('revised');
    expect(parsed.body).toContain('the door creaked open.');
  });

  it('verifies canvas containment with overflow stress document', async () => {
    const stressDocument = `---
title: Stress Test
---

# Canvas Containment Stress Test

Very long unbroken URL:
https://example.com/a/very/long/unbreakable/path/with/lots/of/nested/directories/and/parameters?query=stress_test_value&token=abcdef1234567890abcdef1234567890

Very long unbroken word:
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

| Column 1 With Long Header | Column 2 Wide Header | Column 3 Data Header |
| :--- | :--- | :--- |
| UnbreakableContentInTableCell1111111111111111111111111111111111111111 | Second cell description text | Third cell data |

\`\`\`rust
fn main() {
    let very_long_variable_name_that_spans_across_a_very_wide_terminal_column_without_breaking = "hello_world_containment";
}
\`\`\`

![Wide Landscape Test Image](assets/cover.png)
`;

    const parsed = extractFrontmatter(stressDocument);
    expect(parsed.frontmatter).toBe('title: Stress Test');
    expect(parsed.body).toContain('https://example.com');
    expect(parsed.body).toContain('aaaaaaaaaaaaaaaaaaaa');
    expect(parsed.body).toContain('Column 1 With Long Header');
    expect(parsed.body).toContain('very_long_variable_name');

    render(
      <EditorCanvas
        documentId="doc-stress"
        relativePath="Manuscript/StressTest.md"
        initialContent={stressDocument}
      />
    );

    expect(screen.getByText('Document Metadata')).toBeTruthy();
  });
});
