# Work packet (wave 3): edit src/components/courses/college-learning-directory.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/college-admin-lessons.md

## G2-17-007-007  [P1] MISSING  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:399-404 — Each row exposes icon buttons `Edit` and red `Delete`.
- vNext now: src/components/courses/college-learning-directory.tsx:609-633 — Row contains title, linked course, order and visibility/activity, not row Edit/Delete.
- Fix: Restore row edit/delete controls using per-offering authorised APIs and confirmation.

## G2-17-007-027  [P1] MISSING  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:285-319 — Edit modal permits course reassignment, rename and visibility update.
- vNext now: src/components/courses/college-learning-directory.tsx:609-633 — Directory has no edit modal or course reassignment.
- Fix: Implement edit modal and scoped move validation, with unsaved-change guard.

## G2-17-007-085  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:390-405 — Legacy has in-row rename, move-course and delete actions.
- vNext now: src/components/courses/college-learning-directory.tsx:609-633 — Those actions intentionally or unintentionally absent from directory.
- Fix: Record owner decision on normalized offering moves and implement safe rename/archive.
