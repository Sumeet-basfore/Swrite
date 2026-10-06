import React, { useState } from 'react';
import { Tag, ChevronDown, ChevronRight, FileText } from 'lucide-react';

export interface DocumentMetadataHeaderProps {
  metadata: Record<string, string>;
  rawFrontmatter?: string | null;
}

export const DocumentMetadataHeader: React.FC<DocumentMetadataHeaderProps> = ({
  metadata,
  rawFrontmatter,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const keys = Object.keys(metadata);
  if (keys.length === 0 && !rawFrontmatter) return null;

  return (
    <div className="swrite-document-metadata-card">
      <div
        className="metadata-card-header"
        onClick={() => setIsExpanded((prev) => !prev)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Toggle document metadata drawer"
      >
        <div className="metadata-header-left">
          <Tag size={13} className="metadata-icon" />
          <span className="metadata-title">Document Metadata</span>
          {metadata.status && (
            <span className={`metadata-badge status-${metadata.status.toLowerCase()}`}>
              {metadata.status}
            </span>
          )}
          {metadata.pov && (
            <span className="metadata-chip">
              <strong>POV:</strong> {metadata.pov}
            </span>
          )}
          {metadata.chapter && (
            <span className="metadata-chip">
              <strong>Ch:</strong> {metadata.chapter}
            </span>
          )}
          {metadata.series && (
            <span className="metadata-chip">
              <strong>Series:</strong> {metadata.series}
            </span>
          )}
        </div>

        <div className="metadata-header-right">
          <span className="metadata-toggle-text">
            {isExpanded ? 'Hide' : 'Details'}
          </span>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {isExpanded && (
        <div className="metadata-card-body">
          <div className="metadata-grid">
            {keys.map((key) => (
              <div key={key} className="metadata-grid-row">
                <span className="metadata-key">{key}:</span>
                <span className="metadata-val">{metadata[key]}</span>
              </div>
            ))}
          </div>
          {rawFrontmatter && (
            <div className="metadata-source-preview">
              <div className="source-preview-label">
                <FileText size={11} /> YAML Frontmatter Source
              </div>
              <pre className="metadata-raw-block">
                <code>{rawFrontmatter}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
