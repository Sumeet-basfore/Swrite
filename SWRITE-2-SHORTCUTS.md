# SWRITE 2 — Authoritative Shortcut Reference

All keyboard shortcuts in Swrite 2 are centralized in `src/editor/shortcuts/shortcutRegistry.ts`.

*(Note: `Mod` refers to `Cmd` on macOS and `Ctrl` on Windows/Linux.)*

---

## 1. Formatting Shortcuts

| Action | Shortcut | Description |
| :--- | :--- | :--- |
| **Bold** | `Mod + B` | Toggle bold on active text selection |
| **Italic** | `Mod + I` | Toggle italic on active text selection |
| **Underline** | `Mod + U` | Toggle underline on active text selection |
| **Strikethrough** | `Mod + Shift + X` | Toggle strikethrough on active selection |
| **Inline Code** | `Mod + \`` | Format selection as monospace code |
| **Heading 1** | `Mod + Alt + 1` | Convert current block to Heading 1 |
| **Heading 2** | `Mod + Alt + 2` | Convert current block to Heading 2 |
| **Heading 3** | `Mod + Alt + 3` | Convert current block to Heading 3 |
| **Body Paragraph** | `Mod + Alt + 0` | Convert current block to normal text |
| **Blockquote** | `Mod + Shift + Q` | Wrap current block in blockquote |
| **Bullet List** | `Mod + Shift + 8` | Wrap current block in bullet list |
| **Numbered List** | `Mod + Shift + 7` | Wrap current block in numbered list |
| **Scene Break** | `Mod + Shift + D` | Insert ornamental scene separator (`✦ ✦ ✦`) |
| **Page Break** | `Mod + Shift + Enter` | Insert explicit page break boundary |

---

## 2. Editing & Document Shortcuts

| Action | Shortcut | Description |
| :--- | :--- | :--- |
| **Save Document** | `Mod + S` | Force immediate atomic disk save |
| **Find & Replace** | `Mod + F` | Toggle in-document Find & Replace bar |
| **Add Comment** | `Mod + Shift + C` | Create editorial review comment |
| **Add Bookmark** | `Mod + Shift + B` | Place author bookmark at current cursor |
| **Document Outline** | `Mod + Shift + O` | Toggle Document Outline & Bookmarks drawer |
| **Undo** | `Mod + Z` | Revert previous editor change |
| **Redo** | `Mod + Shift + Z` / `Mod + Y` | Reapply undone change |

---

## 3. Writing Modes & Navigation

| Action | Shortcut | Description |
| :--- | :--- | :--- |
| **Focus Mode** | `Mod + Shift + F` | Toggle distraction-free writing canvas |
| **Reading Mode** | `Mod + Shift + R` | Toggle clean read-only presentation mode |
| **Markdown Source** | `Mod + /` | Switch between Rich visual editor and Source text |
| **Write Studio** | `Mod + 1` | Switch to Write Studio |
| **Plan Studio** | `Mod + 2` | Switch to Planning Studio |
| **Desk Studio** | `Mod + 3` | Switch to Creative Desk |
| **Edit Studio** | `Mod + 4` | Switch to Edit Studio |
| **Publish Studio** | `Mod + 5` | Switch to Publish Studio |
| **Quick File Search** | `Mod + P` | Open fuzzy document switcher |
| **Toggle Sidebar** | `Mod + B` *(no selection)* | Collapse or expand project sidebar |
| **Global Project Search**| `Mod + Shift + F` *(global)*| Search all files in project |

---

## 4. Shortcut Safety Guarantees

- When typing in search fields, modal text inputs, rename inputs, or numeric fields, formatting and studio shortcuts are ignored to prevent accidental studio jumps or text destruction.
- Typing always takes absolute priority over hotkey triggers.
