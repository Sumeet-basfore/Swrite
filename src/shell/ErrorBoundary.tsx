import React from 'react';
import { reportError } from '../lib/errors';

interface ErrorBoundaryProps {
  /** Human area name shown in the fallback, e.g. "Planning Studio". */
  name: string;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Isolates render crashes to one studio/view instead of whitescreening
 * the whole app. Files on disk are untouched by a render throw; unsaved
 * editor text is covered by recovery drafts. Parent remounts via `key`
 * on studio/document switch, which clears a stuck boundary automatically.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    reportError(`render:${this.props.name}`, error, { notify: true });
  }

  private retry = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div role="alert" className="swrite-error-fallback">
          <h2>{this.props.name} ran into a problem</h2>
          <p className="swrite-error-message">{error.message || 'Unexpected error while rendering.'}</p>
          <p className="swrite-error-hint">
            Your files on disk are untouched. Any unsaved text is kept in recovery drafts.
          </p>
          <div className="swrite-error-actions">
            <button onClick={this.retry} className="swrite-error-btn primary">
              Try again
            </button>
            <button onClick={() => window.location.reload()} className="swrite-error-btn">
              Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
