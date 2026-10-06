import React from 'react';
import { PaginationResult, PublicationProfile, RenderedPage } from '../../types/ipc';
import { PreviewViewMode } from '../types';

interface LivePagePreviewProps {
  profile: PublicationProfile | null;
  pagination: PaginationResult | null;
  loading: boolean;
  currentPageIndex: number;
  zoomLevel: number;
  viewMode: PreviewViewMode;
  onNextPage: () => void;
  onPrevPage: () => void;
  onGoToPage: (pageIndex: number) => void;
  onZoomChange: (zoom: number) => void;
  onViewModeChange: (mode: PreviewViewMode) => void;
}

export const LivePagePreview: React.FC<LivePagePreviewProps> = ({
  profile,
  pagination,
  loading,
  currentPageIndex,
  zoomLevel,
  viewMode,
  onNextPage,
  onPrevPage,
  onGoToPage,
  onZoomChange,
  onViewModeChange,
}) => {
  if (!profile) {
    return (
      <div className="publish-preview-empty">
        <p>Select or create a publication profile to begin typesetting.</p>
      </div>
    );
  }

  const totalPages = pagination?.total_pages || 0;
  const pageA = pagination?.pages[currentPageIndex];
  const pageB = viewMode === 'spread' && currentPageIndex + 1 < totalPages
    ? pagination?.pages[currentPageIndex + 1]
    : null;

  const renderPageSheet = (page: RenderedPage) => {
    // Convert point dimensions to CSS pixels with zoom
    const widthPx = page.width_pt * 1.333 * zoomLevel;
    const heightPx = page.height_pt * 1.333 * zoomLevel;
    const padTopPx = page.margin_top_pt * 1.333 * zoomLevel;
    const padBottomPx = page.margin_bottom_pt * 1.333 * zoomLevel;
    const padLeftPx = page.margin_left_pt * 1.333 * zoomLevel;
    const padRightPx = page.margin_right_pt * 1.333 * zoomLevel;

    const fontScale = zoomLevel;
    const bodyFontFamily = profile.typography.body_font || 'Garamond, serif';
    const bodyFontSize = profile.typography.font_size_pt * 1.333 * fontScale;
    const lineHeight = profile.typography.line_height;
    const textAlign = profile.typography.text_align === 'justify' ? 'justify' : 'left';
    const indentPx = profile.typography.paragraph_indent_in * 72 * 1.333 * fontScale;

    return (
      <div
        key={page.page_number}
        className="publish-paper-sheet"
        style={{
          width: `${widthPx}px`,
          height: `${heightPx}px`,
          paddingTop: `${padTopPx}px`,
          paddingBottom: `${padBottomPx}px`,
          paddingLeft: `${padLeftPx}px`,
          paddingRight: `${padRightPx}px`,
          fontFamily: bodyFontFamily,
        }}
      >
        {/* Running Header */}
        {!page.is_front_matter && profile.headers_footers.show_header && (
          <header
            className="sheet-header"
            style={{
              top: `${padTopPx * 0.4}px`,
              left: `${padLeftPx}px`,
              right: `${padRightPx}px`,
              fontSize: `${bodyFontSize * 0.75}px`,
            }}
          >
            <span className="sheet-header-left">{page.header_left}</span>
            <span className="sheet-header-center">{page.header_center}</span>
            <span className="sheet-header-right">{page.header_right}</span>
          </header>
        )}

        {/* Page Content Stream */}
        <div className="sheet-content-flow">
          {page.blocks.map((block, bIdx) => {
            switch (block.type) {
              case 'title_page':
                return (
                  <div key={bIdx} className="sheet-title-page-block">
                    <h1
                      className="sheet-book-title"
                      style={{
                        fontFamily: profile.typography.heading_font || bodyFontFamily,
                        fontSize: `${bodyFontSize * 2.2}px`,
                      }}
                    >
                      {block.title}
                    </h1>
                    {block.subtitle && (
                      <p className="sheet-book-subtitle" style={{ fontSize: `${bodyFontSize * 1.2}px` }}>
                        {block.subtitle}
                      </p>
                    )}
                    <div className="sheet-book-author" style={{ fontSize: `${bodyFontSize * 1.3}px` }}>
                      {block.author}
                    </div>
                    {block.edition && (
                      <div className="sheet-book-edition" style={{ fontSize: `${bodyFontSize * 0.85}px` }}>
                        {block.edition}
                      </div>
                    )}
                  </div>
                );

              case 'copyright_page':
                return (
                  <div
                    key={bIdx}
                    className="sheet-copyright-block"
                    style={{ fontSize: `${bodyFontSize * 0.75}px` }}
                  >
                    {block.text.split('\n').map((l, lIdx) => (
                      <p key={lIdx}>{l}</p>
                    ))}
                  </div>
                );

              case 'dedication_page':
                return (
                  <div
                    key={bIdx}
                    className="sheet-dedication-block"
                    style={{ fontSize: `${bodyFontSize * 0.95}px` }}
                  >
                    <em>{block.text}</em>
                  </div>
                );

              case 'epigraph_page':
                return (
                  <div
                    key={bIdx}
                    className="sheet-epigraph-block"
                    style={{ fontSize: `${bodyFontSize * 0.9}px` }}
                  >
                    <p>{block.text}</p>
                  </div>
                );

              case 'chapter_title':
                return (
                  <div
                    key={bIdx}
                    className={`sheet-chapter-title-block align-${profile.chapter_style.alignment}`}
                    style={{
                      paddingTop: `${profile.chapter_style.spacing_top_pt * 1.333 * fontScale}px`,
                      textAlign: (profile.chapter_style.alignment as any) || 'center',
                    }}
                  >
                    {block.number_label && (
                      <div
                        className="sheet-chapter-number-label"
                        style={{
                          fontSize: `${bodyFontSize * 0.9}px`,
                          letterSpacing: '2px',
                          fontFamily: profile.typography.heading_font || bodyFontFamily,
                        }}
                      >
                        {block.number_label}
                      </div>
                    )}
                    <h2
                      className="sheet-chapter-heading"
                      style={{
                        fontFamily: profile.typography.heading_font || bodyFontFamily,
                        fontSize: `${bodyFontSize * 1.5}px`,
                        textTransform: profile.chapter_style.title_case === 'uppercase' ? 'uppercase' : 'none',
                      }}
                    >
                      {block.title}
                    </h2>
                    {block.ornament && (
                      <div className="sheet-chapter-ornament" style={{ fontSize: `${bodyFontSize * 0.9}px` }}>
                        {block.ornament}
                      </div>
                    )}
                  </div>
                );

              case 'paragraph':
                return (
                  <p
                    key={bIdx}
                    className={`sheet-paragraph ${block.is_first_in_chapter ? 'first-in-chapter' : ''}`}
                    style={{
                      fontSize: `${bodyFontSize}px`,
                      lineHeight,
                      textAlign: textAlign as any,
                      textIndent: block.is_first_in_chapter ? '0px' : `${indentPx}px`,
                      marginBottom: `${profile.typography.paragraph_spacing_pt * 1.333 * fontScale}px`,
                    }}
                  >
                    {block.text}
                  </p>
                );

              case 'scene_break':
                return (
                  <div
                    key={bIdx}
                    className="sheet-scene-break"
                    style={{
                      fontSize: `${bodyFontSize * 0.9}px`,
                      letterSpacing: '4px',
                    }}
                  >
                    {block.symbol}
                  </div>
                );

              case 'image':
                return (
                  <div key={bIdx} className="sheet-image-block">
                    <img src={block.src} alt={block.alt} />
                    {block.caption && <figcaption>{block.caption}</figcaption>}
                  </div>
                );

              default:
                return null;
            }
          })}
        </div>

        {/* Running Footer / Page Number */}
        {!page.is_front_matter && profile.headers_footers.show_footer && (
          <footer
            className="sheet-footer"
            style={{
              bottom: `${padBottomPx * 0.4}px`,
              left: `${padLeftPx}px`,
              right: `${padRightPx}px`,
              fontSize: `${bodyFontSize * 0.75}px`,
            }}
          >
            <span className="sheet-footer-left">{page.footer_left}</span>
            <span className="sheet-footer-center">{page.footer_center}</span>
            <span className="sheet-footer-right">{page.footer_right}</span>
          </footer>
        )}
      </div>
    );
  };

  return (
    <div className="publish-preview-viewport">
      {/* Top Preview Controls Bar */}
      <div className="publish-preview-toolbar">
        <div className="preview-nav-group">
          <button
            type="button"
            className="preview-btn"
            onClick={() => onGoToPage(0)}
            disabled={currentPageIndex === 0}
            title="First Page"
          >
            ⏮
          </button>
          <button
            type="button"
            className="preview-btn"
            onClick={onPrevPage}
            disabled={currentPageIndex === 0}
            title="Previous Page"
          >
            ◀
          </button>

          <div className="preview-page-indicator">
            <span>Page</span>
            <input
              type="number"
              className="preview-page-input"
              value={currentPageIndex + 1}
              min={1}
              max={totalPages || 1}
              onChange={(e) => onGoToPage(Number(e.target.value) - 1)}
            />
            <span>of {totalPages || 1}</span>
          </div>

          <button
            type="button"
            className="preview-btn"
            onClick={onNextPage}
            disabled={currentPageIndex >= totalPages - 1}
            title="Next Page"
          >
            ▶
          </button>
          <button
            type="button"
            className="preview-btn"
            onClick={() => onGoToPage(totalPages - 1)}
            disabled={currentPageIndex >= totalPages - 1}
            title="Last Page"
          >
            ⏭
          </button>
        </div>

        <div className="preview-viewmode-group">
          <button
            type="button"
            className={`preview-mode-btn ${viewMode === 'single' ? 'active' : ''}`}
            onClick={() => onViewModeChange('single')}
            title="Single Page View"
          >
            Single
          </button>
          <button
            type="button"
            className={`preview-mode-btn ${viewMode === 'spread' ? 'active' : ''}`}
            onClick={() => onViewModeChange('spread')}
            title="Two-Page Spread View"
          >
            Spread
          </button>
        </div>

        <div className="preview-zoom-group">
          <button
            type="button"
            className="preview-zoom-btn"
            onClick={() => onZoomChange(Math.max(0.5, zoomLevel - 0.1))}
            title="Zoom Out"
          >
            −
          </button>
          <span className="preview-zoom-label">{Math.round(zoomLevel * 100)}%</span>
          <button
            type="button"
            className="preview-zoom-btn"
            onClick={() => onZoomChange(Math.min(2.0, zoomLevel + 0.1))}
            title="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            className="preview-btn-reset-zoom"
            onClick={() => onZoomChange(1.0)}
            title="100% Zoom"
          >
            100%
          </button>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div className="publish-sheets-canvas">
        {loading && (
          <div className="publish-preview-overlay-loading">
            <div className="review-spinner" />
            <span>Typesetting preview...</span>
          </div>
        )}

        <div className={`publish-sheets-container ${viewMode === 'spread' ? 'spread-view' : 'single-view'}`}>
          {pageA && renderPageSheet(pageA)}
          {pageB && renderPageSheet(pageB)}
        </div>
      </div>
    </div>
  );
};
