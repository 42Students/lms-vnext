# Work packet (wave 2): edit src/components/courses/college-lesson-reorder-actions.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u003-superadmin-lessons.md, docs/audit/gap2/lane-17/college-admin-lessons.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-15-003-053  [P2] GAP  facet F10  effort M
- Legacy: Reorder `PUT /api/v1/lesson/reorder` with full orderedIds (`AdminService.js:615-616`; `sections/Lessons.js:224-239`).
- vNext now: POST `/api/courses/lessons/reorder` move one ID UP/DOWN expected sequence (`college-lesson-reorder-actions.tsx:25-37`).
- Fix: Support equivalent drag/keyboard full ordering with concurrency checks, not only pairwise movement.

## G2-17-007-010  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:466-472 — Info notices explain drag reorder and searching pause.
- vNext now: src/components/courses/college-lesson-reorder-actions.tsx:45-60 — Move up/down buttons and confirm dialog, no equivalent inline keyboard-drag guidance.
- Fix: Show accurate reorder/search guidance for the implemented move controls.

## G2-17-007-016  [P2] GAP  facet F05  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:224-239 — In course context, drag reorder swaps complete list; revert on failed PUT.
- vNext now: src/components/courses/college-lesson-reorder-actions.tsx:25-60 — Move up/down with separate confirmation per move.
- Fix: Add drag/keyboard full-order interaction and rollback feedback.

## G2-17-007-042  [P2] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:294-300 — Discard edits alert and save-in-progress refusal are distinct.
- vNext now: src/components/courses/college-lesson-reorder-actions.tsx:52-60 — Reorder confirm exists, but it is not an edit/discard dialog.
- Fix: Implement edit-specific pending/dirty confirmation.

## G2-17-007-044  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/api/Services/AdminService.js:615-616 — Legacy PUT `/api/v1/lesson/reorder` sends courseId and full lessonIds.
- vNext now: src/components/courses/college-lesson-reorder-actions.tsx:30-34 — POST `/api/courses/lessons/reorder` sends pathId, lessonId, expectedSequence and direction.
- Fix: Provide batch reorder UX wired to `/reorder-all` or document intentionally atomic directional moves.

## G2-17-007-065  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:466-472 — Reorder handle explicitly supports focus+keyboard control.
- vNext now: src/components/courses/college-lesson-reorder-actions.tsx:45-51 — Move Up/Down buttons keyboard operable but no sortable handle.
- Fix: Provide accessible sortable drag handle and announcements or retain documented button equivalence.

## G2-17-007-074  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:81-82 — Late reorder response guarded by selected-course ref before rollback.
- vNext now: src/components/courses/college-lesson-reorder-actions.tsx:25-43 — Reorder uses API optimistic expectedSequence; routing refresh after response.
- Fix: Test filter-switch during in-flight move and stale visual order on rejection.

## G2-18-002-015  [P2] GAP  facet F03  effort M
- Legacy: Legacy drag handle column appears only when single course active and no search/errors. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:224-239`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:390-396`
- vNext now: vNext admin list provides Move up/Move down buttons under Actions. `src/app/(authenticated)/admin/lessons/page.tsx:105-108`, `src/components/courses/college-lesson-reorder-actions.tsx:45-60`
- Fix: Provide drag handle+keyboard sortable table mode with server persisted whole-list order.

## G2-18-002-095  [P2] GAP  facet F17  effort M
- Legacy: Legacy DnD supports keyboard, pointer, and touch sensors. `docs/legacy-source/frontend/src/components/admin/SortableTableRow.js:45-76`
- vNext now: vNext move buttons are keyboard click controls and ConfirmDialog. `src/components/courses/college-lesson-reorder-actions.tsx:45-60`
- Fix: Restore keyboard sortable handle with announced position, while retaining move buttons for accessibility.

## G2-18-002-018  [P3] GAP  facet F03  effort S
- Legacy: Legacy info `Reorder lessons for this course` explains drag handle and keyboard. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:470-472`
- vNext now: vNext exposes move-up/down ConfirmDialog and no shared instructional alert. `src/components/courses/college-lesson-reorder-actions.tsx:45-60`
- Fix: Restore reorder instruction describing actual controls, or implement legacy drag.

## G2-18-002-111  [P3] GAP  facet F20  effort S
- Legacy: Legacy reorder optimistically changes list then rolls back on failure. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:225-238`
- vNext now: vNext sends change to server then refreshes, toast on failure. `src/components/courses/college-lesson-reorder-actions.tsx:25-42`
- Fix: If reintroducing optimistic DnD restore rollback on failed order save.
