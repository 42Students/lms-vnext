# Work packet (wave 2): edit src/modules/placements/college-application-stage-service.ts

29 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-shortlisted.md, docs/audit/gap2/lane-12/job-application.md, docs/audit/gap2/lane-13/job-application-status-validator.md, docs/audit/gap2/lane-14/u011-placement-job-service-impl.md, docs/audit/gap2/lane-17/placement-job-service.md

## G2-10-011-057  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:98-105 — WITHDRAWN retains statusBeforeWithdrawal; learner reapply uses special gate.
- vNext now: src/modules/placements/college-application-stage-service.ts:57-66 — Only SUBMITTED applications can be stage-moved, withdrawn disabled.
- Fix: Preserve previous-withdrawal state in detail and clarify reactivation path.

## G2-10-015-074  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:551-580 — Pagination fetch server 20 each for isAdminMode; counts fetched across all.
- vNext now: src/modules/placements/college-application-stage-service.ts:18-31 — Modern stage page 25 plus counts across all.
- Fix: Align size and snapshot count calculations.

## G2-12-019-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy job application drives Learner My Applications, admin/TPO stage controls `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-46,139-171`
- vNext now: New listOwnPlacementApplications and college stage pipeline service with separate workflows `src/modules/placements/application-service.ts:955-1056` `src/modules/placements/college-application-stage-service.ts:18-31`
- Fix: Maintain legacy stage fields and navigation semantics in all actor views.

## G2-12-019-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy rejectionReason VARCHAR500 student-facing `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:91-96`
- vNext now: New core no rejection reason, screening candidateMessage separate `src/db/schema/placements.ts:1114-1145` `src/modules/placements/college-application-stage-service.ts:141-149`
- Fix: Project candidate-facing reason, enforce 500 char equivalent.

## G2-12-019-023  [P2] GAP  facet F05  effort S
- Legacy: Legacy stage list can sort/filter persisted applicationStatus `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30`
- vNext now: New list sorted submittedAt desc and stage joined from screening/candidate flags `src/modules/placements/application-service.ts:955-1056` `src/modules/placements/college-application-stage-service.ts:25-31`
- Fix: Provide stable stage label/sort and source status mapping.

## G2-12-019-050  [P2] GAP  facet F18  effort S
- Legacy: Old user-visible pipeline APPLIED/SHORTLISTED/ASSESSMENT/INTERVIEW/OFFERED/REJECTED/HIRED `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30`
- vNext now: New row status SUBMITTED and separate stages have differing names `src/modules/placements/college-application-stage-service.ts:25-31` `src/db/schema/placements.ts:993-995`
- Fix: Restore old stage wording and explanatory labels.

## G2-13-010-008  [P2] GAP  facet F03  effort M
- Legacy: REJECTED directly reactivates to APPLIED in backend validator (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:42-43`)
- vNext now: New map REJECTED:[] but separate REINSTATE action restores APPLIED/SHORTLISTED (`src/modules/placements/college-application-stage-service.ts:75-78`)
- Fix: Expose action under correct label and enforce previousStage validity.

## G2-13-010-011  [P2] GAP  facet F04  effort S
- Legacy: Old isValidTransition returns true for identical nonnull status strings (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:72-75`)
- vNext now: New move same stage throws `Application is already in selected stage.` (`src/modules/placements/college-application-stage-service.ts:75-81`)
- Fix: Treat no-op idempotently or explicitly surface intentional stricter behavior.

## G2-13-010-032  [P2] GAP  facet F10  effort L
- Legacy: Old bulk status application to 100 rows uses same valid transition helper (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:115-131`)
- vNext now: New per-row transactions and schema max 100 selected ids; up to 3000 matching (`src/modules/placements/college-application-stage-service.ts:39-49`)
- Fix: Check preflight preview/no partial-completion semantics across 3000 records.

## G2-13-010-037  [P2] GAP  facet F12  effort M
- Legacy: Old REJECTED→APPLIED allowed (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:42-43`)
- vNext now: New requires REINSTATE and previousStage fallback (`src/modules/placements/college-application-stage-service.ts:75-79`)
- Fix: Preserve restored original stage only when recorded and guard active offers.

## G2-13-010-041  [P2] GAP  facet F13  effort S
- Legacy: Old invalid move includes permitted options (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:106-111`)
- vNext now: New invalid stage message omits options (`src/modules/placements/college-application-stage-service.ts:79-81`)
- Fix: Show actual permitted stages in response for recoverable form.

## G2-13-010-047  [P2] GAP  facet F17  effort S
- Legacy: Legacy same status no-op permitted in UI (`docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:21-26`)
- vNext now: New same stage disabled/rejected by server (`src/modules/placements/college-application-stage-service.ts:75-81`)
- Fix: Preserve clear no-op feedback and disable duplicates before submit.

## G2-13-010-048  [P2] GAP  facet F18  effort S
- Legacy: Legacy error says Cannot move from X to Y (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:58-61`)
- vNext now: New error Invalid transition: X to Y (`src/modules/placements/college-application-stage-service.ts:79-81`)
- Fix: Choose exact wording for parity.

## G2-13-010-050  [P2] GAP  facet F18  effort S
- Legacy: Legacy bulk preview says Not in play for terminal stage (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:121-131`)
- vNext now: New `Only a rejected application can be reinstated` or invalid transition (`src/modules/placements/college-application-stage-service.ts:75-81`)
- Fix: Retain reason for each skipped selected row.

## G2-13-010-052  [P2] GAP  facet F19  effort L
- Legacy: Old bulk loops up to 100 in single transactional method (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:115-131`)
- vNext now: New serial per-row transactions can run up to 3000 filters (`src/modules/placements/college-application-stage-service.ts:39-51`)
- Fix: Benchmark and bound write time, provide resumable partial-result report.

## G2-14-011-037  [P2] GAP  facet F09  effort M
- Legacy: Legacy bulk status accepts optional rejectionReason and assessmentUrl `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:639-646`
- vNext now: New stage command reason and notification options `src/modules/placements/college-application-stage-service.ts:33-40`
- Fix: Support equivalent conditional fields and validation

## G2-14-011-045  [P2] GAP  facet F10  effort M
- Legacy: Legacy same status is no-op except assessment link notification `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1119-1147`
- vNext now: New stage rejects already selected stage `src/modules/placements/college-application-stage-service.ts:74-80`
- Fix: Decide equivalent idempotent repeat behavior

## G2-14-011-051  [P2] GAP  facet F12  effort M
- Legacy: Legacy closed/deleted jobs allow REJECTED cleanup and no-op `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1092-1116`
- vNext now: New stage writes reject CLOSED ARCHIVED CANCELLED `src/modules/placements/college-application-stage-service.ts:52-58`
- Fix: Allow rejection cleanup while preventing advancement

## G2-14-011-053  [P2] GAP  facet F12  effort M
- Legacy: Legacy bulk max 100 optionally configuration-driven and same job `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1358-1396`
- vNext now: New bulk cap from DRIVE_APPLICATION_BULK_CAP `src/modules/placements/college-application-stage-service.ts:33-47`
- Fix: Set same cap and allow configurable policy

## G2-14-011-067  [P2] GAP  facet F18  effort S
- Legacy: Legacy invalid status transition wording includes valid choices `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:106-112`
- vNext now: New stage error does not include allowed transitions `src/modules/placements/college-application-stage-service.ts:74-110`
- Fix: Use actionable error wording with valid stages

## G2-17-012-047  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:106-117 — Uses status vocabulary INTERVIEW/OFFERED/HIRED.
- vNext now: src/modules/placements/college-application-stage-service.ts:27-29 — Stage label derived APPLIED/SHORTLISTED/REJECTED.
- Fix: Keep label translation table, avoid leaking raw codes.

## G2-2-016-053  [P2] GAP  facet F22  effort M
- Legacy: Legacy JobApplicationStatusHistory records every real status transition (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1378-1445,1986-2002`)
- vNext now: VNext placementApplicationStatusHistory, audit events, college stages (`src/modules/placements/college-application-stage-service.ts:18-188`)
- Fix: Match old/new status and actor/reason timestamps without erasing withdrawn/rejected history

## G2-2-016-088  [P2] GAP  facet F06  effort M
- Legacy: Legacy single status edit body `applicationStatus` plus assessment/reason optional `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:637-679`
- vNext now: New college stage action uses command schema with action/stage/reason and job scope `src/modules/placements/college-application-stage-service.ts:33-56`
- Fix: Map direct status changes to typed pipeline command with old status defaults

## G2-8-012-053  [P2] GAP  facet F22  effort M
- Legacy: Legacy JobApplicationStatusHistory records every real status transition (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1378-1445,1986-2002`)
- vNext now: VNext placementApplicationStatusHistory, audit events, college stages (`src/modules/placements/college-application-stage-service.ts:18-188`)
- Fix: Match old/new status and actor/reason timestamps without erasing withdrawn/rejected history

## G2-9-014-055  [P2] GAP  facet F10  effort M
- Legacy: `src/modules/placements/college-application-stage-service.ts:47-65` — Legacy bulk status endpoint accepts up to100 per call and caller chunks selected rows.
- vNext now: `src/modules/placements/college-application-stage-service.ts:47-65` — VNext per-app transactions loop, 3000 bulk cap and explicit skipped results.
- Fix: Preserve partial-result reporting and batch UX.

## G2-9-014-062  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:994-1058` — Maximum 3000 select-all and 100-record bulk chunks, partial failure counted.
- vNext now: `src/modules/placements/college-application-stage-service.ts:39-49` — VNext max3000 with per-row transaction, duplicate prevention in service.
- Fix: Match progress, failure and action count UX.

## G2-9-014-084  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:994-1058` — Bulk fetches up to3000 and submits in chunks of100; shows subset warning.
- vNext now: `src/modules/placements/college-application-stage-service.ts:39-49` — Bulk service bounded 3000, per-row transaction with results.
- Fix: Benchmark 3000-case and expose progress/partial failures.

## G2-9-014-087  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:992-1058` — Mutation guard refs and 100-item chunks avoid double click/over-large bulk.
- vNext now: `src/modules/placements/college-application-stage-service.ts:33-50` — Per-row transaction, no shortlist-side duplicate click controls.
- Fix: Add pending state and idempotency review for new action UI.

## G2-9-014-089  [P2] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:4-28` — Same-status application transition is safe no-op; withdrawn admin transition forbidden.
- vNext now: `src/modules/placements/college-application-stage-service.ts:75-81` — Application already in selected stage is error; WITHDRAWN not transition.
- Fix: Show no-op as nonerror or disable same-stage choice.
