import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../useTheme';
import { ThemePickerModal } from '../ThemePickerModal';

afterEach(() => {
  cleanup();
});

function Harness({ open }: { open: boolean }) {
  return (
    <ThemeProvider>
      <ThemePickerModal isOpen={open} onClose={() => {}} />
    </ThemeProvider>
  );
}

describe('ThemePickerModal', () => {
  it('opens after being mounted closed (hook-order regression)', () => {
    // This exact closed -> open transition on one tree used to throw
    // "Rendered more hooks than during the previous render" and blank-screen.
    const view = render(<Harness open={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();

    view.rerender(<Harness open={true} />);
    expect(view.getByRole('dialog')).toBeTruthy();
    // All 29 theme cards render under mood-group headers
    expect(view.container.querySelectorAll('[data-theme-id]').length).toBe(29);
    expect(view.getByText('Studio Essentials')).toBeTruthy();
  });

  it('filters by search without crashing', () => {
    const view = render(<Harness open={true} />);
    const input = view.container.querySelector('.theme-search-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'oxblood' } });
    expect(view.container.querySelectorAll('[data-theme-id]').length).toBe(1);
  });
});
