# SWRITE 2 — Publication Export Formats

## 1. Native Multi-Format Exporters

Swrite 2 provides native Rust export engines without external CLI or heavy Python/Node dependencies:

```text
               ┌──► PDF (printpdf / typography engine)
               ├──► DOCX (docx-rs / professional styles)
Manuscript ────┼──► EPUB 3 (zip / OCF / semantic XHTML)
               ├──► Markdown (sanitized monolithic file)
               └──► Plain Text (UTF-8 wrapped text)
```

---

## 2. Format Details

### 1. Print PDF
- Generated via `printpdf`.
- Supports standard paper sizes (Letter, A4, A5, 6×9, 5.5×8.5).
- Precise millimeter point positioning for running headers, body lines, and running page numbers.

### 2. Formatted DOCX
- Generated via `docx-rs`.
- Embeds standard chapter heading styles, exact margin measurements, paragraph indentation, and page break dividers before chapters.

### 3. EPUB 3 Container
- Packages standard Open Container Format (OCF) ZIP structure:
  - `mimetype` (uncompressed 20 bytes)
  - `META-INF/container.xml`
  - `EPUB/package.opf` (metadata, spine, manifest)
  - `EPUB/toc.ncx` & `EPUB/nav.xhtml`
  - `EPUB/styles.css` (publication-only typography)
  - Individual `chapter_XX.xhtml` files

### 4. Markdown & Plain Text
- Clean concatenated manuscript text stripped of internal project anchors and metadata.
- Prepend YAML front matter with title, author, date, and publisher.

---

## 3. Pre-Export Safety Guarantee
Before writing the exported file, Swrite automatically calls `HistoryStore::record_save` across all manuscript files to guarantee complete recovery and non-destructive operations.
