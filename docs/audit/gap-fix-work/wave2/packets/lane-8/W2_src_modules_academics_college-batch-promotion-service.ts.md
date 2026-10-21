# Work packet (wave 2): edit src/modules/academics/college-batch-promotion-service.ts

26 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/batch-controller.md, docs/audit/gap2/lane-5/u021-batch.md, docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md, docs/audit/gap2/lane-9/college-admin-batch-promotion.md, docs/audit/gap2/lane-9/superadmin-batch-promotion-component.md, docs/audit/gap2/lane-9/superadmin-batch-promotion.md

## G2-2-029-003  [P2] GAP  facet F01  effort M
- Legacy: BatchController.java:106-132 GET `/fetch` global or college scoped.
- vNext now: src/modules/academics/college-batch-promotion-service.ts:46-71 program/cohort scoped options.
- Fix: Provide appropriate list contract for College Admin and Super Admin scopes.

## G2-2-029-004  [P2] GAP  facet F01  effort M
- Legacy: BatchController.java:135-156 GET `/fetchByProgram`, `/fetchByCollege`.
- vNext now: src/modules/academics/cohort-service.ts:127-153 scoped by program; `college-batch-promotion-service.ts:46-71` scoped by college.
- Fix: Map legacy list/filter URLs and response envelope; preserve two read entry routes where required.

## G2-2-029-019  [P2] GAP  facet F04  effort M
- Legacy: BatchServiceImpl.java:87-90 currentStudents ignored on write and derived from learner class.
- vNext now: college-batch-promotion-service.ts:61 counts active learner enrollments from learner_program_enrollments.
- Fix: Reconcile count basis (all class members vs active cohort program enrollments).

## G2-2-029-020  [P2] GAP  facet F04  effort M
- Legacy: BatchServiceImpl.java:139-145 `getBatchDetails` returns BatchResponseDTO plus derived class/student counts.
- vNext now: college-batch-promotion-service.ts:90-109 projects program/cohort/progression; page :115-130 renders preview.
- Fix: Add equivalent detail fields and denominator semantics to new entity read model.

## G2-2-029-022  [P2] GAP  facet F05  effort M
- Legacy: BatchController.java:111-130 global/all-org/college filters for `/fetch`.
- vNext now: college-batch-promotion-service.ts:46-71 queries per-college options and program selected.
- Fix: Preserve global superadmin list and organization filter through explicit admin endpoints.

## G2-2-029-056  [P2] GAP  facet F11  effort M
- Legacy: BatchController.java:109-131 SuperAdmin `/fetch` all, org, college while learner fallback resolves full scope.
- vNext now: college-batch-promotion-service.ts:23-71 restricts options to current acting college.
- Fix: Offer explicit global-org-college list to SA, scoped learner read where needed.

## G2-2-029-088  [P2] GAP  facet F19  effort M
- Legacy: BatchController.java:106-132 fetches all batches for SA or college.
- vNext now: college-batch-promotion-service.ts:46-71 selects programs and cohorts by acting college.
- Fix: Require scoped pagination/filter for large colleges and global SA query.

## G2-2-029-106  [P2] GAP  facet F23  effort M
- Legacy: BatchController.java:109-132 superadmin supports cross-college read.
- vNext now: college-batch-promotion-service.ts:23-71 requires selected college for scoped preview.
- Fix: Add separate SA global read/filter without allowing cross-college mutations.

## G2-5-021-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy model has name, program, dates, student count, semester, academic year, status `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:19-48`
- vNext now: New cohort plus progression record split and page directory `src/db/schema/academics.ts:126-163` `src/modules/academics/college-batch-promotion-service.ts:90-108`
- Fix: Project exact legacy columns in batch UI in intended order.

## G2-5-021-005  [P2] GAP  facet F03  effort S
- Legacy: Legacy batch details show current semester getter fallback1 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:34-35,68-74`
- vNext now: New progression currentTermNumber nullable until initialized `src/modules/academics/college-batch-promotion-service.ts:90-98`
- Fix: Decide default/current-term display for uninitialized cohort.

## G2-5-021-012  [P2] GAP  facet F04  effort M
- Legacy: Legacy academicYear String with '2024-25' convention `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:37-38`
- vNext now: New cohort academicYear varchar16 plus progression academicYearStart number `src/db/schema/academics.ts:150-152` `src/modules/academics/college-batch-promotion-service.ts:93-98`
- Fix: Normalize legacy hyphen-year values to numeric start and display format.

## G2-5-021-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy usage count queries classes/students grouped per batch `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BatchRepository.java:37-53`
- vNext now: VNext count ACTIVE learner enrollments no class counts `src/modules/academics/college-batch-promotion-service.ts:56-69`
- Fix: Project classes count and single primary learner count for deletion preview.

## G2-5-021-020  [P2] GAP  facet F06  effort M
- Legacy: Legacy new currentSemester always1 `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:90-92`
- vNext now: VNext separate progression record may be absent `src/modules/academics/college-batch-promotion-service.ts:90-98`
- Fix: Initialize progression row and avoid null current-term UI.

## G2-5-021-035  [P2] GAP  facet F12  effort M
- Legacy: Legacy default semester1 even when getter sees null `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:68-74`
- vNext now: VNext progression currentTerm null until record exists `src/modules/academics/college-batch-promotion-service.ts:90-98`
- Fix: Initialize progression before promotion or display guarded onboarding.

## G2-5-021-043  [P2] GAP  facet F18  effort M
- Legacy: Legacy API field `batchName`/`currentSemester`/`academicYear` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:19-38`
- vNext now: New `name`,`currentTermNumber`,`currentAcademicYearStart` `src/db/schema/academics.ts:135-151` `src/modules/academics/college-batch-promotion-service.ts:90-98`
- Fix: Map visible labels and data formats exactly.

## G2-5-021-045  [P2] GAP  facet F19  effort M
- Legacy: Legacy query usage aggregate via batch IDs and class join `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BatchRepository.java:37-53`
- vNext now: New cohort list counts active enrollment subquery `src/modules/academics/college-batch-promotion-service.ts:56-69`
- Fix: Benchmark correlated counts for 10k per college and add indexes.

## G2-5-021-052  [P2] GAP  facet F23  effort M
- Legacy: Legacy persisted currentStudents count and implicit semester default `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:31-35`
- vNext now: New derives learner count and progression may be null `src/modules/academics/college-batch-promotion-service.ts:56-69,90-98`
- Fix: Document intentional no-count-store and fix null progression default.

## G2-14-031-007  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:159-225 preview/promotion entry points
- vNext now: src/modules/academics/college-batch-promotion-service.ts:45-80 preview requires cohort/college
- Fix: Make preview/promote discoverable from batch row

## G2-14-031-035  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BatchRequestDTO.java:21-24 currentStudents ignored and derived from learner.class links
- vNext now: src/modules/academics/college-batch-promotion-service.ts:119-140 learner enrollments and class linkage
- Fix: Document authoritative count mapping across class/section enrollments

## G2-14-031-048  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:207-225 promotion preview computes cohort effects
- vNext now: src/modules/academics/college-batch-promotion-service.ts:139-153 scans max2001 learners
- Fix: Warn on >2000 learners and offer alternative batch preview

## G2-9-002-043  [P2] GAP  facet F10  effort M
- Legacy: GET /api/v1/batch/fetchByCollege?collegeId loads all batches (`docs/legacy-source/frontend/src/api/Services/AdminService.js:138-154`)
- vNext now: Direct DB select only cohort choices (`src/modules/academics/college-batch-promotion-service.ts:43-80`)
- Fix: Add separate list query with server student counts.

## G2-9-002-073  [P2] GAP  facet F19  effort M
- Legacy: 10-row paging plus selector scales batch directory (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:442-453`)
- vNext now: Unpaged all-cohort option read (`src/modules/academics/college-batch-promotion-service.ts:41-80`)
- Fix: Page all-batch list at server or client 10 and show total.

## G2-9-028-038  [P2] GAP  facet F10  effort M
- Legacy: Preview endpoint called per selected batch and target term `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:191-205`
- vNext now: Server preview resolved from cohortId and yearStart in URL `src/modules/academics/college-batch-promotion-service.ts:76-113` `src/app/(authenticated)/admin/batch-promotion/page.tsx:37-50`
- Fix: Refresh preview after batch/year change and before action

## G2-9-022-038  [P2] GAP  facet F10  effort M
- Legacy: Preview endpoint called per selected batch and target term `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:191-205`
- vNext now: Server preview resolved from cohortId and yearStart in URL `src/modules/academics/college-batch-promotion-service.ts:76-113` `src/app/(authenticated)/admin/batch-promotion/page.tsx:37-50`
- Fix: Refresh preview after batch/year change and before action

## G2-9-028-037  [P3] GAP  facet F10  effort M
- Legacy: GET college-scoped batches and programs APIs `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:47-94` `docs/legacy-source/frontend/src/api/Services/AdminService.js:126-146`
- vNext now: Server listCollegePromotionOptions queries scoped data `src/modules/academics/college-batch-promotion-service.ts:41-74`
- Fix: Map API contract and equivalent fields

## G2-9-022-037  [P3] GAP  facet F10  effort M
- Legacy: GET college-scoped batches and programs APIs `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:47-94` `docs/legacy-source/frontend/src/api/Services/AdminService.js:126-146`
- vNext now: Server listCollegePromotionOptions queries scoped data `src/modules/academics/college-batch-promotion-service.ts:41-74`
- Fix: Map API contract and equivalent fields
