# Work packet: edit src/components/courses/college-lesson-reorder-actions.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u003-superadmin-lessons.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md, docs/audit/gap2/lane-17/college-admin-lessons.md

## G2-15-003-060  [P1] GAP  facet F12  effort M
- Legacy: Legacy reorder disabled when searching, loading, errors or no selected course (`sections/Lessons.js:222-239`).
- vNext now: Move up/down available in each ACTIVE row; button disabled only canMoveUp and pending, canMoveDown always true (`admin/lessons/page.tsx:102-109`; `college-lesson-reorder-actions.tsx:11-19,45-50`).
- Fix: Disable reordering on filtered list/incomplete data and valid bottom boundary; enforce server order guards.

## G2-15-003-085  [P1] GAP  facet F22  effort M
- Legacy: Legacy edit/update uses optimistic `@Version Long` (`Lesson.java:32-39`).
- vNext now: No version column, uses updatedAt and reorder expectedSequence from client (`courses.ts:336-345`; `college-lesson-reorder-actions.tsx:25-34`).
- Fix: Verify compare-and-swap token on PATCH/DELETE/reorder, preserve conflict feedback.

## G2-18-002-029  [P1] GAP  facet F05  effort M
- Legacy: Legacy hides pagination while in drag-sort mode, shows all rows of selected course. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:224-239`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:519-523`
- vNext now: vNext always paginates 25 and moves individual rows. `src/app/(authenticated)/admin/lessons/page.tsx:118-122`, `src/components/courses/college-lesson-reorder-actions.tsx:45-60`
- Fix: Implement all-course sequence reorder in one view/POST reorder-all to avoid unmovable rows beyond a page.

## G2-18-002-108  [P1] GAP  facet F19  effort M
- Legacy: Legacy full course reordering loads all lessons, disabled under active search. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:224-239`
- vNext now: vNext move-up/down per-row on paginated list can invoke server endpoint with expected sequence. `src/components/courses/college-lesson-reorder-actions.tsx:25-40`, `src/app/(authenticated)/admin/lessons/page.tsx:118-122`
- Fix: Expose full-order page or reorder-all with expected list to avoid stale/hidden neighbors.

## G2-15-003-042  [P2] GAP  facet F08  effort M
- Legacy: Reorder success `Saved lesson order for {course}.` and rollback error `Couldn't save order. Previous order restored.` (`sections/Lessons.js:224-239`).
- vNext now: `Lesson order updated`/`Reorder failed` toast, server GET refresh after direction change (`college-lesson-reorder-actions.tsx:25-41`).
- Fix: Preserve exact toast copy or document intentional move-button redesign; ensure rollback refresh.

## G2-17-007-037  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:233-239 — Reorder toast `Saved lesson order for {course}.`; rollback toast `Couldn't save order. Previous order restored.`
- vNext now: src/components/courses/college-lesson-reorder-actions.tsx:34-40 — Toasts `Lesson order updated` and `Reorder failed`; browser refresh.
- Fix: Match exact success/failure semantics and explain rollback on failure.

## G2-18-002-054  [P2] GAP  facet F08  effort S
- Legacy: Legacy reorder failure `Couldn't save order. Previous order restored.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:233-238`
- vNext now: vNext toast `Reorder failed` with error description. `src/components/courses/college-lesson-reorder-actions.tsx:38-41`
- Fix: Display explicit previous-order-restored when optimistic UI rollback happens; otherwise no false rollback claim.

## G2-18-002-053  [P3] GAP  facet F08  effort S
- Legacy: Legacy reorder success `Saved lesson order for COURSENAME.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:225-238`
- vNext now: vNext toast `Lesson order updated`. `src/components/courses/college-lesson-reorder-actions.tsx:25-40`
- Fix: Include course name and exact legacy confirmation where same action.
