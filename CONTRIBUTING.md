# Contributing to Swrite

Thank you for contributing to **Swrite**. This document outlines our architectural principles, development workflow, branch policies, and testing standards.

---

## 🏛️ Core Principles

1. **Local-First & Privacy by Default**: Manuscript prose and story codices must always remain fully operational and persisted locally on the author's device. No features may introduce mandatory network dependencies.
2. **Author-Centric Flow**: Features must preserve uninterrupted drafting flow. Avoid modal proliferation, loud animations, or gamification.
3. **Manuscript Safety**: Normal author actions must never corrupt or lose manuscript text. All state replacements must support pre-restore safety snapshots.
4. **Strict Extension Isolation**: Experimental features (such as World Simulation) must remain quarantined on dedicated experiment branches until proven by longitudinal author testing.

---

## 🌿 Branch & Release Policy

- **`main` / `chore/swrite-repository-baseline`**: Stable production release branch.
- **`experiment/*`**: Experimental feature spikes (e.g. `experiment/world-simulation`). Code on these branches must not be merged into stable baseline without explicit evaluation milestones.

---

## 🛠️ Development Workflow

### Prerequisites
- Node.js $\ge 18$
- npm $\ge 9$

### Setup & Run
```bash
# Install dependencies from package-lock
npm ci

# Start local development server
npm run dev

# Run full engine unit test suite (154+ tests)
npm test

# Run Playwright browser E2E test suite (18+ tests)
npm run test:e2e

# Compile production bundle
npm run build
```

---

## 🧪 Testing Standards

- **Unit & Integration Tests**: All changes to the Story Engine, Continuity Engine, Review Queue, Snapshot System, or Publication Exporters must include comprehensive unit tests in `src/engine/`.
- **E2E Browser Tests**: UI changes affecting the critical authoring loop (`Write`, `Plan`, `Review`, `Revise`, `Publish`) must pass the full Playwright browser suite in `e2e/`.
- **Zero Build Errors**: Pull requests must pass `tsc && vite build` with zero TypeScript errors or warnings.
