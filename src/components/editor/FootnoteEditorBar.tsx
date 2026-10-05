import React from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { Bookmark, X, Plus, Trash2, ArrowUpRight } from 'lucide-react';
import { FootnoteItem } from '../../types/editorEnhancements';

interface FootnoteEditorBarProps {
  sceneId: string;
}

export const FootnoteEditorBar: React.FC<FootnoteEditorBarProps> = ({ sceneId }) => {
  const { 
    project, activeFootnoteId, setActiveFootnoteId, setIsFootnoteDrawerOpen,
    addFootnote, updateFootnote, deleteFootnote
  } = useSwriteStore();

  const theme = project.metadata.theme;
  const footnotes = (project.footnotes || []).filter(f => f.sceneId === sceneId);

  return (
    <div 
      className="border-t shadow-2xl flex flex-col max-h-56 select-none transition-all duration-200"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.borderStrong
      }}
    >
      {/* Header */}
      <div 
        className="px-4 py-2 flex items-center justify-between border-b text-xs"
        style={{
          backgroundColor: theme.colors.elevatedSurface,
          borderColor: theme.colors.border
        }}
      >
        <div className="flex items-center gap-2">
          <Bookmark className="w-3.5 h-3.5" style={{ color: theme.colors.accent }} />
          <span className="font-bold uppercase tracking-wider text-[11px]" style={{ color: theme.colors.text }}>
            Footnotes & Endnotes ({footnotes.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => addFootnote(sceneId, '')}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.colors.accent, color: '#fff' }}
          >
            <Plus className="w-3 h-3" />
            Add Note
          </button>
          <button
            onClick={() => setIsFootnoteDrawerOpen(false)}
            className="p-1 rounded hover:opacity-80"
            style={{ color: theme.colors.textMuted }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Footnotes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {footnotes.length === 0 ? (
          <div className="py-4 text-center text-xs" style={{ color: theme.colors.textMuted }}>
            No footnotes in this scene. Click <strong>Add Note</strong> or insert <code>[^1]</code> in your manuscript.
          </div>
        ) : (
          footnotes.map(fn => {
            const isActive = activeFootnoteId === fn.id;

            return (
              <div
                key={fn.id}
                onClick={() => setActiveFootnoteId(fn.id)}
                className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all ${
                  isActive ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: theme.colors.elevatedSurface,
                  borderColor: isActive ? theme.colors.accent : theme.colors.border
                }}
              >
                {/* Number Badge */}
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5"
                  style={{ backgroundColor: theme.colors.accent, color: '#fff' }}
                >
                  {fn.number}
                </div>

                {/* Editable Text */}
                <textarea
                  value={fn.text}
                  onChange={(e) => updateFootnote(fn.id, e.target.value)}
                  placeholder="Enter footnote / citation text..."
                  rows={2}
                  className="flex-1 text-xs bg-transparent border-none p-0 focus:outline-none resize-none leading-relaxed"
                  style={{ color: theme.colors.text }}
                />

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFootnote(fn.id);
                  }}
                  className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Delete Footnote"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
