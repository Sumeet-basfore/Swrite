import React from 'react';
import { Bookmark, Sparkles, Heading1, Heading2, Heading3, X } from 'lucide-react';

export interface OutlineItem {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'scene' | 'bookmark';
  title: string;
  line: number;
}

export function parseDocumentOutline(markdown: string): OutlineItem[] {
  const lines = markdown.split('\n');
  const items: OutlineItem[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // H1
    if (trimmed.startsWith('# ')) {
      items.push({
        id: `h1-${index}`,
        type: 'h1',
        title: trimmed.replace(/^#\s+/, ''),
        line: index + 1,
      });
    }
    // H2
    else if (trimmed.startsWith('## ')) {
      items.push({
        id: `h2-${index}`,
        type: 'h2',
        title: trimmed.replace(/^##\s+/, ''),
        line: index + 1,
      });
    }
    // H3
    else if (trimmed.startsWith('### ')) {
      items.push({
        id: `h3-${index}`,
        type: 'h3',
        title: trimmed.replace(/^###\s+/, ''),
        line: index + 1,
      });
    }
    // Scene Break
    else if (trimmed === '* * *' || trimmed === '***' || trimmed === '✦  ✦  ✦' || trimmed === '✦ ✦ ✦') {
      items.push({
        id: `scene-${index}`,
        type: 'scene',
        title: `Scene Break (Line ${index + 1})`,
        line: index + 1,
      });
    }
    // Bookmark
    else if (trimmed.startsWith('<!-- bookmark:') && trimmed.endsWith('-->')) {
      const label = trimmed.replace(/^<!--\s*bookmark:\s*/, '').replace(/\s*-->$/, '');
      items.push({
        id: `bookmark-${index}`,
        type: 'bookmark',
        title: label || 'Bookmark',
        line: index + 1,
      });
    }
  });

  return items;
}

export interface DocumentOutlineProps {
  markdown: string;
  onSelectLine: (line: number) => void;
  onClose: () => void;
}

export const DocumentOutline: React.FC<DocumentOutlineProps> = ({
  markdown,
  onSelectLine,
  onClose,
}) => {
  const outlineItems = parseDocumentOutline(markdown);

  return (
    <div className="swrite-document-outline-drawer">
      <div className="outline-header">
        <span className="outline-title">Document Outline & Bookmarks</span>
        <button className="outline-close-btn" onClick={onClose} title="Close outline">
          <X size={14} />
        </button>
      </div>

      <div className="outline-list">
        {outlineItems.length === 0 ? (
          <div className="outline-empty">
            No headings, scene breaks, or bookmarks found in this document.
          </div>
        ) : (
          outlineItems.map((item) => (
            <button
              key={item.id}
              className={`outline-item outline-${item.type}`}
              onClick={() => onSelectLine(item.line)}
            >
              <span className="outline-item-icon">
                {item.type === 'h1' && <Heading1 size={14} />}
                {item.type === 'h2' && <Heading2 size={13} />}
                {item.type === 'h3' && <Heading3 size={12} />}
                {item.type === 'scene' && <Sparkles size={12} />}
                {item.type === 'bookmark' && <Bookmark size={12} className="text-amber-500" />}
              </span>
              <span className="outline-item-text">{item.title}</span>
              <span className="outline-item-line">L{item.line}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
