# Work packet: edit src/modules/placements/tpo-bulk-application-stage-service.ts

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/job-application-status-validator.md, docs/audit/gap2/lane-14/u011-placement-job-service-impl.md, docs/audit/gap2/lane-5/u013-admin-job-service.md, docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md, docs/audit/gap2/lane-8/tpo-applicant-controller.md, docs/audit/gap2/lane-2/admin-job-controller.md

## G2-13-010-056  [P1] GAP  facet F21  effort L
- Legacy: Old validator used across JobServiceImpl and ApplicationTransitionService (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:54-62`)
- vNext now: New college/TPO/round stage services each enforce local rules (`src/modules/placements/tpo-bulk-application-stage-service.ts:19-23`)
- Fix: Centralize shared transition definitions or document divergence to avoid cross-lane inconsistent moves.

## G2-14-011-043  [P1] GAP  facet F10  effort L
- Legacy: Legacy rejection/leaving interview stage cancels active interviews `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:163-187` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1245-1247`
- vNext now: New stage service has offer gating and persisted rounds `src/modules/placements/college-application-stage-service.ts:74-110` `src/modules/placements/tpo-bulk-application-stage-service.ts:76-132`
- Fix: Implement associated interview cancellations and notifications

## G2-14-011-074  [P1] GAP  facet F20  effort L
- Legacy: Legacy status updates lock job and other applications in consistent order `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1169-1186` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1290-1327`
- vNext now: New stage writes use version checks and locks `src/modules/placements/college-application-stage-service.ts:49-71` `src/modules/placements/tpo-bulk-application-stage-service.ts:101-109`
- Fix: Document and test global lock ordering including interview/offers

## G2-5-013-016  [P1] GAP  facet F05  effort M
- Legacy: Legacy bulk status applications cap 100 and reports failed per ID (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:100-116`)
- vNext now: vNext bulk stage service mutates one application per call (`src/modules/placements/tpo-bulk-application-stage-service.ts:77-99`)
- Fix: Wrap stage operations into 100-item batch with per-item results

## G2-5-013-045  [P1] GAP  facet F10  effort L
- Legacy: Legacy updateApplicationStatus has optional assessment URL and rejection reason, two overloads (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:79-98`)
- vNext now: vNext bulk stage mutation only action+expectedVersion, not same application status enum (`src/modules/placements/tpo-bulk-application-stage-service.ts:77-99`)
- Fix: Build mapping for each canonical stage, notes and assessment persistence policy

## G2-5-013-046  [P1] GAP  facet F10  effort L
- Legacy: Legacy bulkUpdateApplicationStatus has two overloads and independent per-item transaction (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:100-116`)
- vNext now: vNext bulk-stage writer operates per-item CAS transaction (`src/modules/placements/tpo-bulk-application-stage-service.ts:77-99`)
- Fix: Add batch orchestration, 100 cap and failed-list response semantics

## G2-15-026-019  [P1] GAP  facet F06  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:579-646 bulk-status accepts up to100 numeric applicationIds,newStatus,rejectionReason,assessmentUrl
- vNext now: src/modules/placements/tpo-bulk-application-stage-service.ts:12-23 stage actions MOVE_TEST/MOVE_INTERVIEW only
- Fix: Offer bulk legacy shortlist/reject/offer/hire choices with reason and assessment URL

## G2-15-026-034  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:509-573 notes,579-665 bulk statuses,671-753 single statuses
- vNext now: src/modules/placements/screening-service.ts:277-440 screening; src/modules/placements/tpo-bulk-application-stage-service.ts:75-135 test/interview stage only
- Fix: Create service dispatch for notes/status/bulk flows, actor audit, per-item failure

## G2-15-026-038  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30 status APPLIED, SHORTLISTED, ASSESSMENT, INTERVIEW, OFFERED, REJECTED, HIRED
- vNext now: src/modules/placements/tpo-bulk-application-stage-service.ts:19-23 TEST/INTERVIEW and src/modules/placements/screening-service.ts:129-145 screening SHORTLISTED/REJECTED; src/modules/admin-ui/super-admin-placement-applications-service.ts:14-17 submission and independent stage
- Fix: Publish clear mapping between legacy single lifecycle and vNext independent screening/stage/offer transitions

## G2-15-026-058  [P1] GAP  facet F20  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:579-665 partial failures show count, malformed types fail before writes
- vNext now: src/modules/placements/tpo-bulk-application-stage-service.ts:75-135 each single stage transaction and independent bulk preview
- Fix: Implement deterministic partial result and idempotency/retry contract for batch statuses

## G2-15-026-064  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:13-35 old/newStatus/changedAt/actor/rejectionReason
- vNext now: src/modules/placements/tpo-bulk-application-stage-service.ts:111-131 stage row and activityEvents; no direct equivalent status history table in scope
- Fix: Provide chronological single-application history merging screening/stage/offer events and actor/reason

## G2-8-023-068  [P1] GAP  facet F22  effort M
- Legacy: Legacy JobApplication linked by integer job and learner ID; legacy status machine transitions in ApplicationTransitionService (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:53-77,115-151).
- vNext now: New placementApplications UUID membership+role, screening and TPO stage additional table (src/modules/placements/bulk-drive-service.ts:314-330; src/modules/placements/tpo-bulk-application-stage-service.ts:105-120).
- Fix: Create status/source/history crosswalk before migration and use single canonical lifecycle semantics.

## G2-14-011-032  [P2] GAP  facet F07  effort S
- Legacy: Stale application version maps to user-facing 409 message `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:734-744`
- vNext now: New stage has version token and stale error `src/modules/placements/tpo-bulk-application-stage-service.ts:101-109`
- Fix: Return 409 with comparable refresh text

## G2-2-016-022  [P2] GAP  facet F08  effort M
- Legacy: Bulk application status collects per-item errors rather than failing entire batch (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1550-1585`)
- vNext now: VNext bulk stage service uses preview/strict mutation (`src/modules/placements/tpo-bulk-application-stage-service.ts:27-110`)
- Fix: Restore per-item partial results with single guarded outcome confirmation

## G2-8-012-022  [P2] GAP  facet F08  effort M
- Legacy: Bulk application status collects per-item errors rather than failing entire batch (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1550-1585`)
- vNext now: VNext bulk stage service uses preview/strict mutation (`src/modules/placements/tpo-bulk-application-stage-service.ts:27-110`)
- Fix: Restore per-item partial results with single guarded outcome confirmation

## G2-15-026-023  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:608-636 malformed bulk ids/newStatus and max100 exact errors
- vNext now: src/modules/placements/tpo-bulk-application-stage-service.ts:75-135 action/version guarded separately
- Fix: Display field-level ids status/max100 errors and failed-rows report

## G2-15-026-027  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:648-653 'Bulk status update completed' or '...with N failure(s)'
- vNext now: src/modules/placements/tpo-bulk-application-stage-service.ts:75-135 single-application move; separate bulk coordinator required
- Fix: Restore count-aware partial completion summary with per-ID failures
