import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { subscribeErrors, SwriteErrorEvent } from '../lib/errors';

interface Toast extends SwriteErrorEvent {
  key: number;
}

const MAX_TOASTS = 3;
const DISMISS_MS = 8000;

/** User-visible surface for reported failures. Console stays the record; this is the signal. */
export const ErrorToast: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let key = 0;
    return subscribeErrors((e) => {
      const toast = { ...e, key: key++ };
      setToasts((prev) => [...prev.slice(-(MAX_TOASTS - 1)), toast]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.key !== toast.key));
      }, DISMISS_MS);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="swrite-error-toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.key} role="alert" className="swrite-error-toast">
          <div className="swrite-error-toast-body">
            <strong>Something failed to save</strong>
            <span>
              {t.scope}: {t.message}
            </span>
          </div>
          <button
            className="swrite-error-toast-close"
            aria-label="Dismiss error"
            onClick={() => setToasts((prev) => prev.filter((x) => x.key !== t.key))}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
