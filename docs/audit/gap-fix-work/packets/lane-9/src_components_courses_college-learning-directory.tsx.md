# Work packet: edit src/components/courses/college-learning-directory.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/college-admin-lessons.md

## G2-17-007-015  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:390-405 — Five static columns plus conditional drag handle and Actions; row selection checkbox column.
- vNext now: src/components/courses/college-learning-directory.tsx:603-633 — Four columns and no inline row action/checkbox; separate bulk picker.
- Fix: Restore Actions column and in-table selection with preserved keys.

## G2-17-007-028  [P1] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:294-301 — On dirty edit close, confirms `Discard edits to ...?` then `Unsaved changes will be lost.`
- vNext now: src/components/courses/college-learning-directory.tsx:609-633 — No edit state or discard confirmation.
- Fix: Implement dirty edit detection and exact discard confirmation.

## G2-17-007-039  [P1] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:531-541 — Edit modal includes form, save-disabled state and unsaved guard.
- vNext now: src/components/courses/college-learning-directory.tsx:609-633 — No edit modal; only visibility inline.
- Fix: Build legacy-equivalent modal and guard.

## G2-17-007-040  [P1] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:542-555 — Delete modal requires typing exact lesson title; button says `Delete lesson and its files`.
- vNext now: src/components/courses/college-learning-directory.tsx:609-633 — No delete confirmation modal.
- Fix: Restore typed-name confirmation; verify actual file policy against label.

## G2-17-007-032  [P2] MISSING  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:537-540 — Edit error alert title `Lesson changes were not saved`.
- vNext now: src/components/courses/college-learning-directory.tsx:609-633 — No edit flow; no matching error region.
- Fix: Implement edit error alert and server field mapping.

## G2-17-007-036  [P2] MISSING  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:316-320 — Edit toast `Updated lesson “{name}”.` and refreshes/current-course move.
- vNext now: src/components/courses/college-learning-directory.tsx:609-633 — No edit action or toast.
- Fix: Restore edit toast and after-move filter navigation.

## G2-17-007-038  [P2] MISSING  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:340-342 — Deletion success says uploaded files remain and support can restore.
- vNext now: src/components/courses/college-learning-directory.tsx:609-633 — No deletion success notice.
- Fix: Show retention/restore message once delete implemented.
