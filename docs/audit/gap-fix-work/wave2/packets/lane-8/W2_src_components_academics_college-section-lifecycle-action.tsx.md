# Work packet (wave 2): edit src/components/academics/college-section-lifecycle-action.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-controller.md, docs/audit/gap2/lane-5/u003-college-admin-classes.md, docs/audit/gap2/lane-5/u008-superadmin-classes.md

## G2-2-031-042  [P2] GAP  facet F09  effort M
- Legacy: Classes.js:123-154 destructive delete flow with confirmation.
- vNext now: college-section-lifecycle-action.tsx:48-55 uses Archive/Restore ConfirmDialog.
- Fix: Explain soft-archive semantics, exact confirm button labels and danger styling.

## G2-2-031-087  [P2] GAP  facet F23  effort M
- Legacy: ClassController.java:31-283 exposed direct hard delete and read-all to scoped superadmin.
- vNext now: college-section-lifecycle-action.tsx:19-52 supports archive/restore and college page separately.
- Fix: Owner decision for lifecycle/read scopes before clone signoff.

## G2-5-003-063  [P2] GAP  facet F17 Accessibility  effort S
- Legacy: Edit/Schedule/Delete have contextual aria-label including section name; disabled Delete has tooltip. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:410-423)
- vNext now: Schedule has contextual aria-label; Edit and Archive buttons generic. (src/components/academics/college-structure-directory.tsx:398-406; src/components/academics/college-section-management.tsx:185-190; src/components/academics/college-section-lifecycle-action.tsx:42-46)
- Fix: Add contextual Edit/Archive labels, disabled reason tooltip.

## G2-5-008-013  [P2] GAP  facet F03 Visible elements  effort M
- Legacy: Delete disabled tooltip explains enrolled/scheduled blockers (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:403-423)
- vNext now: Archive/Restore guarded by different dependencies (src/components/academics/college-section-management.tsx:185-190; src/components/academics/college-section-lifecycle-action.tsx:19-55)
- Fix: Render legacy disabled Delete tooltip and detailed guard rationale.

## G2-2-031-073  [P3] GAP  facet F18  effort S
- Legacy: ClassController.java:254-255 `Class deleted successfully`.
- vNext now: college-section-lifecycle-action.tsx:46-52 `Archive`, `Restore` controls.
- Fix: Use accurate archive terminology while documenting old delete action.
