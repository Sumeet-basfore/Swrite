/**
 * Central error reporting for Swrite.
 *
 * Every failure is still written to the console (and the in-app IPC log
 * where one exists), but user-facing failures additionally dispatch a
 * `swrite:error` window event that the shell toast listens for — so a
 * failed persist no longer looks identical to success.
 *
 * Background best-effort work (recents, UI state, watcher start) should
 * call this WITHOUT `notify` so it stays console-only.
 */
export interface SwriteErrorEvent {
  scope: string;
  message: string;
  at: number;
}

export const SWRITE_ERROR_EVENT = 'swrite:error';

export function reportError(scope: string, err: unknown, opts?: { notify?: boolean }): string {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[Swrite:${scope}]`, err);
  if (opts?.notify) {
    const detail: SwriteErrorEvent = { scope, message, at: Date.now() };
    window.dispatchEvent(new CustomEvent<SwriteErrorEvent>(SWRITE_ERROR_EVENT, { detail }));
  }
  return message;
}

export function subscribeErrors(fn: (e: SwriteErrorEvent) => void): () => void {
  const handler = (ev: Event) => {
    fn((ev as CustomEvent<SwriteErrorEvent>).detail);
  };
  window.addEventListener(SWRITE_ERROR_EVENT, handler);
  return () => window.removeEventListener(SWRITE_ERROR_EVENT, handler);
}
