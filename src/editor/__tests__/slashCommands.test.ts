import { describe, it, expect } from 'vitest';
import { filterSlashActions, SLASH_ACTIONS } from '../commands/slashCommands';

describe('Slash Commands Menu', () => {
  it('returns all actions on empty query', () => {
    const actions = filterSlashActions('');
    expect(actions.length).toBe(SLASH_ACTIONS.length);
  });

  it('filters actions by title or keyword', () => {
    const headingActions = filterSlashActions('heading');
    expect(headingActions.length).toBeGreaterThanOrEqual(3);
    expect(headingActions.some((a) => a.id === 'h1')).toBe(true);

    const sceneActions = filterSlashActions('scene');
    expect(sceneActions.some((a) => a.id === 'scene_break')).toBe(true);

    const listActions = filterSlashActions('list');
    expect(listActions.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty array when no action matches', () => {
    const actions = filterSlashActions('nonexistent_action_xyz');
    expect(actions.length).toBe(0);
  });
});
