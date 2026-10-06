import { describe, it, expect } from 'vitest';
import {
  SHORTCUT_REGISTRY,
  isTypingField,
} from '../shortcuts/shortcutRegistry';

describe('Shortcut Registry & Safety', () => {
  it('registers all essential formatting shortcuts', () => {
    const bold = SHORTCUT_REGISTRY.find((s) => s.id === 'bold');
    const italic = SHORTCUT_REGISTRY.find((s) => s.id === 'italic');
    const underline = SHORTCUT_REGISTRY.find((s) => s.id === 'underline');
    const strike = SHORTCUT_REGISTRY.find((s) => s.id === 'strikethrough');

    expect(bold?.keys).toBe('Mod+B');
    expect(italic?.keys).toBe('Mod+I');
    expect(underline?.keys).toBe('Mod+U');
    expect(strike?.keys).toBe('Mod+Shift+X');
  });

  it('registers all studio navigation shortcuts', () => {
    const write = SHORTCUT_REGISTRY.find((s) => s.id === 'studio_write');
    const plan = SHORTCUT_REGISTRY.find((s) => s.id === 'studio_plan');
    const desk = SHORTCUT_REGISTRY.find((s) => s.id === 'studio_desk');
    const edit = SHORTCUT_REGISTRY.find((s) => s.id === 'studio_edit');
    const publish = SHORTCUT_REGISTRY.find((s) => s.id === 'studio_publish');

    expect(write?.keys).toBe('Mod+1');
    expect(plan?.keys).toBe('Mod+2');
    expect(desk?.keys).toBe('Mod+3');
    expect(edit?.keys).toBe('Mod+4');
    expect(publish?.keys).toBe('Mod+5');
  });

  it('correctly detects typing targets for shortcut safety', () => {
    const input = document.createElement('input');
    input.type = 'text';

    const textarea = document.createElement('textarea');

    const select = document.createElement('select');

    const div = document.createElement('div');

    const editorDiv = document.createElement('div');
    editorDiv.classList.add('ProseMirror');
    editorDiv.contentEditable = 'true';

    expect(isTypingField(input)).toBe(true);
    expect(isTypingField(textarea)).toBe(true);
    expect(isTypingField(select)).toBe(true);
    expect(isTypingField(div)).toBe(false);
    expect(isTypingField(editorDiv)).toBe(false); // ProseMirror handles its own shortcuts
  });
});
