# UX-G154 — Project and template interactive components

**Canonical state: DOING.** Eight tracked source files; no duplicate group claims. `docs/tracker.json#uxReview` is authoritative.

## Scoped implementation

- `project-team-controls.tsx`: protects Add teammate from double-clicked POST submissions with a synchronous mutation lock; prevents saving a stale candidate while search is active.
- `project-template-controls.tsx`: guards template creation against duplicate rapid submits before the first async call.
- `super-admin-template-college-bulk.tsx`: keeps selected college names across paginated selection; saved selection is display-only and fresh server CAS + authorization remain the mutation gate.
- `project-workspace.tsx`, `super-admin-template-create-form.tsx`, `super-admin-template-plan-editor.tsx`, `super-admin-template-subview-page.tsx`, `template-metadata-edit-control.tsx`: reviewed as dependency surfaces; existing version tokens, draft guards and scoped operations remain unchanged.

## Verification and remaining work

- `tests/unit/ux-five-group-batch-20261107.test.ts` asserts duplicate-submission locks and CAS contract; `tests/e2e/ux-five-group-batch-20261107.spec.ts` navigates authenticated template create page at desktop 1280px/mobile 390px and saves screenshots if run.
- Need exact-SHA `npm run lint`, `npm run typecheck`, `npm test` proof and authenticated Playwright execution, not just source presence.
- Mutation tests still required: fast double-submit results in exactly one teammate/template; stale candidate search; errors retain draft; cross-college selection denial; CAS mismatch; create/edit/publish/archival, team, release/sprint/task and metadata states.
- Do not count server access from a stale sessionStorage row; the template assignment endpoint must validate current scope and compare expected IDs.
- Outstanding browser acceptance: 320/390 and 1280 viewports, keyboard focus, screen reader names, dialog cancel and saved states for all eight components, full route/parity review.

**No DONE status until all eight component surfaces and corresponding states have real desktop/mobile proof and reviews.**

## 8 November 2026 — verified stronger component guards and browser evidence

- [Shared exact-SHA workflow 42476817032](https://github.com/42Students/lms-vnext/actions/runs/42476817032) **SUCCEEDED** at `c98ddc2bf339ba1f3d7a0f7ff8a1fba091e0497a`: scoped ESLint, full TypeScript, focused unit regressions and **17/17 authenticated responsive Chromium cases** across the shared component groups.
- Added synchronous mutation locks for published-template lifecycle/duplicate actions and member primary/remove actions, with source-contract regression tests; a second click cannot race React's deferred pending-state update.
- The separate real database template creation + metadata PATCH + publication browser path has run successfully as an individual test within earlier mixed workflows. The dedicated full suite including bulk assignment CAS, stale-version conflict and cleanup is newly authored and still requires a completely green exact-SHA run.
- Remaining open: all eight component states, negative/positive team and college assignments, duplicate replay, stale-search rejection, responsive/keyboard modality and scope review. **Keep DOING until those are evidenced.**

## 8 November 2026 — template plan/metadata duplicate-submit guard

- [Metadata edit fix abf38535](https://github.com/42Students/lms-vnext/commit/abf38535a5099e90d1954c220d0146d466f5aa80) adds a synchronous ref lock before a template overview PATCH. Invalid/stale drafts continue to fail before the lock; the lock is released in `finally` so correction/retry remains possible.
- [Sprint/task plan editor fix 898275e2](https://github.com/42Students/lms-vnext/commit/898275e2718954c66bc1e7f34492689b4c3bb14f) guards the confirmation dialog through the entire awaited mutation and releases the lock on cancel, conflict or error. Server `expectedVersion` compare-and-set remains intact.
- [Regression assertions ca43e0a9](https://github.com/42Students/lms-vnext/commit/ca43e0a980ba41d3ba7dea2bf29ea79930e19d39) verify both guards; [shared workflow a0d9291d](https://github.com/42Students/lms-vnext/commit/a0d9291d3ef55a9fc10cefbca5c106cc0d65fc7c) lints both changed editors with the pre-existing group checks.
- The initial exact-SHA [run 42488245047](https://github.com/42Students/lms-vnext/actions/runs/42488245047) was **cancelled** amid parallel `main` pushes; cancellation is not successful acceptance. The complete project team/template/assignment/CAS desktop-mobile matrix remains open; keep **DOING**.
