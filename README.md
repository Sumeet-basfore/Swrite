# Swrite

A desktop novel-writing studio. Five workspaces — Write, Plan, Desk, Edit, Publish — over plain Markdown files on disk. No database, no account, no cloud. Built with Tauri 2, React 19, and Rust. Currently at `0.1.0-rc1`.

## Install (Linux)

Downloaded bundles are produced by `npm run tauri:build`:

- `Swrite_0.1.0-rc1_amd64.deb` — Debian/Ubuntu (`sudo dpkg -i ...`)
- `Swrite-0.1.0-rc1-1.x86_64.rpm` — Fedora/RHEL (`sudo rpm -i ...`)

(AppImage is not bundled — the packager needs network access to fetch its tooling.)

## Develop

Prerequisites: Node 20+, Rust stable, Tauri system deps (webkit2gtk, etc. — see the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)).

```bash
npm install
npm run dev          # Vite frontend only (:1420)
npm run tauri:dev    # full desktop app
npm test             # frontend: vitest
npm run build        # tsc + production frontend build
cargo test --manifest-path src-tauri/Cargo.toml   # Rust core (69 tests)
```

## How it's put together

```
src/                 React frontend — shell, five studios, Milkdown editor
src-tauri/src/       Rust core — filesystem, parsing, search, history, export
plugins/examples/   reference plugin (word-count)
```

- **Rust owns truth**: file I/O, Markdown/DOCX/TXT parsing, full-text index, file watcher with 3-way reconciliation, snapshots, recovery drafts, proofreading, pagination, export (PDF/DOCX/EPUB/MD/TXT), plugin validation and storage.
- **React owns the surface**: Milkdown canvas, tabs, the five studios, 29 themes, plugin sandbox execution, debounced saves (1.5 s write, 3 s recovery draft).
- **Bridge**: typed `SwriteIpc.invoke` facade (`src/lib/ipc.ts`) over ~70 Tauri commands. Failures are reported through a central `reportError` helper with user-visible toasts; render crashes are isolated per studio by error boundaries.
- **Storage**: a project is a directory (`Manuscript/`, `Planning/`, `Desk/`, `Assets/`) plus JSON sidecars. Atomic writes, sha256 reconciliation, safe restore.

Details live in the `SWRITE-2-*.md` spec docs and `MILESTONE-*-REPORT.md` build logs.

## Themes

29 built-in themes (14 light, 15 dark), each bundling a color palette with an editor typography pairing — serif manuscripts, mono desks, dense or spacious measures, all offline system fonts. Every theme passes a WCAG AA contrast gate (`themeContrast.test.ts`). `lamplight` is the current flagship: ember-brown dark with amber light, paired with the typewriter lock (status-bar **Lock** button) that dims every paragraph except the one being written.

## Project status

Release candidate: see `RELEASE-CHECKLIST.md` and `RELEASE-0.1.0-RC1.md`. Known boundaries are disclosed in `KNOWN-LIMITATIONS.md` (in-process plugins are trusted-local-only; simultaneous multi-device edits surface a manual conflict rather than auto-merge).

## License

MIT, as declared in `src-tauri/Cargo.toml`.
