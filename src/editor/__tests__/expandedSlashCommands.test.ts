import { describe, it, expect } from 'vitest';
import { SLASH_ACTIONS, filterSlashActions } from '../commands/slashCommands';

describe('Expanded Slash Commands System', () => {
  it('contains all required standard formatting and block commands', () => {
    const requiredCommands = [
      'h1',
      'h2',
      'h3',
      'text',
      'bold',
      'italic',
      'underline',
      'strike',
      'quote',
      'bullet',
      'numbered',
      'checklist',
      'table',
      'image',
      'link',
      'code',
      'divider',
      'scene-break',
      'page-break',
      'note',
      'comment',
      'bookmark',
    ];

    requiredCommands.forEach((cmdId) => {
      const found = SLASH_ACTIONS.find((a) => a.id === cmdId);
      expect(found, `Expected command /${cmdId} to exist`).toBeDefined();
    });
  });

  it('contains author-focused workflow commands', () => {
    const authorCommands = ['scene', 'chapter', 'wordcount', 'find', 'focus', 'reading'];
    authorCommands.forEach((cmdId) => {
      const found = SLASH_ACTIONS.find((a) => a.id === cmdId);
      expect(found, `Expected author workflow command /${cmdId} to exist`).toBeDefined();
    });
  });

  it('filters actions accurately by query string', () => {
    const headingResults = filterSlashActions('heading');
    expect(headingResults.length).toBeGreaterThanOrEqual(3);

    const tableResults = filterSlashActions('/table');
    expect(tableResults.some((a) => a.id === 'table')).toBe(true);

    const bookmarkResults = filterSlashActions('bookmark');
    expect(bookmarkResults.some((a) => a.id === 'bookmark')).toBe(true);
  });
});
