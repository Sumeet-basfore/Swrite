import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { SlashDropdown } from '../SlashDropdown';

afterEach(() => {
  cleanup();
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fakeView = {} as any;

describe('SlashDropdown placement', () => {
  it('opens below the cursor when there is room', () => {
    const view = render(
      <SlashDropdown
        view={fakeView}
        query=""
        position={{ top: 100, bottom: 120, left: 100 }}
        onClose={() => {}}
      />
    );
    const menu = view.container.querySelector('.swrite-slash-dropdown') as HTMLElement;
    // 120 (bottom) + 6 (gap)
    expect(menu.style.top).toBe('126px');
    expect(menu.style.left).toBe('100px');
  });

  it('flips above the cursor near the viewport bottom instead of clipping', () => {
    const view = render(
      <SlashDropdown
        view={fakeView}
        query=""
        position={{ top: 730, bottom: 750, left: 100 }}
        onClose={() => {}}
      />
    );
    const menu = view.container.querySelector('.swrite-slash-dropdown') as HTMLElement;
    const top = parseFloat(menu.style.top);
    // Must sit above the cursor line, inside the viewport — never below it.
    expect(top).toBeLessThan(730);
    expect(top).toBeGreaterThanOrEqual(8);
  });

  it('clamps horizontally near the viewport edge', () => {
    const view = render(
      <SlashDropdown
        view={fakeView}
        query=""
        position={{ top: 100, bottom: 120, left: 2000 }}
        onClose={() => {}}
      />
    );
    const menu = view.container.querySelector('.swrite-slash-dropdown') as HTMLElement;
    // jsdom innerWidth 1024 - 300 menu - 8 margin = 716
    expect(menu.style.left).toBe('716px');
  });
});
