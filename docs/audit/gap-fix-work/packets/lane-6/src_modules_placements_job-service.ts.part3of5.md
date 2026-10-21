# Work packet: edit src/modules/placements/job-service.ts (part 3 of 5)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-repository.md, docs/audit/gap2/lane-3/l13-u019-job-model.md, docs/audit/gap2/lane-3/tpo-drive-controller.md, docs/audit/gap2/lane-5/u013-admin-job-service.md, docs/audit/gap2/lane-8/admin-job-service.md, docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md

## G2-3-015-022  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:29-39`
- vNext now: `src/modules/placements/job-service.ts:478-487`, `src/modules/placements/learner-job-service.ts:89-150`
- Fix: Legacy apply locks job row immediately before application write, serializes with soft delete; vNext job write paths lock on publish/close but learner read list not proof application apply always locks. Verify apply transaction row locking and enforce.

## G2-3-015-023  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:156-158`
- vNext now: `src/modules/placements/tpo-delete-draft-service.ts:31-36`, `src/modules/placements/job-service.ts:759-765`
- Fix: Legacy softDeleteById sets isActive false,isDeleted true,version+1 on any matching ID; vNext archives DRAFT or stops nonpublished under guarded lifecycle. Reconcile deletion policies including published-with-applications.

## G2-3-015-042  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:29-39`, `148-171`
- vNext now: `src/modules/placements/job-service.ts:478-487`, `src/modules/placements/tpo-delete-draft-service.ts:31-36`
- Fix: Legacy pessimistic row lock + version increment closes apply/delete race; vNext has for-update locks and timestamp tokens but different lifecycle archive semantics. Prove no application after archive with one atomic transaction.

## G2-13-019-031  [P1] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:54-56`
- vNext now: `src/modules/placements/job-service.ts:420-550`
- Fix: Legacy recordedOutside jobs never notify students; vNext generic published drive triggers eligible-student notices unless separately excluded.

## G2-3-023-007  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/tpo/DriveForm.java:14-57`
- vNext now: `src/components/placements/placement-job-create-form.tsx:300-383`, `src/modules/placements/job-service.ts:150-272`
- Fix: Legacy flat DriveForm/recruiter/category/deadline fields need explicit conversion to normalized company, role and eligibility records.

## G2-3-023-022  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveService.java:595-700`
- vNext now: `src/modules/placements/job-service.ts:616-765`
- Fix: Legacy close/cancel ends in-play applications, cancels interviews, settles requests and notifies; VNext job stop paths require joined cascade parity review.

## G2-3-023-032  [P1] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveService.java:631-700`
- vNext now: `src/modules/placements/job-service.ts:616-765`
- Fix: Compare notifications to every affected learner and recruiter on cancel/close including offer status and interview cancellation.

## G2-3-023-046  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:64-110`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/tpo/DriveForm.java:14-57`
- vNext now: `src/modules/placements/job-service.ts:150-417`, `src/modules/placements/tpo-drive-lifecycle-list-service.ts:15-101`
- Fix: Integer Job/DriveForm, lastSaver, nullable tenant pointers vs UUID company+season+role options require explicit historical mapping.

## G2-3-023-047  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveService.java:595-714`
- vNext now: `src/modules/placements/job-service.ts:616-765`, `src/modules/placements/tpo-drive-request-decision-service.ts:22-83`
- Fix: Legacy lifecycle fanout across application status, interview, offer and outbox vs VNext split ledgers needs transaction mapping.

## G2-5-013-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy getJobBySlug resolves public/external short job link (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:73-77`)
- vNext now: vNext getPlacementJob uses UUID job ID, no slug parameter (`src/modules/placements/job-service.ts:136-149`)
- Fix: Add old short-link redirect/resolver or record deliberate drop

## G2-5-013-011  [P1] GAP  facet F05  effort M
- Legacy: Legacy getAllJobsPaginated returns content,totalElements,totalPages,number,size (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:18-29`)
- vNext now: vNext listPlacementJobs returns query rows as an array without page metadata (`src/modules/placements/job-service.ts:86-135`)
- Fix: Add server pagination API shape and UI controls for All Drives

## G2-5-013-028  [P1] GAP  facet F09  effort M
- Legacy: Legacy getJobDeletionImpact exists for UI confirmation preview (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:52-55`)
- vNext now: vNext archivePlacementJob returns archived status, not explicit impact preview (`src/modules/placements/job-service.ts:735-766`)
- Fix: Build safe deletion preview including affected learner/interview/offer counts

## G2-5-013-037  [P1] GAP  facet F10  effort M
- Legacy: Legacy deleteJob soft-deletes and computes preview impact (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:52-55`)
- vNext now: vNext archive is a separate lifecycle state transition (`src/modules/placements/job-service.ts:735-766`)
- Fix: Match soft-delete semantics and separate archive from user delete

## G2-5-013-075  [P1] GAP  facet F19  effort M
- Legacy: Legacy paginated jobs uses count + bounded data query, safePage and safeSize (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:214-237`)
- vNext now: vNext listPlacementJobs is an unbounded college select (`src/modules/placements/job-service.ts:86-135`)
- Fix: Add server pagination before scaling to multi-year histories

## G2-8-012-002  [P1] MISSING  facet F01  effort M
- Legacy: Get job by slug supports legacy public external job URL (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2242-2278`)
- vNext now: Job service getPlacementJob expects UUID job ID, no old external slug resolver (`src/modules/placements/job-service.ts:136-149`)
- Fix: Add safe legacy public slug resolver for approved external job access; don't expose tenant data

## G2-8-012-017  [P1] GAP  facet F06  effort L
- Legacy: Target hierarchy validates class→batch/program→department and college (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2018-2137`)
- vNext now: VNext validation and roster-scoped eligibility policies (`src/modules/placements/validation.ts:557-630; src/modules/placements/job-service.ts:150-205`)
- Fix: Verify exact hierarchy/archival/tenant validation against courses/groups schema

## G2-8-012-027  [P1] GAP  facet F10  effort L
- Legacy: Legacy deleteJob soft-deletes and notifies affected applicants after commit (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:998-1079`)
- vNext now: VNext archive plus cancel/close have distinct downstream cleanup effects (`src/modules/placements/job-service.ts:616-766`)
- Fix: Preserve learner notification and application safety on any destructive action

## G2-15-026-002  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:139-163 GET job list and 169-199 individual job endpoint
- vNext now: src/modules/placements/job-service.ts:86-148 list/get under college, src/app/(authenticated)/admin/placements/page.tsx:61-69 new drive action
- Fix: Provide scoped legacy Jobs -> Drives mapping and direct job detail link

## G2-15-026-012  [P1] GAP  facet F05  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:139-163 list all jobs (including drafts, closed) for org
- vNext now: src/modules/placements/job-service.ts:86-134 active not archived, college-scoped, sort by title asc
- Fix: Restore cross-college org view and explicit draft/closed filters without exposing archived

## G2-15-026-017  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:119-125 isActive default true, isDraft default false
- vNext now: src/modules/placements/validation.ts:260-268 new lifecycle statuses, src/modules/placements/job-service.ts:150-271 season-scoped create
- Fix: Map default draft/published state to legacy flags; don't silently publish new jobs
