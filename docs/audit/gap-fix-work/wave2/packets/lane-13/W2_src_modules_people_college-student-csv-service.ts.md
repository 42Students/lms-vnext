# Work packet (wave 2): edit src/modules/people/college-student-csv-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-15/l18-u031-people-management.md, docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-14-002-065  [P2] GAP  facet F12  effort M
- Legacy: Legacy import history stores batch ID even when individual entries partially created; vNext activity event runId with metadata — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:435-464`
- vNext now: `src/modules/people/college-student-csv-service.ts:197-229`
- Fix: Expose stable batch id and provenance parity

## G2-14-002-073  [P2] GAP  facet F14  effort M
- Legacy: Legacy history uses learnerCount/bulkImportBatchId; vNext activityEvents with runId metadata — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:868-879,1731-1763`
- vNext now: `src/modules/people/college-student-csv-service.ts:197-229`; `src/app/(authenticated)/admin/students/page.tsx:53-60`
- Fix: Show legacy When/Students and batch identity mapping

## G2-14-002-096  [P2] GAP  facet F22  effort M
- Legacy: Legacy import batch saved for history, vNext activity metadata runId differs — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:435-464`
- vNext now: `src/modules/people/college-student-csv-service.ts:197-229`
- Fix: Retain durable run ID, row count and created identities

## G2-18-031-078  [P2] GAP  facet F21  effort M
- Legacy: Legacy role and deletion actions record per-entity audit events, including bulk undo; LearnerController.java:379-385,457-460,1135-1139;FacultyController.java:648-653,685-688
- vNext now: vNext transactional membership and profile activity writes, import event; repository.ts:641-678,753-778,852-890;college-student-csv-service.ts:202-212
- Fix: Map audit action names and metadata across legacy learner/faculty IDs and new memberships, include actor scope

## G2-19-001-088  [P2] GAP  facet F22  effort M
- Legacy: Legacy `learner.bulk_import_batch_id` groups created learners `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:30-35`
- vNext now: vNext import history groups activity events, uses no batch identifier in UI runs `src/components/admin/super-admin-student-import-history.tsx:8-30`; `src/modules/people/college-student-csv-service.ts:37-52`
- Fix: Add durable import batch ID and child membership references or document no-undo retention policy explicitly.

## G2-5-027-049  [P2] GAP  facet F11  effort M
- Legacy: Legacy bulk register/undo require admin-action college and scoped superadmin org/college. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:395-455`
- vNext now: vNext Super Admin acting-college / College Admin people.manage plus academics controls. `src/modules/people/college-student-csv-service.ts:19-47`
- Fix: Compare authorization matrix for acting org and bulk undo if added.
