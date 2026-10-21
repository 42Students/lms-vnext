# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-5/u003-college-admin-classes.md

2 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u003-college-admin-classes.md

## G2-5-003-008  [P1] MISSING  facet F03 Visible elements  effort L
- Legacy: Per-row buttons Edit, Schedule, Delete with icons and delete tooltip. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:403-426)
- vNext now: Schedule link, Edit button, Archive/Restore lifecycle button; no Delete. (src/components/academics/college-structure-directory.tsx:396-406)
- Fix: Implement guarded delete as legacy or explicitly owner-approve archive replacement.

## G2-5-003-040  [P1] MISSING  facet F09 Modals/drawers  effort L
- Legacy: Delete Popconfirm per row with student dependency tooltip and scheduled session note. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:415-423)
- vNext now: Archive/Restore ConfirmDialog instead, no Delete Popconfirm. (src/components/academics/college-section-lifecycle-action.tsx:48-54)
- Fix: Restore conditional delete confirm and blockers vs new archival lifecycle.
