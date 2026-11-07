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
