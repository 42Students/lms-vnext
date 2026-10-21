# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-5/u010-classes-shared-component.md

3 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u010-classes-shared-component.md

## G2-5-010-010  [P1] MISSING  facet F03 Visible elements  effort L
- Legacy: Edit, Schedule and Delete icon Buttons with disabled tooltip (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:403-426)
- vNext now: Schedule link/Edit/Archive-restore; Delete absent (src/components/academics/college-structure-directory.tsx:396-406)
- Fix: Add legacy Delete with dependency tooltip.

## G2-5-010-043  [P1] MISSING  facet F09 Modals/drawers  effort L
- Legacy: Delete Popconfirm only when safe (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:415-423)
- vNext now: Archive/Restore ConfirmDialog (src/components/academics/college-section-lifecycle-action.tsx:48-54)
- Fix: Add safe delete Popconfirm with exact blockers.

## G2-5-010-047  [P1] MISSING  facet F10 Actions/side effects  effort L
- Legacy: DELETE hard deletes after dependency guard and audit (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:287-306; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:225-255)
- vNext now: PATCH archive/restore instead (src/components/academics/college-section-lifecycle-action.tsx:19-54)
- Fix: Restore guarded DELETE or owner explicit deprecation.
