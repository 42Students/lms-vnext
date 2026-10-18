# Chat-6 UX coverage closure — /admin middle third

**Scope:** index 38–74 of `docs/orchestrator/ui-ux/pages-admin.md` (37 routes). **Source:** generated `docs/audit/ux/COVERAGE-MATRIX.md` and `docs/audit/ui-surfaces/UI-SURFACES.md`.

## Before → after (scoped)

| Metric | Baseline | Lane result |
|---|---:|---:|
| Assigned routes | 37 | 37 |
| Assigned routes without a route-level UX test mention | 0 | 0 |
| Route-specific UX test titles naming the literal `/admin/…` route | Existing ID-only test titles | 37/37 explicitly named |
| Existing route behavior tests retained | 37 | 37 (plus eight shared-contract tests in the existing file) |
| Scroll/motion and overlay source-contract tests | 0 new in this pass | 22 |
| Raw pipeline table duplicate mobile/desktop subtree | 1 in the delegated /admin jobs applications workspace | 0, replaced with `DataTable` |
| Native bulk-drive `window.confirm` on scoped route | 1 | 0 |
| Native confirmation in drive duplication / deadline settings | 2 | 0 |
| New missing UX notes | 0 | 0 |

## Changes

- `tests/unit/ux-admin-chat6-middle-third.test.ts`: retained the 37 route-specific behavior assertions and eight pre-existing shared/coverage checks, and amended each route test title to include the **literal** route path and page-source path reference. Legacy headings, empty copy, pagination and scoped component checks were not weakened.
- `tests/unit/UX-admin-scroll-motion-chat6.test.ts`: added named source checks of the DataTable, three native overlay primitives, seven form/editor and scheduling overlays, the three scroll-heavy placement widgets, and the pipeline DataTable conversion. The assertions check actual adaptive `ScrollCue` overflow detection, conditional fades, native focus contracts, accessible names, reduced-motion tokens, bounded notes history and draft-safe confirm flows.
- `docs/audit/ux/scroll-motion-admin.md`: links each changed scroll region to the applicable routes/widgets and its acceptance test.
- `src/components/placements/college-application-pipeline-controls.tsx`: replaced the remaining raw table with a single responsive shared table; row selection, Details, Reinstate, Move to…, all field values, and the status-update dialog remain. Explicit empty copy and mobile disclosure now use the standard `DataTable` contract.
- `tests/unit/chat6-college-placements-read-parity.test.ts`: updated COL-placements-07 to check the same six legacy headers and mobile actions in the shared DataTable, rather than the retired hand-authored `<th>` tags. No acceptance checks were removed.
- `src/components/placements/super-admin-bulk-drive-actions.tsx`: replaced native confirmation with an accessible consequence-first `ConfirmDialog` and synchronous in-flight protection, while preserving the legacy text and the existing preview/confirm semantics.

## Coverage rules not falsely claimed

The global matrix still lists uncovered pages, overlays, tables and shared primitives **outside this 37-route slice**. This lane does not claim those global counts are zero; the orchestrator must regenerate `node scripts/audit/ux-coverage.mjs` after merging and distribute other area gaps to their owners. Source checks have not been executed as Vitest nor inspected through the browser. Page checklist boxes should remain unticked until the actual tests pass.

**Result:** scoped named-route coverage **37/37**, scoped noTest **0**, new source tests **22**, shared scroll roots/placement widget repairs **11 files**.
