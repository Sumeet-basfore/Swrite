import React, { useEffect, useRef } from 'react';
import { calculateEditorStats } from '../core/stats';
import { EditorStats } from '../core/types';

export interface SourceEditorProps {
  initialValue: string;
  onChange: (value: string, stats: EditorStats) => void;
  onSave?: () => void;
  onToggleMode?: () => void;
  readOnly?: boolean;
}

export const SourceEditor: React.FC<SourceEditorProps> = ({
  initialValue,
  onChange,
  onSave,
  onToggleMode,
  readOnly = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current && textareaRef.current.value !== initialValue) {
      textareaRef.current.value = initialValue;
    }
  }, [initialValue]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const stats = calculateEditorStats(text);
    onChange(text, stats);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    // Mod+S to Save
    if (isMod && key === 's') {
      e.preventDefault();
      onSave?.();
      return;
    }

    // Mod+/ or Mod+Shift+M to toggle mode
    if ((isMod && key === '/') || (isMod && e.shiftKey && key === 'm')) {
      e.preventDefault();
      onToggleMode?.();
      return;
    }

    // Tab key indentation support in source mode
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      textarea.value = val.substring(0, start) + '  ' + val.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;

      const stats = calculateEditorStats(textarea.value);
      onChange(textarea.value, stats);
    }
  };

  return (
    <div className="swrite-source-editor-container">
      <div className="swrite-source-banner">
        <span className="source-badge">MARKDOWN SOURCE MODE</span>
        <span className="source-hint">Press Ctrl+/ or Cmd+/ to return to Rich Text Canvas</span>
      </div>
      <textarea
        ref={textareaRef}
        defaultValue={initialValue}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        placeholder="Type or paste Markdown prose here..."
        className="swrite-source-textarea"
        spellCheck="true"
        autoFocus
      />
    </div>
  );
};
