import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DocumentMetadataHeader } from '../canvas/DocumentMetadataHeader';
import { TYPOGRAPHY_PRESETS, getPresetStyleVariables } from '../canvas/typographyPresets';

describe('Manuscript Canvas Containment & Metadata Header', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders DocumentMetadataHeader with key tags without leaking into prose', () => {
    const meta = {
      type: 'chapter_draft',
      series: 'Vaelrion',
      chapter: '1',
      title: 'The Sanctuary of Routine',
      status: 'draft',
      pov: 'Lucan',
      word_count: '1560',
    };

    const rawFm = 'type: chapter_draft\nseries: Vaelrion\npov: Lucan';

    render(<DocumentMetadataHeader metadata={meta} rawFrontmatter={rawFm} />);

    // Renders header bar with metadata title and chips
    expect(screen.getByText('Document Metadata')).toBeTruthy();
    expect(screen.getByText('draft')).toBeTruthy();
    expect(screen.getByText('Lucan')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('Vaelrion')).toBeTruthy();

    // Details drawer is initially collapsed
    expect(screen.queryByText('YAML Frontmatter Source')).toBeNull();

    // Expand details
    const header = screen.getByRole('button', { name: /toggle document metadata drawer/i });
    fireEvent.click(header);

    expect(screen.getByText('YAML Frontmatter Source')).toBeTruthy();
    expect(screen.getByText('word_count:')).toBeTruthy();
    expect(screen.getByText('1560')).toBeTruthy();

    // Collapse again
    fireEvent.click(header);
    expect(screen.queryByText('YAML Frontmatter Source')).toBeNull();
  });

  it('does not render DocumentMetadataHeader when metadata is empty and no frontmatter exists', () => {
    const { container } = render(<DocumentMetadataHeader metadata={{}} rawFrontmatter={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('guarantees typography preset CSS variables establish manuscript measure', () => {
    const literaryVars = getPresetStyleVariables(TYPOGRAPHY_PRESETS.literary);
    expect(literaryVars['--editor-max-width']).toBe('820px');
    expect(literaryVars['--manuscript-page-width']).toBe('820px');
    expect(literaryVars['--editor-font-size']).toBe('18px');

    const classicVars = getPresetStyleVariables(TYPOGRAPHY_PRESETS.classic);
    expect(classicVars['--editor-max-width']).toBe('800px');
    expect(classicVars['--manuscript-page-width']).toBe('800px');
    expect(classicVars['--editor-text-indent']).toBe('1.5em');

    const compactVars = getPresetStyleVariables(TYPOGRAPHY_PRESETS.compact);
    expect(compactVars['--editor-max-width']).toBe('840px');
    expect(compactVars['--manuscript-page-width']).toBe('840px');
    expect(compactVars['--editor-font-size']).toBe('15px');

    const typewriterVars = getPresetStyleVariables(TYPOGRAPHY_PRESETS.typewriter);
    expect(typewriterVars['--editor-max-width']).toBe('800px');
    expect(typewriterVars['--manuscript-page-width']).toBe('800px');
    expect(typewriterVars['--editor-font-family']).toContain('ui-monospace');
  });
});
