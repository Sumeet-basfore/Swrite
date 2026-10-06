# SWRITE 2 — Timeline & Chronology Model
Document Version: 2.0.0-alpha.1
Status: Canonical
Date: 2026-10-06

---

## 1. Timeline Storage Contract

The story timeline is stored on disk in human-readable Markdown format at:

`Planning/Timeline.md`

### Markdown Format Example:

```markdown
# Story Timeline

## Fall of the Ancient Keep
- **ID**: evt-1049283
- **Time**: Year 420, Autumn
- **Marker**: Backstory
- **Linked Scene**: Manuscript/Chapter 01.md
- **Order**: 1

The ancient fortress fell to the rebel forces during the autumn harvest.

### Notes
Establishes the political grievance of the northern lords.

---

## The Coronation Banquet
- **ID**: evt-1049284
- **Time**: Present Day, Evening
- **Marker**: Chronological
- **Linked Scene**: Manuscript/Chapter 02.md
- **Order**: 2

The protagonist attends the banquet under a false alias.
```

---

## 2. Event Structure

```rust
pub struct TimelineEvent {
    pub id: String,
    pub title: String,
    pub temporal_position: String,
    pub narrative_marker: String,
    pub linked_scene: Option<String>,
    pub order_index: usize,
    pub description: String,
    pub notes: String,
}
```

---

## 3. Narrative Markers

- **Chronological**: Standard story present-time progression.
- **Flashback**: Retrospective event portrayed during the narrative.
- **Flashforward**: Future glimpse or premonition.
- **Memory**: Character internal recollection.
- **Backstory**: Historical world event preceding story start.
