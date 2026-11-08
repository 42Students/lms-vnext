# UX-G125 — Academic interactive component recovery

**Canonical status:** DOING in `docs/tracker.json#uxReview.groups`.
**Scope:** 15 registered components under `src/components/academics/`.
**Owner:** `chat-ux-academics-20261108`; branch `main`.

## Source fixes, 2026-11-08

- `college-promotion-confirmation.tsx`: the year-override regex accidentally contained escaped backslashes and rejected valid formats. Reuse the shared `parsePromotionAcademicYear` contract, which also enforces lower/upper year bounds. Guard promotion submit against a second click before React updates pending state; always release the lock.
- `college-hall-booking-action.tsx`: prevent invalid end-before-start bookings and dates outside the selected class period before prompting users; announce the issue inline, disable invalid submit, and clear the booking date when the class changes. The API continues to perform the authoritative overlap and role checks.
- `college-semester-management.tsx`: release the semester delete in-flight guard even when the server rejects deletion, allowing a corrected retry.
- `college-recurring-preview.tsx`: prevent duplicate preview and schedule creation requests before transition pending state commits, with lock release in both success and rejection paths.

- `academics-create-panel.tsx`, `academics-actions.tsx`, `section-operations.tsx`: synchronize mutation requests before React transitions update, and translate machine failures into existing academic error copy.
- `college-section-management.tsx`: prevent end-before-start manual sessions, show inline guidance, and release the single-write guard on rejection.

- `college-cohort-management.tsx`: guarantee one in-flight batch create/edit/graduation/retirement operation per action surface; release request locks after errors for retry.

- `academics-create-panel.tsx`/`academics-overview.tsx`: empty-state links into collapsed creation disclosures now reveal the requested form and focus its summary on hash navigation. Source assertions cover all four links.

- `college-academic-directory.tsx`, batch and semester create forms: zero-result list recovery now links directly to a real in-page create form instead of always sending users to Programs; both anchors are regression-checked.

## Additional source-only review of unchanged components

These files were checked against their current UI contracts and retained rather than rewritten. This does **not** constitute an executed accessibility or user-journey pass:

- `academics-overview.tsx`: programs, periods, cohorts and sections each expose a DataTable and corresponding action; its four empty-state links target creation disclosures, now explicitly opened and focused by `AcademicsCreatePanel`.
- `college-section-lifecycle-action.tsx`: archive/restore and delete have separate confirmation dialogs, a synchronous in-flight guard released in `finally`, and per-dependency denial copy. No new component patch.
- `college-structure-directory.tsx`: responsive directory filtering, schedule link, CSV export, paging and horizontal table region are present. No new component patch.
- `college-term-mapping-manager.tsx`: course mapping mutations have an in-flight guard, stale-mapping handling, inline validation and accessible move controls. No new component patch.
- `learner-class-schedule.tsx`: calendar view selector, next/previous period, course/section filtering, mobile day agenda and keyboard labels are present in source. No browser verification yet.

**Scope:** all 15 registered G125 component source files have been inspected; 10 received scoped UX changes and five were retained. This is implementation/source-review coverage only, not an acceptance or release percentage.

## Evidence and remaining acceptance

- Authenticated desktop/mobile Playwright scenarios have been authored in `tests/e2e/ux-g125-academic-actions.spec.ts` for Batches, Semesters and learner Class Schedule, plus learner-denied college directory export. They are **not executed**, and screenshot paths only become proof after a successful run.

- Regression source specifications: `tests/unit/ux-g125-academic-actions.test.ts`, including academic-year input edge cases and booking server validation.
- No browser, mobile, keyboard/AT, CI, or deployed tenant test has been executed through this connector. All source files have been reviewed, but neither unchanged files nor code changes are certified without executed evidence.
- Keep **DOING**, not DONE, until all 15 components are reviewed and executed tests, desktop/mobile browser proofs, regression/security review and exact-SHA evidence are attached to the canonical group.
