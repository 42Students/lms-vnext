# UX-G143 / UX-G150 — Faculty and learner profile editors

**Owner:** `ux-faculty-learner-profile-2026-11-07`  
**Canonical tracker:** `docs/tracker.json#uxReview`  
**Source paths:** `src/components/people/faculty-profile-*.tsx`, `src/components/profile/learner-profile-workspace.tsx`

## Scope and parity

The original profile editors remain available in the authenticated role-specific routes. This pass changes only presentation, accessibility, confirmation lifecycle, and local unsaved-draft feedback; it does not change the fields, APIs, save payloads, version/optimistic concurrency, identity masking, authorization policy, learner career scoring, or college-managed information.

### UX-G143 faculty profile editors

- Completeness now has an accessible native progress indicator alongside the existing percentage and the explicit **not verification or hiring eligibility** disclaimer.
- Repeatable entries have named Show/Hide, Duplicate, and Remove actions tied to their record numbers. The expanded state is exposed with `aria-expanded`, and the visible field container has `aria-controls`.
- Skill entries distinguish Move up, Move down, and Remove per record, including when multiple entries appear. Metadata removal has a record-specific accessible name and displays its current count against the 100-field limit.
- All section editors preserve dirty warning, discard confirmation, validation, save-result receipts, and managed-document removal restrictions.

### UX-G150 learner profile workspace

- Each collection's Add, Edit, and Delete control now names the section and target entry, including authored awards/publications.
- The pending confirmation promise is resolved negatively when replaced or the component unmounts, preventing a stranded asynchronous action. Cancellation and successful confirmation retain the previous behavior.
- Saved-data refresh, cross-tab reconciliation, confirmation before destructive changes, native dialogs, private profile media restrictions, masked identity, and real API permission checks remain unchanged.

## Test architecture and acceptance boundary

- Actual production components are imported into `tests/fixtures/ux-profile-proof-page.tsx`, copied to **a temporary route in CI only**. No new public application page is committed to `src/app`.
- Four Playwright Chromium scenarios are designed: Faculty and Learner at **1280×800 desktop** and **390×844 mobile**, testing visible sections, screen-reader labels, focusable controls, action state, and overflow. Captures are attached to the GitHub Actions run.
- Source-contract tests validate positive accessibility changes and negative privacy/regression checks, complemented by scoped ESLint and full `npm run typecheck`.
- [Exact current CI workflow](https://github.com/42Students/lms-vnext/actions/runs/42393164698); check the conclusion before marking DONE.
- A CI-only component preview is **not** evidence that a real tenant-owned faculty or learner user could authenticate, save successfully, or run in production. Those end-to-end workflows remain subject to existing dedicated auth/tenant tests and deployment verification.
- No permission, tenant, API, database, export, messaging, or token-handoff code was touched. We do not weaken existing authorization/security checks.

## Results

**Scoped UX acceptance recorded: G143 + G150 DONE.** [Run](https://github.com/42Students/lms-vnext/actions/runs/42396588929) passed scoped ESLint, 4/4 source contracts, and 4/4 real-component Chromium desktop/mobile cases. [Screenshot artifact](https://github.com/42Students/lms-vnext/actions/runs/42396588929/artifacts/13584151589) includes faculty/learner desktop and mobile captures. The run's **global TypeScript** check failed in concurrently edited project CSV export files unrelated to either group; they were subsequently fixed on main. A newer screenshot-stability/TypeScript re-run is queued. This note does not assert repo-wide CI is green.
