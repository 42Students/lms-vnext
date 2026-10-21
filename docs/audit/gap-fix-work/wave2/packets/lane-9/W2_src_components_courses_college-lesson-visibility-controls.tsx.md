# Work packet (wave 2): edit src/components/courses/college-lesson-visibility-controls.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/college-admin-lessons.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-17-007-011  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:493-503 — `N selected`, Show, Hide, Clear selection actions shown beside selected rows.
- vNext now: src/components/courses/college-lesson-visibility-controls.tsx:108-143 — Collapsed separate bulk disclosure with select-all-page checkboxes; no explicit `Clear selection` button.
- Fix: Expose clear-selection action and selected-count near table controls.

## G2-17-007-041  [P2] GAP  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:380-388 — Bulk confirm includes up to five names and file-retention reassurance.
- vNext now: src/components/courses/college-lesson-visibility-controls.tsx:69-70 — Browser confirm says only action and selection count.
- Fix: Use contentful confirmation dialog listing records and no-file-delete statement.

## G2-18-002-038  [P2] GAP  facet F06  effort M
- Legacy: Legacy `Visible to students` switch in edit maps both active and enabled simultaneously. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:284-292`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:310-315`
- vNext now: vNext visibility is independent chip action with window.confirm; edit Dialog lacks switch. `src/components/courses/admin-learning-structure-actions.tsx:516-605`, `src/components/courses/college-lesson-visibility-controls.tsx:19-45`
- Fix: Expose visibility toggle in Edit and keep same transactional status update.
