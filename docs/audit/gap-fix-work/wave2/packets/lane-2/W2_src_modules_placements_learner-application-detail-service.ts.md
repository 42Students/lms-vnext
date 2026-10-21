# Work packet (wave 2): edit src/modules/placements/learner-application-detail-service.ts

27 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/job-application.md, docs/audit/gap2/lane-20/job-application-status-history-service-impl.md, docs/audit/gap2/lane-3/job-application-status-history-service.md, docs/audit/gap2/lane-5/u015-job-application-status-history-repository.md, docs/audit/gap2/lane-8/job-application-status-history.md

## G2-12-019-051  [P2] GAP  facet F18  effort S
- Legacy: Public reference format AXXXXXXXXXX `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:181-188`
- vNext now: New renders UUID application ID `src/modules/placements/learner-application-detail-service.ts:172-179`
- Fix: Restore readable applicant code.

## G2-20-011-004  [P2] MISSING  facet F02  effort S
- Legacy: Legacy synthetic history returned when no rows exist `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:60-78`
- vNext now: New raw history query returns empty and model only maps rows `src/modules/placements/learner-application-detail-service.ts:102-128`
- Fix: Supply synthetic initial status when history array is empty and application exists

## G2-20-011-005  [P2] GAP  facet F03  effort S
- Legacy: Legacy UI can see changedAt and rejection reason from entity `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:28-35`
- vNext now: Learner intentionally selects only fromStatus,toStatus,occurredAt, hides reason/actor `src/modules/placements/learner-application-detail-service.ts:102-127`
- Fix: Show learner-safe rejection explanation where policy permits; retain actor masking

## G2-20-011-019  [P2] MISSING  facet F10  effort S
- Legacy: Legacy empty read synthesizes current application, no DB write `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:60-78`
- vNext now: New read maps persisted rows only `src/modules/placements/learner-application-detail-service.ts:102-129`
- Fix: Add read-only synthetic event with occurredAt fallback and currentStatus

## G2-20-011-024  [P2] GAP  facet F13  effort S
- Legacy: If history empty but application exists, synthetic event `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:60-78`
- vNext now: Existing application with zero history yields empty list `src/modules/placements/learner-application-detail-service.ts:102-129`
- Fix: Display initial baseline row instead of empty state

## G2-20-011-030  [P2] GAP  facet F18  effort S
- Legacy: Legacy statuses display raw newStatus, rejection reason optional `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:22-35`
- vNext now: Learner mapper projects restricted event timeline excluding free-text reason `src/modules/placements/learner-application-detail-service.ts:103-128`
- Fix: Map status names to exact human-readable labels and decide rejection reason visibility

## G2-20-011-034  [P2] MISSING  facet F20  effort S
- Legacy: Synthetic event changedAt appliedAt or statusUpdatedAt or LocalDateTime.now `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:69-73`
- vNext now: No synthetic fallback or timestamp policy `src/modules/placements/learner-application-detail-service.ts:102-129`
- Fix: Use submittedAt/status timestamp and explicit current-time fallback

## G2-20-011-038  [P2] MISSING  facet F23  effort S
- Legacy: Legacy fallback synthetic history assures timeline for pre-feature applications `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:60-78`
- vNext now: New learner history lacks fallback `src/modules/placements/learner-application-detail-service.ts:102-129`
- Fix: Restore baseline timeline event if old records imported or created without writes

## G2-3-013-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobApplicationStatusHistoryService.java:7-22`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:796-813`, `docs/legacy-source/frontend/src/api/Services/jobService.js:78-86`
- vNext now: `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:18-43`, `src/modules/placements/learner-application-detail-service.ts:95-129`
- Fix: Legacy status history exposed by GET /api/v1/jobs/applications/{applicationId}/history and can be embedded in application detail; vNext has separate learner page route and server-only reader. Preserve legacy navigation and status timeline positioning.

## G2-3-013-004  [P2] MISSING  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:60-78`
- vNext now: `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:51-53`, `src/modules/placements/learner-application-detail-service.ts:102-128`
- Fix: Legacy synthesizes one timeline event when history empty and application exists; vNext shows no-records empty state instead. Compute read-only synthetic initial event.

## G2-3-013-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:19-35`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:800-813`
- vNext now: `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:54-75`, `src/modules/placements/learner-application-detail-service.ts:102-108`
- Fix: Legacy entity returned to org-scoped client has changedBy and rejectionReason; vNext learner page explicitly hides internal actor identifiers and all notes. Expose learner-safe reason only if policy permits, keep actor hidden.

## G2-3-013-009  [P2] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:60-78`
- vNext now: `src/modules/placements/learner-application-detail-service.ts:102-129`
- Fix: Legacy history-less existing application displays synthetic status APPLIED/default actual, changedAt appliedAt > statusUpdatedAt > now, changedBy optional and rejected reason. VNext returns zero events. Implement same fallbacks, adapt SUBMITTED terminology.

## G2-3-013-013  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-13`
- vNext now: `src/modules/placements/college-application-detail-service.ts:55-60`, `src/modules/placements/learner-application-detail-service.ts:102-119`
- Fix: Legacy no fixed max on history list; vNext college query LIMIT100 with no pagination/truncation indicator; paged continuation or full read for long histories.

## G2-3-013-023  [P2] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:55-81`
- vNext now: `src/modules/placements/learner-application-detail-service.ts:95-129`
- Fix: Legacy GET synthesizes status entry if none stored without writing row; vNext detail read has no synthesis. Add zero-write fallback.

## G2-3-013-028  [P2] MISSING  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:69-77`
- vNext now: `src/modules/placements/application-service.ts:848-882`, `src/modules/placements/learner-application-detail-service.ts:102-129`
- Fix: Legacy empty ledger synthesizes current status at appliedAt else statusUpdatedAt else now, includes rejection reason only when REJECTED; vNext lacks baseline and has no current REJECTED status in main application enum.

## G2-3-013-037  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-17`
- vNext now: `src/modules/placements/college-application-detail-service.ts:55-60`, `src/modules/placements/learner-application-detail-service.ts:102-119`
- Fix: Legacy full ascending history and bulk query, vNext college caps at100 while learner uncapped. Add pagination/index strategy with continuation for historic high-churn applications.

## G2-3-013-048  [P2] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:60-78`
- vNext now: `src/modules/placements/learner-application-detail-service.ts:102-129`
- Fix: Legacy synthetic event ensures pre-feature applications have at least one timeline row, dropped in vNext with no explicit exemption. Restore baseline.

## G2-5-015-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy query accepts integer application ID `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-13`
- vNext now: VNext reader validates UUID then authenticates persisted learner/college `src/modules/placements/learner-application-detail-service.ts:33-41`
- Fix: Map integer IDs only for imported history; maintain UUID and scoped access.

## G2-5-015-004  [P2] MISSING  facet F02  effort M
- Legacy: Legacy empty-history service synthesizes a baseline event `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:60-78`
- vNext now: New learner timeline projects persisted events only and shows empty notice `src/modules/placements/learner-application-detail-service.ts:102-129`
- Fix: Synthesize a read-only initial event for historic applications without rows.

## G2-5-015-005  [P2] GAP  facet F03  effort M
- Legacy: History entity exposes old, new, actor, reason and date fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:19-35`
- vNext now: Learner projection deliberately omits actor and free-text reason `src/modules/placements/learner-application-detail-service.ts:102-127`
- Fix: Expose explicitly learner-safe rejection explanation, never internal actor/notes.

## G2-8-019-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-13 changed_at ascending
- vNext now: src/modules/placements/learner-application-detail-service.ts:116-119 createdAt then UUID ascending
- Fix: Preserve transition chronology and deterministic timestamp tie-breaking.

## G2-8-019-013  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-17 per-app history asc, batch by newStatus/app ID/time
- vNext now: src/modules/placements/learner-application-detail-service.ts:109-119 per-app chronological SQL; src/modules/placements/tpo-student-history-service.ts:179-199 batch event join
- Fix: Verify batch status filtering and deterministic ordering.

## G2-8-019-027  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:550-564 raw history entity returned
- vNext now: src/modules/placements/learner-application-detail-service.ts:103-127 intentionally omits actor/reason
- Fix: Provide separate learner-safe and staff-full history DTOs.

## G2-20-011-025  [P3] GAP  facet F13  effort S
- Legacy: If applicationId null, empty list `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:57-59`
- vNext now: UUID parse throws Zod error on invalid ID `src/modules/placements/learner-application-detail-service.ts:33-38`
- Fix: Use 400 for malformed ID and 404 for scoped missing entity; preserve meaningful UI state

## G2-3-013-011  [P3] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-17`
- vNext now: `src/modules/placements/learner-application-detail-service.ts:102-119`, `src/modules/placements/college-application-detail-service.ts:55-60`
- Fix: Legacy sorted changedAt ASC only; vNext learner sorts createdAt ASC then id ASC, college orders createdAt ASC with limit100. Use stable tie-breaker across viewers and document time granularity.

## G2-5-015-016  [P3] GAP  facet F06  effort S
- Legacy: Single repository input Integer applicationId `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-13`
- vNext now: VNext UUID validation at reader boundary `src/modules/placements/learner-application-detail-service.ts:33-38`
- Fix: Keep UUID validation; document legacy ID translation where applicable.

## G2-5-015-041  [P3] GAP  facet F20  effort S
- Legacy: Legacy timestamp tie sort unspecified `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-17`
- vNext now: Learner stable tie sort by UUID id but college reader timestamp only `src/modules/placements/learner-application-detail-service.ts:116-119`
- Fix: Add id tie-break to every history query.
