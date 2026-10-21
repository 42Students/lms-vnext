# Work packet: edit src/components/college/college-student-csv-import.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u031-people-management.md, docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-5/u027-learner-controller.md, docs/audit/gap2/lane-7/u036-cross-exports-imports.md, docs/audit/gap2/lane-14/super-admin-students.md

## G2-18-031-041  [P1] GAP  facet F10  effort L
- Legacy: Legacy learner POST /register, /bulk-validate, /bulk-register, /bulk-imports and undo, PUT /update/{id}, DELETE /delete/{id}; LearnerController.java:338-465,1065-1141
- vNext now: vNext POST /api/people/onboard, /api/people/student-import PREVIEW/IMPORT, /api/people/{membershipId} profile/lifecycle PATCH; college-student-register-form.tsx:42-69;college-student-csv-import.tsx:42-58;api/people/[membershipId]/lifecycle/route.ts:15-49
- Fix: Write route/payload/status migration sheet and explicitly resolve old undo and hard-delete APIs, no unsafe replacement

## G2-19-001-058  [P1] GAP  facet F12  effort L
- Legacy: Legacy bulk import persists successful rows individually and has `bulkImportBatchId` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:246-254`,310-368,387-405
- vNext now: vNext import per-row partial onboarding and activity log record, no common batch ID evident in UI `src/modules/people/college-student-csv-service.ts:37-52`; `src/components/college/college-student-csv-import.tsx:132-165`
- Fix: Expose stable batch grouping/rollback policy, audit each partial row, and document manual recovery.

## G2-19-001-082  [P1] GAP  facet F20  effort S
- Legacy: Legacy FileReader sequence prevents slow old CSV selection overwriting latest upload `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:729-756`
- vNext now: vNext `await file.text()` callback lacks selection sequence guard `src/components/college/college-student-csv-import.tsx:103-109`
- Fix: Add monotonically increasing file-select revision and ignore late reads after newer selection.

## G2-5-027-012  [P1] MISSING  facet F03  effort M
- Legacy: Legacy bulk import list and undo buttons require one-click confirmation/counter. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:436-468`
- vNext now: vNext shows bulk CSV preview/report; undo control not mapped in import flow. `src/app/(authenticated)/admin/students/page.tsx:70-80`, `src/components/college/college-student-csv-import.tsx:27-56`
- Fix: Restore batch-level Undo import action with confirmation and safe compensation.

## G2-5-027-040  [P1] MISSING  facet F09  effort M
- Legacy: Legacy undo bulk action invoked by admin UI; backend returns count. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:449-465`
- vNext now: vNext preview/import page has guarded confirm checkbox, no undo dialog in mapped importer. `src/components/college/college-student-csv-import.tsx:31-56`, `src/app/(authenticated)/admin/students/page.tsx:70-80`
- Fix: Add import-history undo modal showing affected identities and counts.

## G2-5-027-060  [P1] GAP  facet F14  effort M
- Legacy: Legacy bulk body JSON of up to 500 learner items; no CSV needed. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BulkRegisterRequest.java:20-34`
- vNext now: vNext CSV/paste headers and 1MB input, 500-row max. `src/components/college/college-student-csv-import.tsx:27-65`, `src/modules/people/college-student-csv-model.ts:29-31`
- Fix: Accept structured JSON or provide deterministic transform for old upload clients.

## G2-7-036-052  [P1] MISSING  facet F13  effort M
- Legacy: Students.js:868-879 Import history modal for batches
- vNext now: college-student-csv-import.tsx:31-170 only current transient report
- Fix: Restore import history, batch IDs and recovery lookup

## G2-7-036-074  [P1] GAP  facet F20  effort M
- Legacy: Students.js:604-630 async selected file version guard
- vNext now: college-student-csv-import.tsx:103-109 async file.text and assign without versioned guard
- Fix: Add latest-file-wins guard and invalidate preview

## G2-7-036-083  [P1] MISSING  facet F23  effort M
- Legacy: Students.js:868-879 import batch history
- vNext now: college-student-csv-import.tsx:31-170 current report only
- Fix: Provide persisted batch history

## G2-14-002-045  [P2] GAP  facet F08  effort S
- Legacy: Legacy Parsed N row(s). Select program & class, then Validate or Create.; vNext preview status not same toast — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:729-756`
- vNext now: `src/components/college/college-student-csv-import.tsx:31-68,125-143`
- Fix: Add exact parse confirmation message

## G2-14-002-046  [P2] GAP  facet F08  effort S
- Legacy: Legacy Created N learner(s) or Created N; F failed with toast; vNext inline result report — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:849-865`
- vNext now: `src/components/college/college-student-csv-import.tsx:125-166`
- Fix: Add result toast and keep full report

## G2-19-001-040  [P2] GAP  facet F08  effort S
- Legacy: Legacy bulk-validation pass toast `Validation passed for N learner(s).` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:804-809`
- vNext now: vNext renders dry-run report and banner instead `src/components/college/college-student-csv-import.tsx:127-135`
- Fix: Show matching validation pass toast plus row report.

## G2-19-001-041  [P2] GAP  facet F08  effort M
- Legacy: Legacy bulk creation toast `Created N learner(s).` or partial warning/error `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:855-864`
- vNext now: vNext renders import result report summary `X structurally valid; Y invalid` `src/components/college/college-student-csv-import.tsx:127-149`
- Fix: Add exact success/partial/failure completion messages and retained row-level result.

## G2-7-036-030  [P2] GAP  facet F07  effort S
- Legacy: Students.js:857-863 Created N; M failed...
- vNext now: college-student-csv-import.tsx:127-170 result panel with status counts
- Fix: Match immediate partial failure message and report

## G2-7-036-032  [P2] GAP  facet F08  effort S
- Legacy: Students.js:855-863 success Created N learner(s).; partial Created N; M failed.
- vNext now: college-student-csv-import.tsx:127-170 Import result table rather than count toast
- Fix: Show legacy success/warning count and keep result table
