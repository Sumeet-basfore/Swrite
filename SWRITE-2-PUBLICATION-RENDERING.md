# SWRITE 2 — Publication Rendering & Pagination Engine

## 1. Pagination Model
The native Rust pagination engine (`src-tauri/src/publish/pagination.rs`) performs realistic line-height, margin, and page break calculations across all manuscript documents.

```text
Manuscript Documents (Ordered)
    ↓
AST Parsing & Block Normalization
    ↓
Usable Height & Column Constraint Computation
    ↓
Paragraph Line Wrapping & Orphan/Widow Prevention
    ↓
Chapter Page Breaks (Recto / Verso Handling)
    ↓
Running Headers & Footers Insertion
    ↓
Rendered Page Blocks Model
```

---

## 2. Geometry & Spacing Calculation

1. **Usable Page Height:**
   $$\text{Usable Height} = \text{Page Height} - \text{Top Margin} - \text{Bottom Margin} - \text{Header Height} - \text{Footer Height}$$
2. **Usable Page Width:**
   - Verso (Even / Left): $\text{Page Width} - \text{Inside Margin} - \text{Gutter} - \text{Outside Margin}$
   - Recto (Odd / Right): $\text{Page Width} - \text{Inside Margin} - \text{Gutter} - \text{Outside Margin}$
3. **Chapter Openings:**
   - Starts on odd page (Recto) when configured.
   - Suppresses header on the opening page.
   - Applies custom top spacing (e.g. 40pt) for chapter titles.
   - Applies initial drop cap styling to the first character of the opening paragraph.

---

## 3. Performance & Throughput
- **Target:** Paginate 100k+ words under 300ms.
- **Debouncing:** Live preview updates after 150ms debounce when modifying profile settings.
