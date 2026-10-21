# Work packet: edit src/modules/placements/application-service.ts (part 3 of 3)

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/job-application-status-history.md, docs/audit/gap2/lane-1/l19-u021-apply-to-job-request.md, docs/audit/gap2/lane-18/job-service-impl.md, docs/audit/gap2/lane-20/job-service.md, docs/audit/gap2/lane-3/job-application-status-history-service.md

## G2-8-019-046  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:29-52 unchanged no-op, failed record swallowed
- vNext now: src/modules/placements/application-service.ts:848-880,1268-1278 atomic history insert
- Fix: Add idempotent duplicate transition handling while preserving atomicity.

## G2-19-021-014  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:454-457 — duplicate application yields 409 You have already applied to this job
- vNext now: src/modules/placements/application-service.ts:641-643 — returns existing same-channel record
- Fix: Clarify repeated click idempotence and no misleading new-success toast

## G2-18-011-025  [P2] MISSING  facet F07  effort M
- Legacy: Legacy resumeUrl >2048 error `Resume URL must be at most 2048 characters` (`JobServiceImpl.java:400-405`).
- vNext now: New app input has no raw resumeUrl (role/channel input) and schema no resume field (`application-service.ts:570-616`; `placements.ts:973-1020`).
- Fix: Add secure resume picker and exact length validation at API boundary.

## G2-18-011-028  [P2] GAP  facet F07  effort S
- Legacy: Legacy incomplete hierarchy `Learner hierarchy is incomplete; cannot apply to jobs.` (`JobServiceImpl.java:448-456`).
- vNext now: New if no exact active enrollment returns empty list; write returns PLACEMENT_APPLICATION_INELIGIBLE (`learner-job-service.ts:155-165`; `application-service.ts:647-654`).
- Fix: Preserve precise recovery message; don't leak target details.

## G2-18-011-030  [P2] GAP  facet F07  effort S
- Legacy: Legacy rejected advanced application reapply error includes stage (`JobServiceImpl.java:545-575`).
- vNext now: New rejects withdrawn after prior offer/round/screening with PLACEMENT_APPLICATION_ALREADY_WITHDRAWN (`application-service.ts:819-837`).
- Fix: Provide safe stage-specific explanation to learner.

## G2-18-011-031  [P2] GAP  facet F08  effort M
- Legacy: Legacy application success triggers JOB_APPLICATION_CONFIRMATION dispatcher notification non-blocking (`JobServiceImpl.java:1608-1649`).
- vNext now: New `deliverRecordedLearnerPlacementEvent` invoked via activity service and app event (`application-service.ts:10-13,856-870`).
- Fix: Compare notification template, channels and after-commit timing; don't fail apply on send.

## G2-18-011-033  [P2] GAP  facet F08  effort M
- Legacy: Legacy withdraw notification to admin after transaction commit (`JobServiceImpl.java:1085-1165`).
- vNext now: New transactional audit + event delivery mechanism, different template (`application-service.ts:1094-1134,1240-1320`).
- Fix: Audit admin recipient and exact withdrawal notification under new mechanism.

## G2-20-012-014  [P2] GAP  facet F07  effort S
- Legacy: Legacy apply throws IllegalArgumentException if not visible, inactive or deadline passed `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:74-94`
- vNext now: New PlacementsServiceError and guards with typed codes `src/modules/placements/application-service.ts:74-102`
- Fix: Normalize error mapping to user-friendly exact visibility/deadline/duplicate states

## G2-3-013-016  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:29-36`
- vNext now: `src/db/schema/placements.ts:1096-1109`, `src/modules/placements/application-service.ts:848-882`
- Fix: Legacy invalid/null applicationId or newStatus silently skips record with warn, and no-op for case-insensitive same status; vNext DB rejects constraint/shape errors. Add typed, non-lossy handling/idempotency.

## G2-18-011-029  [P3] GAP  facet F07  effort S
- Legacy: Legacy application deadline error `Application deadline has passed`, compares UTC (`JobServiceImpl.java:476-481`).
- vNext now: New emits PLACEMENT_APPLICATION_DEADLINE_PASSED at preflight and post-lock (`application-service.ts:599-604,674-679`).
- Fix: Map API error code to exact legacy sentence in learner UI.
