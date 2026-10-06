import { describe, it, expect } from 'vitest';
import { DiscoveredFile } from '../../types/ipc';
import { DESK_TEMPLATES } from '../templates';

describe('Creative Desk Categorization & Templates', () => {
  const sampleFiles: DiscoveredFile[] = [
    {
      relative_path: 'Desk/Characters/Lucan.md',
      name: 'Lucan.md',
      is_directory: false,
      format: 'markdown',
      size_bytes: 1200,
    },
    {
      relative_path: 'Desk/Locations/Black River.md',
      name: 'Black River.md',
      is_directory: false,
      format: 'markdown',
      size_bytes: 800,
    },
    {
      relative_path: 'Desk/World/Magic System.md',
      name: 'Magic System.md',
      is_directory: false,
      format: 'markdown',
      size_bytes: 1500,
    },
    {
      relative_path: 'Desk/Research/Medieval Armor.md',
      name: 'Medieval Armor.md',
      is_directory: false,
      format: 'markdown',
      size_bytes: 3000,
    },
    {
      relative_path: 'Desk/Moodboards/Castle Atmosphere/board.json',
      name: 'board.json',
      is_directory: false,
      format: 'txt',
      size_bytes: 600,
    },
    {
      relative_path: 'Desk/Notes/Quick Scratch.md',
      name: 'Quick Scratch.md',
      is_directory: false,
      format: 'markdown',
      size_bytes: 400,
    },
  ];

  it('correctly categorizes files by desk folder convention', () => {
    const categorize = (file: DiscoveredFile) => {
      const p = file.relative_path.toLowerCase();
      if (p.includes('/characters/')) return 'characters';
      if (p.includes('/locations/')) return 'locations';
      if (p.includes('/world/')) return 'world';
      if (p.includes('/research/')) return 'research';
      if (p.includes('/moodboards/') || file.name.endsWith('board.json')) return 'moodboards';
      return 'notes';
    };

    expect(categorize(sampleFiles[0])).toBe('characters');
    expect(categorize(sampleFiles[1])).toBe('locations');
    expect(categorize(sampleFiles[2])).toBe('world');
    expect(categorize(sampleFiles[3])).toBe('research');
    expect(categorize(sampleFiles[4])).toBe('moodboards');
    expect(categorize(sampleFiles[5])).toBe('notes');
  });

  it('generates clean template Markdown for new documents', () => {
    const charTemplate = DESK_TEMPLATES.character.templateContent('Lord Rowan');
    expect(charTemplate).toContain('# Lord Rowan');
    expect(charTemplate).toContain('## Appearance');
    expect(charTemplate).toContain('## Personality & Motivation');

    const locTemplate = DESK_TEMPLATES.location.templateContent('The Iron Citadel');
    expect(locTemplate).toContain('# The Iron Citadel');
    expect(locTemplate).toContain('## Overview & Atmosphere');

    const resTemplate = DESK_TEMPLATES.research.templateContent('Siege Engines');
    expect(resTemplate).toContain('# Siege Engines');
    expect(resTemplate).toContain('## Key Facts & Discoveries');
  });
});
