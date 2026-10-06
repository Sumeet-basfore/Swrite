# SWRITE 2 — Outline & Structural Model
Document Version: 2.0.0-alpha.1
Status: Canonical
Date: 2026-10-06

---

## 1. Natural Hierarchy Resolution

Swrite 2 resolves outline structure naturally from the `Manuscript/` folder tree:

```text
Manuscript/
├── Act 1/                    <-- Level: Act (folder)
│   ├── Chapter 01/           <-- Level: Chapter (folder)
│   │   ├── Scene 01.md       <-- Level: Scene (file)
│   │   └── Scene 02.md       <-- Level: Scene (file)
│   └── Chapter 02.md         <-- Level: Chapter (file)
└── Act 2/                    <-- Level: Act (folder)
    └── Chapter 03.md         <-- Level: Chapter (file)
```

### Hierarchy Rules:
1. **Act**: Directories whose names start with `Act` (case-insensitive) at the top of `Manuscript/`.
2. **Chapter**:
   - Files directly under `Manuscript/` (e.g. `Chapter 01.md`).
   - Directories directly under `Manuscript/` or under an `Act` folder.
3. **Scene**:
   - Files named `Scene *.md` or any file nested 2+ levels deep inside chapter folders.

---

## 2. Outline Items Data Model

Each item in the outline tree contains:

```typescript
export interface OutlineItem {
  id: string; // Relative path on disk (e.g. "Manuscript/Act 1/Chapter 01.md")
  name: string; // Derived from metadata title or filename
  relativePath: string;
  level: 'act' | 'chapter' | 'scene';
  isDirectory: boolean;
  children: OutlineItem[];
  meta?: ItemPlanningMeta;
}
```

---

## 3. Workflow Statuses

Swrite 2 supports 5 lightweight status tags:

- `Idea`: Concept stage, not yet outlined in detail.
- `Planned`: Scene outline / beats established.
- `Drafted`: Initial prose draft written.
- `Revising`: Under active revision or second draft.
- `Complete`: Polished and locked for manuscript compilation.

These statuses are persisted in `.swrite/outline_meta.json` without modifying manuscript markdown headers or file frontmatter.
