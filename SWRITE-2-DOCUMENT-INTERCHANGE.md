# Swrite 2 — Document Interchange, IPC & Test Contract

**Document Version:** 1.0.0  
**Status:** Canonical & Locked  
**Milestone:** 1 — Document Model & File System Specification  

---

## 1. System Boundary: Rust Core vs. Frontend UI

To maintain high performance and architectural cleanliness, Swrite 2 enforces a strict separation of concerns across the Tauri 2 IPC boundary:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       RUST CORE (Native Backend)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Filesystem I/O & atomic write protocols                                   │
│ • File watchers (native notify engine)                                      │
│ • Document AST parsing & deterministic serialization                        │
│ • Markdown, Plaintext, DOCX import & export pipelines                       │
│ • Crash recovery write-ahead logs & snapshots                               │
│ • In-memory search token index & query engine                              │
│ • Path sanitization & security isolation                                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Tauri 2 IPC Commands & Events
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REACT / TYPESCRIPT (Frontend UI)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Rich WYSIWYG & Source Markdown editor canvases                            │
│ • Workspace routing ([Write | Plan | Desk | Edit | Publish])               │
│ • Keyboard shortcut dispatching & slash command menus (`/`)                 │
│ • Moodboard drag-and-drop canvas layout                                     │
│ • Theme & font visual rendering                                             │
│ • Modal dialogs, side trays, and non-blocking notifications                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tauri IPC Command API Specification

All frontend operations communicate through a strongly-typed, path-sanitized command boundary:

```rust
// Rust Tauri Command Signatures

#[tauri::command]
pub async fn project_open(project_path: String) -> Result<ProjectManifest, AppError>;

#[tauri::command]
pub async fn project_validate(project_path: String) -> Result<ValidationReport, AppError>;

#[tauri::command]
pub async fn file_read(doc_id: String) -> Result<Document, AppError>;

#[tauri::command]
pub async fn file_write(doc_id: String, doc: Document) -> Result<SaveResult, AppError>;

#[tauri::command]
pub async fn file_create(rel_path: String, initial_content: Option<String>) -> Result<DocumentIdentity, AppError>;

#[tauri::command]
pub async fn file_rename(doc_id: String, new_filename: String) -> Result<DocumentIdentity, AppError>;

#[tauri::command]
pub async fn file_move(doc_id: String, target_rel_dir: String) -> Result<DocumentIdentity, AppError>;

#[tauri::command]
pub async fn file_delete(doc_id: String) -> Result<bool, AppError>;

#[tauri::command]
pub async fn document_import(source_path: String, target_rel_dir: String) -> Result<DocumentIdentity, AppError>;

#[tauri::command]
pub async fn document_export(options: ExportOptions) -> Result<ExportResult, AppError>;

#[tauri::command]
pub async fn search_query(query: String, filter: Option<SearchFilter>) -> Result<Vec<SearchResult>, AppError>;

#[tauri::command]
pub async fn history_create_snapshot(doc_id: String, label: Option<String>) -> Result<SnapshotMetadata, AppError>;

#[tauri::command]
pub async fn history_restore_snapshot(doc_id: String, snapshot_id: String) -> Result<Document, AppError>;
```

### Security & Path Sanitization Rules:
- The frontend **never passes unchecked raw filesystem paths**.
- Every relative path is canonicalized and validated against the active project root in Rust.
- Path traversal attempts (e.g., `../../etc/passwd` or `..\Windows\System32`) are rejected with security errors.

---

## 3. Automated Test Contracts

Every core subsystem must satisfy strict automated test suites before milestone promotion:

### 3.1 Filesystem Suite
- **Path Operations**: Create, rename, move, delete, duplicate nested files and folders.
- **Unicode & Special Characters**: Filenames with spaces, Japanese kanji, accented Latin characters, and emojis must pass on all target OSes.
- **Collision Resistance**: Creating existing filenames must throw predictable collision errors rather than silently overwriting.

### 3.2 Markdown Roundtrip Suite
- **1,000-Cycle Invariance Test**: Parse a rich document, serialize to Markdown, re-parse, and re-serialize 1,000 times. Result must have **0 byte drift**.
- **Extension Node Preservation**: Raw HTML blocks, unrecognized inline tags, and mathematical delimiters must emerge unaltered after roundtripping.

### 3.3 DOCX Import/Export Suite
- **Semantic Mapping**: Validate headings, lists, tables, bold/italic runs, and footnotes translate accurately into AST.
- **Security Check**: Confirm all embedded VBA macros, ActiveX controls, and script objects are stripped safely during import.

### 3.4 Recovery & Persistence Suite
- **Simulated Power Cut**: Terminate the application process mid-save; verify the primary manuscript file on disk remains uncorrupted and that recovery buffers restore the last keystrokes.

---

## 4. Performance & Benchmark Budgets

Swrite 2 is evaluated against four standard benchmark project loads:

| Benchmark Tier | Word Count | Chapter / Scene Structure | Target Load Time | Target Save Latency | Target Keystroke Latency |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Flash / Scene** | 1,000 words | 1 Scene | < 5 ms | < 10 ms | < 8 ms |
| **Tier 2: Long Chapter** | 10,000 words | 1 Chapter (3 scenes) | < 10 ms | < 15 ms | < 10 ms |
| **Tier 3: Novel Draft** | 50,000 words | 25 Chapters (60 scenes) | < 18 ms | < 25 ms | < 12 ms |
| **Tier 4: Epic Manuscript**| 120,000+ words | 50 Chapters (120 scenes) | < 30 ms | < 35 ms | < 15 ms |

### Strict UX Rule:
Typing in the active editor must **never drop below 60 frames per second (16.6ms frame budget)** regardless of total manuscript size.
