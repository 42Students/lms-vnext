# Work packet: edit src/modules/people/college-student-csv-service.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-15/l18-u031-people-management.md, docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-5/u019-learner.md, docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-14-002-040  [P1] GAP  facet F07  effort M
- Legacy: Legacy bulk validates duplicate phone/email/roll in file and DB with specific row issues; vNext validation service has different status contracts — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:759-806`
- vNext now: `src/modules/people/college-student-csv-service.ts:81-129`
- Fix: Map duplicate classes to exact errors and row numbers

## G2-18-031-033  [P1] GAP  facet F07  effort M
- Legacy: Legacy CSV pre-validates mobile/email/roll duplicates, blocks create if validationKey stale or any duplicate; Students.js:759-865
- vNext now: vNext PREVIEW checks identity/roll/cohort conflicts but may return PARTIAL after separate provider provisioning; college-student-csv-service.ts:79-145,146-194
- Fix: Keep preflight validation cache linked to exact CSV/selected academic options, indicate per-row post-preflight races

## G2-18-031-076  [P1] GAP  facet F20  effort M
- Legacy: Legacy bulk-import undo groups rows by batch ID; Learner.java:30-34;LearnerController.java:449-463
- vNext now: vNext per-row identities may be created before enrollment fails, returns PARTIAL with membership ID; college-student-csv-service.ts:143-194
- Fix: Implement idempotent retry for PARTIAL that never duplicates active identity/membership or mixes college rosters

## G2-19-001-058  [P1] GAP  facet F12  effort L
- Legacy: Legacy bulk import persists successful rows individually and has `bulkImportBatchId` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:246-254`,310-368,387-405
- vNext now: vNext import per-row partial onboarding and activity log record, no common batch ID evident in UI `src/modules/people/college-student-csv-service.ts:37-52`; `src/components/college/college-student-csv-import.tsx:132-165`
- Fix: Expose stable batch grouping/rollback policy, audit each partial row, and document manual recovery.

## G2-5-019-045  [P1] GAP  facet F10  effort L
- Legacy: Legacy bulk learner save uses REQUIRES_NEW per row `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:74-82`
- vNext now: VNext identity provision then enrollment/profile/section may return PARTIAL `src/modules/people/college-student-csv-service.ts:143-196`
- Fix: Make partial stages retryable and dedupe identities.

## G2-5-019-064  [P1] GAP  facet F20  effort L
- Legacy: Legacy import per-row transaction failures may leave earlier rows `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:74-82`
- vNext now: New onboarding may succeed while enrollment fails and returns PARTIAL `src/modules/people/college-student-csv-service.ts:143-196`
- Fix: Offer deterministic resume/recovery without creating duplicate identities.

## G2-5-027-036  [P1] MISSING  facet F08  effort M
- Legacy: Legacy undo returns `Undone: N learner(s) removed`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:455-461`
- vNext now: vNext import creates summary audit but lacks exposed compensating undo result in this service. `src/modules/people/college-student-csv-service.ts:198-227`
- Fix: Implement reversible import batch action with exact count.

## G2-5-027-044  [P1] GAP  facet F10  effort M
- Legacy: Legacy bulk-register accepts JSON learners array, creates batch with undo support. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:408-434`
- vNext now: vNext IMPORT CSV runs canonical account/enrollment per row and stores count event. `src/modules/people/college-student-csv-service.ts:136-205`
- Fix: Implement per-import compensation and bridge structured JSON option.

## G2-5-027-061  [P1] MISSING  facet F14  effort M
- Legacy: Legacy GET import history and POST undo per batch. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:436-468`
- vNext now: vNext limited activity history and download CSV results but not reversible batch records. `src/modules/people/college-student-csv-service.ts:198-227`
- Fix: Store stable batch IDs/entry ledger enabling import rollback.

## G2-5-027-075  [P1] GAP  facet F20  effort M
- Legacy: Legacy import batch undo soft deletes learners created by that batch. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:408-468`
- vNext now: vNext per-row partially succeeds; no compensating rollback means retries risk duplicate memberships. `src/modules/people/college-student-csv-service.ts:136-205`
- Fix: Persist import batch id and idempotency key per row; safe selective undo.

## G2-5-027-083  [P1] GAP  facet F22  effort M
- Legacy: Legacy bulk import batch ID with undo association. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:436-468`
- vNext now: vNext count-only activity event with recent 50 history, no per-learner batch membership ledger. `src/modules/people/college-student-csv-service.ts:198-227`
- Fix: Add batch provenance table for reversible import and accounting.

## G2-5-019-042  [P2] GAP  facet F08  effort M
- Legacy: Legacy bulk import records batch UUID for undo history `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:30-34`
- vNext now: VNext returns runId and per-row IMPORTED/PARTIAL/FAILED `src/modules/people/college-student-csv-service.ts:187-213`
- Fix: Map batch history receipt/counts and error wording.
