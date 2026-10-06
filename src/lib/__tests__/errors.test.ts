import { describe, it, expect, vi, afterEach } from 'vitest';
import { reportError, subscribeErrors, SWRITE_ERROR_EVENT } from '../../lib/errors';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('reportError', () => {
  it('always writes to the console', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    reportError('test-scope', new Error('boom'));
    expect(spy).toHaveBeenCalledWith('[Swrite:test-scope]', expect.any(Error));
  });

  it('stringifies non-Error values and returns the message', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(reportError('s', 'plain failure')).toBe('plain failure');
    expect(reportError('s', new Error('err!'))).toBe('err!');
  });

  it('dispatches swrite:error only when notify is set', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const seen: string[] = [];
    const unsub = subscribeErrors((e) => seen.push(e.scope));

    reportError('silent-scope', new Error('x'));
    expect(seen).toEqual([]);

    reportError('loud-scope', new Error('y'), { notify: true });
    expect(seen).toEqual(['loud-scope']);

    unsub();
    reportError('loud-scope', new Error('z'), { notify: true });
    expect(seen).toEqual(['loud-scope']);
  });

  it('uses the swrite:error event name', () => {
    expect(SWRITE_ERROR_EVENT).toBe('swrite:error');
  });
});
