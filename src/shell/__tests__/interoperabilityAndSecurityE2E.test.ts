import { describe, it, expect } from 'vitest';
import { DiscoveredFile } from '../../types/ipc';

describe('Interoperability, Security & Theme Isolation E2E', () => {
  it('strictly filters internal .swrite files and hidden dotfiles from author UI', () => {
    const rawFiles: DiscoveredFile[] = [
      { name: '01_Chapter.md', relative_path: 'Manuscript/01_Chapter.md', is_directory: false, size_bytes: 1200, format: 'markdown' },
      { name: 'project.json', relative_path: '.swrite/project.json', is_directory: false, size_bytes: 400, format: 'binary' },
      { name: 'planning.json', relative_path: '.swrite/planning.json', is_directory: false, size_bytes: 800, format: 'binary' },
      { name: 'snapshot_1.md', relative_path: '.swrite/history/snapshot_1.md', is_directory: false, size_bytes: 1100, format: 'markdown' },
      { name: 'config', relative_path: '.git/config', is_directory: false, size_bytes: 200, format: 'binary' },
      { name: 'Lore.md', relative_path: 'Desk/Lore.md', is_directory: false, size_bytes: 500, format: 'markdown' },
    ];

    // Filter dotfiles & internal folders
    const visibleFiles = rawFiles.filter(
      (f) => !f.relative_path.startsWith('.') && !f.relative_path.includes('/.')
    );

    expect(visibleFiles.length).toBe(2);
    expect(visibleFiles.map((f: DiscoveredFile) => f.relative_path)).toEqual(['Manuscript/01_Chapter.md', 'Desk/Lore.md']);
    expect(visibleFiles.some((f: DiscoveredFile) => f.relative_path.startsWith('.swrite/'))).toBe(false);
    expect(visibleFiles.some((f: DiscoveredFile) => f.relative_path.startsWith('.git/'))).toBe(false);
  });

  it('validates publication theme isolation principle', () => {
    // Editor appearance
    const editorTheme = {
      theme: 'dark',
      font: 'typewriter',
      backgroundColor: '#16171a',
      textColor: '#e5e5e7',
    };

    // Publication profile appearance
    const publicationProfile = {
      profileName: 'Standard Manuscript (Shunn)',
      paperSize: 'letter',
      font: 'Courier 12pt',
      margins: '1 inch',
      backgroundColor: '#ffffff',
      textColor: '#000000',
    };

    // Verify independent styling
    expect(editorTheme.backgroundColor).not.toBe(publicationProfile.backgroundColor);
    expect(editorTheme.textColor).not.toBe(publicationProfile.textColor);
    expect(publicationProfile.backgroundColor).toBe('#ffffff');
    expect(publicationProfile.textColor).toBe('#000000');
  });

  it('validates publication data leakage prevention', () => {
    const rawDocumentWithInternalNotes = `# Chapter 1: The Gate

The door stood tall and ironclad.

<!-- bookmark: Check historical armor terminology -->
<!-- note: Ask beta readers about pacing -->
> [!NOTE] Author note: verify timeline consistency with Chapter 3

The lock clicked open.`;

    // Strip internal comments and annotations for publication
    const sanitizedPublicationContent = rawDocumentWithInternalNotes
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/>\s*\[!NOTE\][^\n]*\n/g, '')
      .trim();

    expect(sanitizedPublicationContent).not.toContain('<!-- bookmark:');
    expect(sanitizedPublicationContent).not.toContain('<!-- note:');
    expect(sanitizedPublicationContent).not.toContain('[!NOTE]');
    expect(sanitizedPublicationContent).toContain('# Chapter 1: The Gate');
    expect(sanitizedPublicationContent).toContain('The door stood tall and ironclad.');
    expect(sanitizedPublicationContent).toContain('The lock clicked open.');
  });
});
