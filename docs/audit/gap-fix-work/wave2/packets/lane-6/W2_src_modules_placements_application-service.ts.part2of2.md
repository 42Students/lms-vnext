# Work packet (wave 2): edit src/modules/placements/application-service.ts (part 2 of 2)

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-application-status-history-service.md, docs/audit/gap2/lane-5/u013-admin-job-service.md, docs/audit/gap2/lane-5/u015-job-application-status-history-repository.md, docs/audit/gap2/lane-6/job-application-repository.md, docs/audit/gap2/lane-8/job-application-status-history.md, docs/audit/gap2/lane-1/l19-u021-apply-to-job-request.md

## G2-3-013-042  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/event/ApplicationStatusChangedEventListener.java:17-29`
- vNext now: `src/modules/placements/application-service.ts:848-882`, `1278-1308`
- Fix: Legacy AFTER_COMMIT application-status event integration writes ledger; vNext placement application writes history and activity in transaction. Ensure every producer (TPO, HR, system, offer cascade) participates.

## G2-5-013-042  [P2] GAP  facet F10  effort S
- Legacy: Legacy getApplicationCount returns Long count for job (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:73-73`)
- vNext now: vNext listPlacementJobApplications fetches rows, no explicit count service in mapped reader (`src/modules/placements/application-service.ts:1011-1035`)
- Fix: Provide indexed COUNT query for summary/list badge

## G2-5-013-050  [P2] GAP  facet F10  effort M
- Legacy: Legacy getStudentPlacementSummary includes every job with next interview (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:135-140`)
- vNext now: vNext listOwnPlacementApplications includes jobs/companies but next interview not in projection (`src/modules/placements/application-service.ts:955-981`)
- Fix: Join upcoming round/slot for each application in learner/admin summary

## G2-5-015-042  [P2] GAP  facet F20  effort M
- Legacy: No-op guard in legacy prevents repeated same status history `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:29-36`
- vNext now: VNext insert enforced by transition CHECK and atomic create `src/modules/placements/application-service.ts:856-882`
- Fix: Implement retried transition idempotency without duplicate audit records.

## G2-6-015-046  [P2] GAP  facet F20  effort M
- Legacy: appliedAt is local timestamp immutable (JobApplication.java:35-37).
- vNext now: Timestamptz now and overwritten on reapply (placements.ts:1007-1011; application-service.ts:839-844).
- Fix: Pin UTC storage/IST display with first-vs-last apply timestamps.

## G2-8-019-018  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:40-46 trims old/new, optional 500-char reason truncation
- vNext now: src/modules/placements/application-service.ts:848-852,1268-1277 typed values, nullable reason
- Fix: Match whitespace and reason handling without silent unsafe truncation.

## G2-8-019-025  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/event/ApplicationStatusChangedEventListener.java:17-30 Spring after-commit event listener
- vNext now: src/modules/placements/application-service.ts:848-880 transaction writes history directly
- Fix: Audit all event emission points to prevent missing or duplicate transition events.

## G2-19-021-006  [P3] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:445-446 — Application submitted successfully. Screening will be completed shortly.
- vNext now: src/modules/placements/application-service.ts:895-921 — activity Application submitted for role title
- Fix: Align learner toast and next-step wording

## G2-19-021-026  [P3] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:454-457 — duplicate 409 shown by frontend
- vNext now: src/modules/placements/application-service.ts:641-643,949-950 — same-channel existing application returned
- Fix: Display Already applied without duplicating submission success

## G2-19-021-030  [P3] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:445-446 — screening prompt in success
- vNext now: src/modules/placements/application-service.ts:885-920 — screening PENDING + event
- Fix: Use screening queued text rather than promised near-immediate result

## G2-19-021-033  [P3] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:445-446 — literal Application submitted successfully. Screening will be completed shortly.
- vNext now: src/modules/placements/application-service.ts:902,918 — Application submitted for role title / status changed
- Fix: Align frontend confirmation copy and status announcement

## G2-18-011-051  [P3] GAP  facet F13  effort S
- Legacy: Legacy visibility denied returns reason `Job not found or not active` (`JobServiceImpl.java:269-278`).
- vNext now: New placement job load/action throws JOB_NOT_OPEN or not found code (`application-service.ts:580-601`).
- Fix: Match safe not-found wording and avoid revealing private company jobs.

## G2-20-012-007  [P3] GAP  facet F04  effort S
- Legacy: Legacy job IDs and learner IDs Integer `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:26-31,42-45,88-94`
- vNext now: New job IDs UUID parsed by schemas `src/modules/placements/application-service.ts:68-78`
- Fix: Map link ID parsing and reject stale numeric bookmarks gracefully

## G2-20-012-034  [P3] GAP  facet F18  effort S
- Legacy: Legacy reason property on VisibilityResult returned verbatim `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:177-195`
- vNext now: New errors code PLACEMENT_JOB_NOT_FOUND etc `src/modules/placements/application-service.ts:80-85`
- Fix: Map code to exact legacy reason and actionable CTA state
