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

## Evidence and remaining acceptance

- Authenticated desktop/mobile Playwright scenarios have been authored in `tests/e2e/ux-g125-academic-actions.spec.ts` for Batches, Semesters and learner Class Schedule, plus learner-denied college directory export. They are **not executed**, and screenshot paths only become proof after a successful run.

- Regression source specifications: `tests/unit/ux-g125-academic-actions.test.ts`, including academic-year input edge cases and booking server validation.
- No browser, mobile, keyboard/AT, CI, full-group file review or deployed tenant test has been executed through this connector. The remaining 6 registered components are not certified by these nine fixes.
- Keep **DOING**, not DONE, until all 15 components are reviewed and executed tests, desktop/mobile browser proofs, regression/security review and exact-SHA evidence are attached to the canonical group.
