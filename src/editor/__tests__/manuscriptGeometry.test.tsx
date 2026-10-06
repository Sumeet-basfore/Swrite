import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { EditorCanvas } from '../canvas/EditorCanvas';
import { TYPOGRAPHY_PRESETS, getPresetStyleVariables } from '../canvas/typographyPresets';

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

describe('Milestone 15.2: Manuscript Page Layout & Editor Geometry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders dedicated toolbar zone separated from the manuscript page and prose', () => {
    const fixture = `---
type: chapter_draft
title: The Sanctuary of Routine
status: draft
pov: Lucan
---

# The Sanctuary of Routine

The high arch of the sanctuary caught the last rays of amber sunlight.

Lucan placed the iron key upon the wooden lectern.`;

    const { container } = render(
      <EditorCanvas
        documentId="geo-test-1"
        relativePath="Manuscript/Chapter 01.md"
        initialContent={fixture}
      />
    );

    // 1. Verify toolbar is housed in its dedicated non-overlapping zone
    const toolbarZone = container.querySelector('.swrite-editor-toolbar-zone');
    expect(toolbarZone).toBeTruthy();

    const formattingBar = toolbarZone?.querySelector('.swrite-formatting-bar');
    expect(formattingBar).toBeTruthy();

    // 2. Verify scroll viewport sits below the toolbar
    const scrollViewport = container.querySelector('.swrite-scroll-viewport');
    expect(scrollViewport).toBeTruthy();

    // 3. Verify manuscript page resides inside the scroll viewport
    const manuscriptPage = scrollViewport?.querySelector('.swrite-manuscript-page');
    expect(manuscriptPage).toBeTruthy();

    // 4. Verify DocumentMetadataHeader aligns directly at the top of the manuscript page
    const metadataHeader = manuscriptPage?.querySelector('.swrite-document-metadata-card');
    expect(metadataHeader).toBeTruthy();

    // 5. Verify Milkdown editor surface is inside the manuscript page
    const milkdownWrapper = manuscriptPage?.querySelector('.milkdown-wrapper');
    expect(milkdownWrapper).toBeTruthy();
  });

  it('renders complete visual regression fixture with all block and inline elements', () => {
    const fixture = `---
type: chapter_draft
series: Vaelrion
chapter: 1
title: Complete Fixture
status: draft
pov: Lucan
---

# Chapter 1: The Gathering Storm

## Section 1: The Ancient Citadel

### Scene 1: Arrival

The traveler walked along the winding road as shadows stretched across the valley.

This is a **bold text**, an *italicized word*, an <u>underlined term</u>, a ~~struck-through concept~~, and \`inline code\`.

> "The stars never lie, even when the heavens themselves begin to tremble."
> — Ancient Proverb

1. First chronological event
2. Second chronological event
3. Third chronological event

- North Watchtower
- South Gate
- Eastern Harbor

- [ ] Check library archives
- [x] Secure the outer ward perimeter

| Location | Guard Count | Status |
| :--- | :--- | :--- |
| Iron Gate | 12 | Active |
| High Tower | 4 | Relieved |

\`\`\`rust
fn patrol_ward() -> bool {
    let status = "active";
    status == "active"
}
\`\`\`

![Citadel Map](assets/map.png)

Visit the [[Library Archives]] for further investigation.

* * *

---

The night deepened as the silver moons ascended into the sky.`;

    const { container } = render(
      <EditorCanvas
        documentId="geo-fixture"
        relativePath="Manuscript/Fixture.md"
        initialContent={fixture}
      />
    );

    expect(screen.getByText('Document Metadata')).toBeTruthy();
    expect(screen.getByText('draft')).toBeTruthy();
    expect(screen.getByText('Lucan')).toBeTruthy();

    const manuscriptPage = container.querySelector('.swrite-manuscript-page');
    expect(manuscriptPage).toBeTruthy();
  });

  it('verifies all 5 typography presets maintain canonical layout variables', () => {
    Object.values(TYPOGRAPHY_PRESETS).forEach((preset) => {
      const vars = getPresetStyleVariables(preset);
      expect(vars['--manuscript-page-width']).toBeDefined();
      expect(vars['--editor-font-size']).toBeDefined();
      expect(vars['--editor-line-height']).toBeDefined();
      expect(parseInt(vars['--manuscript-page-width'])).toBeGreaterThanOrEqual(800);
    });
  });
});
