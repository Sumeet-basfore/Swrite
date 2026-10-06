import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { StatusBar } from '../StatusBar';

afterEach(() => {
  cleanup();
});

const baseProps = {
  stats: { wordCount: 1284, charCount: 8360, paragraphCount: 12, readingTimeMinutes: 6 },
  saveStatus: 'clean' as const,
  mode: 'rich' as const,
  focusMode: false,
  readingMode: false,
  currentPreset: 'literary' as const,
  onToggleMode: () => {},
  onToggleFocusMode: () => {},
  onToggleReadingMode: () => {},
  onToggleOutline: () => {},
  onSelectPreset: () => {},
};

describe('StatusBar typewriter lock', () => {
  it('calls onToggleTypewriterLock when Lock is clicked', () => {
    const onToggle = vi.fn();
    render(<StatusBar {...baseProps} typewriterLock={false} onToggleTypewriterLock={onToggle} />);
    fireEvent.click(screen.getByTitle(/typewriter lock/i));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('marks Lock active when the lock is on', () => {
    const onToggle = vi.fn();
    render(<StatusBar {...baseProps} typewriterLock={true} onToggleTypewriterLock={onToggle} />);
    expect(screen.getByTitle(/typewriter lock/i).className).toContain('active');
  });
});
