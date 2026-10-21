# Work packet (wave 2): edit src/components/admin/super-admin-student-import-history.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-19/superadmin-students.md

## G2-14-002-051  [P2] GAP  facet F09  effort S
- Legacy: Legacy Import History width640 when/students with Close; vNext history separate control — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1731-1763`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:71-80`; `src/components/admin/super-admin-student-import-history.tsx:1-80`
- Fix: Restore modal and column text

## G2-19-001-077  [P2] GAP  facet F18  effort S
- Legacy: Legacy actions `Validate`, `Create`, `Sample CSV`, `Import History` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1405-1418`
- vNext now: vNext `Preview validation`, `Confirm import of validated rows`, `Download CSV template`, `Import History` `src/components/college/college-student-csv-import.tsx:69-74`,117-123,157-165; `src/components/admin/super-admin-student-import-history.tsx:14-16`
- Fix: Align labels where semantics truly match; document added explicit confirmation separately.

## G2-19-001-088  [P2] GAP  facet F22  effort M
- Legacy: Legacy `learner.bulk_import_batch_id` groups created learners `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:30-35`
- vNext now: vNext import history groups activity events, uses no batch identifier in UI runs `src/components/admin/super-admin-student-import-history.tsx:8-30`; `src/modules/people/college-student-csv-service.ts:37-52`
- Fix: Add durable import batch ID and child membership references or document no-undo retention policy explicitly.
