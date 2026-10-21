# Work packet (wave 2): edit src/components/ui/confirm-dialog.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md

## G2-17-002-071  [P2] GAP  facet F17  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:410-414 Modal traps focus and disables close while editLoading.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:204-230 inline edit, src/components/ui/confirm-dialog.tsx:13-18 uses alertdialog only for ADD/REMOVE.
- Fix: If restoring edit modal, implement proper focus return/escape/disabled states.
