# SWRITE 2 — Notes & Desk Documents Model
Document Version: 2.0.0-alpha.1
Status: Canonical
Date: 2026-10-06

---

## 1. Document Conventions & Templates

Desk documents are stored as ordinary Markdown documents on disk. When creating documents via `+ New`, Swrite provides clean, optional starter templates:

### 1.1 Character Template (`Desk/Characters/*.md`)
```markdown
# Character Name

## Summary & Role
<!-- Primary narrative role, archetype, or relationship to protagonist -->

## Appearance
- **Age**: 
- **Distinguishing Features**: 
- **Voice / Mannerisms**: 

## Personality & Motivation
- **Core Want**: 
- **Internal Need / Conflict**: 
- **Flaws & Blindspots**: 

## Background & History
<!-- Key historical events shaping this character -->

## Key Relationships
- **Allies**: 
- **Antagonists**: 

## Story Notes
<!-- Ideas, scenes to write, things to fix -->
```

### 1.2 Location Template (`Desk/Locations/*.md`)
```markdown
# Location Name

## Overview & Atmosphere
<!-- Sensory atmosphere, lighting, soundscapes, smell -->

## Geography & Architecture
<!-- Physical layout, key buildings, defensive terrain -->

## History & Significance
<!-- What happened here in the past? Why does it matter now? -->

## Important Scenes & Conflicts
<!-- Scenes occurring here in the manuscript -->

## References & Visuals
<!-- Notes on real-world inspirations or linked moodboards -->
```

### 1.3 Research Template (`Desk/Research/*.md`)
```markdown
# Research Topic

## Research Topic
<!-- Historical era, technology, language, nautical, weapons, etc. -->

## Key Facts & Discoveries
- 

## Real-World Sources & References
- 

## Creative Adaptations for Story
<!-- How we modify or apply this factual research to fiction -->
```

---

## 2. Distinction Between Notes & Comments

- **Desk Notes**: Independent supporting documents stored in `Desk/`.
- **Manuscript Comments**: Inline annotations anchored to manuscript ranges stored in `.swrite/comments.json`.
Desk notes never pollute inline manuscript text, and manuscript comments never appear as loose files in Desk.
