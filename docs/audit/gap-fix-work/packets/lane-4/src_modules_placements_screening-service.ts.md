# Work packet: edit src/modules/placements/screening-service.ts

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/placement-job-service.md, docs/audit/gap2/lane-5/l13-u021-application-screening-entity.md, docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md

## G2-17-012-020  [P1] GAP  facet F06  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:114-117 — Rejection requires optional rejectionReason and assessmentUrl.
- vNext now: src/modules/placements/screening-service.ts:277-320 — Screening decision schema with status, expectations and candidate messaging.
- Fix: Map rejection reason/assessment URL and notification policy.

## G2-17-012-022  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:485-494 — Changing screeningVersion after first application is rejected.
- vNext now: src/modules/placements/screening-service.ts:277-320 — Screening API decisions use expectedUpdatedAt; version lock not shown.
- Fix: Preserve screening schema version freeze after applications.

## G2-13-021-001  [P1] GAP  facet F01  effort M
- Legacy: Legacy screening result runs after job application submission, one per application. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:13-20`
- vNext now: vNext screening queue is human decision workflow, not an automatic score card. `src/modules/placements/screening-service.ts:152-227`
- Fix: Choose whether to reimplement explainable scoring or explicitly sunset numeric matching.

## G2-13-021-013  [P1] GAP  facet F05  effort M
- Legacy: Legacy all screening results by job ordered overallScore DESC. `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ApplicationScreeningRepository.java:23-26`
- vNext now: vNext queue sorted status and ID/time, no score ranking. `src/modules/placements/screening-service.ts:173-227`
- Fix: Restore sortable screening score view.

## G2-13-021-016  [P1] GAP  facet F06  effort M
- Legacy: Legacy default screeningVersion v1, screenedAt generated on insert. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:108-116`
- vNext now: vNext decision writes only on manual action; no version input. `src/modules/placements/screening-service.ts:329-389`
- Fix: Fix timestamp meaning and model version.

## G2-13-021-018  [P1] GAP  facet F07  effort M
- Legacy: Legacy pending row created if missing, screenedBy SYSTEM/method AUTOMATED_V1 only if null. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ScreeningServiceImpl.java:80-107`
- vNext now: vNext missing screening throws PLACEMENT_SCREENING_NOT_FOUND. `src/modules/placements/screening-service.ts:98-103`
- Fix: Populate expected screening row on application create and support repair.

## G2-13-021-021  [P1] GAP  facet F08  effort M
- Legacy: Legacy marks auto screening COMPLETED on success. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ScreeningServiceImpl.java:236-241`
- vNext now: vNext manual decision marks SHORTLISTED/HOLD/REJECTED; unrelated state. `src/modules/placements/screening-service.ts:355-384`
- Fix: Keep distinct completion vs disposition messaging.

## G2-13-021-022  [P1] GAP  facet F08  effort M
- Legacy: Legacy failures produce FAILED result with diagnostics. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ScreeningServiceImpl.java:80-107`
- vNext now: vNext missing row error, not FAILED with retry diagnostics. `src/modules/placements/screening-service.ts:98-103`
- Fix: Expose failure reason and controlled rescreen action.

## G2-13-021-025  [P1] GAP  facet F10  effort M
- Legacy: Legacy transactional screenApplication creates/updates ApplicationScreening and algorithm provenance. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ScreeningServiceImpl.java:61-107`
- vNext now: vNext decidePlacementScreening manually updates status with CAS. `src/modules/placements/screening-service.ts:277-455`
- Fix: Separate automatic run from human disposition service.

## G2-13-021-026  [P1] GAP  facet F10  effort M
- Legacy: Legacy computes skills+education, average available components and explanation. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ScreeningServiceImpl.java:110-239`
- vNext now: vNext no score calculation; manual status only. `src/modules/placements/screening-service.ts:277-455`
- Fix: If parity needed implement deterministic explainable evaluator.

## G2-13-021-033  [P1] GAP  facet F12  effort M
- Legacy: Legacy excludes unavailable dimensions instead of counting as zero. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:81-102`
- vNext now: vNext human decision has no fairness partial flag. `src/modules/placements/screening-service.ts:277-455`
- Fix: Restore inclusion/exclusion algorithm and provenance.

## G2-13-021-048  [P1] MISSING  facet F21  effort M
- Legacy: Legacy background scorer started after application save. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:13-16`
- vNext now: vNext manual queue service; no async scoring worker here. `src/modules/placements/screening-service.ts:277-455`
- Fix: Implement worker trigger or mark scoring intentionally removed.

## G2-13-021-052  [P1] GAP  facet F23  effort M
- Legacy: Legacy scoring automatically calculated skills/education; optional AI future comment, not deployed. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:13-16`
- vNext now: vNext intentionally no AI grade/screening model, human decisions only. `src/modules/placements/screening-service.ts:277-455`
- Fix: Owner explicitly decide whether deterministic matching score retained, without AI.

## G2-15-026-020  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:671-725 single status accepts newStatus/rejectionReason/assessmentUrl
- vNext now: src/modules/placements/screening-service.ts:277-330 separate screening decision API with constrained transitions
- Fix: Map single status transitions and reason/assessment URL fields to specialized services

## G2-15-026-034  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:509-573 notes,579-665 bulk statuses,671-753 single statuses
- vNext now: src/modules/placements/screening-service.ts:277-440 screening; src/modules/placements/tpo-bulk-application-stage-service.ts:75-135 test/interview stage only
- Fix: Create service dispatch for notes/status/bulk flows, actor audit, per-item failure

## G2-15-026-038  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30 status APPLIED, SHORTLISTED, ASSESSMENT, INTERVIEW, OFFERED, REJECTED, HIRED
- vNext now: src/modules/placements/tpo-bulk-application-stage-service.ts:19-23 TEST/INTERVIEW and src/modules/placements/screening-service.ts:129-145 screening SHORTLISTED/REJECTED; src/modules/admin-ui/super-admin-placement-applications-service.ts:14-17 submission and independent stage
- Fix: Publish clear mapping between legacy single lifecycle and vNext independent screening/stage/offer transitions

## G2-15-026-028  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:727-729 'Application status updated successfully'
- vNext now: src/modules/placements/screening-service.ts:277-440 uses screening specific transition with changed stage
- Fix: Show exact status update success toast or approved stage-specific copy
