# Work packet (wave 3): edit src/components/academics/college-section-management.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u008-superadmin-classes.md

## G2-5-008-011  [P1] MISSING  facet F03 Visible elements  effort L
- Legacy: Every row Edit/Schedule/Delete actions (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:389-426)
- vNext now: Manage students, Schedule anchor, Edit + Archive/Restore, Delete absent (src/app/(authenticated)/admin/classes/page.tsx:84-95; src/components/academics/college-section-management.tsx:185-190)
- Fix: Restore guarded Delete and schedule modal actions.
