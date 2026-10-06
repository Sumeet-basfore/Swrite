# SWRITE 2 — Publication Profiles Specification

## 1. Profile Concept & Architecture
A **Publication Profile** defines the complete physical or digital layout parameters for rendering and exporting a manuscript.

Profiles are persisted in `.swrite/publish_profiles.json` inside the project root:
```json
{
  "active_profile_id": "trade-paperback-6x9",
  "custom_profiles": [...]
}
```

---

## 2. Built-in Preset Profiles

Swrite 2 includes 7 standard industry profiles:

1. **Trade Paperback (6 × 9 in)**:
   - Trim: 6.0" × 9.0", 2-sided with 0.125" gutter
   - Typography: Garamond 11pt, 1.25x line height, justified, 0.25" indent
   - Elements: Drop caps, running headers with author (recto) and book title (verso), page numbers outer-top.
2. **Standard Manuscript (William Shunn Format)**:
   - Trim: Letter 8.5" × 11.0", 1.0" uniform margins
   - Typography: Courier / Monospace 12pt, 2.0x double spaced, flush-left, 0.5" paragraph indent
   - Elements: `#` scene break markers, running header with `SURNAME / TITLE / PAGE#`.
3. **Digest Paperback (5.5 × 8.5 in)**:
   - Trim: 5.5" × 8.5"
   - Typography: Georgia 10.5pt, justified
   - Elements: Centered page numbers in footer, suppressed on first page of chapter.
4. **Classic Book (A5)**:
   - Trim: 148 × 210 mm (5.83" × 8.27")
   - Typography: Palatino / Georgia 10.5pt, justified
   - Elements: Elegant drop caps, asterism `* * *` scene breaks.
5. **Digital EPUB (Reflowable EPUB 3)**:
   - Format: EPUB 3
   - Clean semantic CSS, responsive reflow, standard chapter TOC navigation.
6. **Plain Markdown**:
   - Clean continuous Markdown concatenation with front matter metadata header and sanitized scene breaks.
7. **Plain Text**:
   - Standard UTF-8 plain text with 72-character soft wrapping and clean chapter breaks.

---

## 3. Schema Structure

```rust
pub struct PublicationProfile {
    pub id: String,
    pub name: String,
    pub description: String,
    pub is_builtin: bool,
    pub format: OutputFormat,
    pub page_size: PageSizeConfig,
    pub margins: MarginsConfig,
    pub typography: TypographyConfig,
    pub chapter_style: ChapterStyleConfig,
    pub scene_break_style: SceneBreakConfig,
    pub headers_footers: HeadersFootersConfig,
    pub page_numbering: PageNumberingConfig,
    pub front_matter: FrontMatterConfig,
    pub back_matter: BackMatterConfig,
}
```
