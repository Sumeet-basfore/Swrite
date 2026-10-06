import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Bomb(): React.ReactNode {
  throw new Error('render exploded');
}

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary name="Test Studio">
        <span>healthy content</span>
      </ErrorBoundary>
    );
    expect(screen.getByText('healthy content')).toBeTruthy();
  });

  it('catches a render throw and shows the fallback with studio name', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary name="Planning Studio">
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Planning Studio ran into a problem')).toBeTruthy();
    expect(screen.getByText('render exploded')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
    expect(screen.getByText('Reload app')).toBeTruthy();
  });

  it('retry clears the fallback', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let explode = true;
    const Flaky = () => {
      if (explode) throw new Error('once');
      return <span>recovered</span>;
    };
    render(
      <ErrorBoundary name="Desk">
        <Flaky />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    explode = false;
    fireEvent.click(screen.getByText('Try again'));
    expect(screen.getByText('recovered')).toBeTruthy();
  });
});
