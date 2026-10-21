# Work packet (wave 2): edit src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-application-status-history-service.md, docs/audit/gap2/lane-5/u015-job-application-status-history-repository.md, docs/audit/gap2/lane-8/job-application-status-history.md

## G2-3-013-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobApplicationStatusHistoryService.java:7-22`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:796-813`, `docs/legacy-source/frontend/src/api/Services/jobService.js:78-86`
- vNext now: `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:18-43`, `src/modules/placements/learner-application-detail-service.ts:95-129`
- Fix: Legacy status history exposed by GET /api/v1/jobs/applications/{applicationId}/history and can be embedded in application detail; vNext has separate learner page route and server-only reader. Preserve legacy navigation and status timeline positioning.

## G2-3-013-003  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobApplicationStatusHistoryService.java:18-22`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:55-81`
- vNext now: `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:40-77`
- Fix: Legacy status chronology is one timeline projection, including fallback current status; vNext page adds role/company PageHeader, explanatory section and an empty state. Align with legacy placement detail panel anatomy.

## G2-3-013-004  [P2] MISSING  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:60-78`
- vNext now: `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:51-53`, `src/modules/placements/learner-application-detail-service.ts:102-128`
- Fix: Legacy synthesizes one timeline event when history empty and application exists; vNext shows no-records empty state instead. Compute read-only synthetic initial event.

## G2-3-013-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:19-35`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:800-813`
- vNext now: `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:54-75`, `src/modules/placements/learner-application-detail-service.ts:102-108`
- Fix: Legacy entity returned to org-scoped client has changedBy and rejectionReason; vNext learner page explicitly hides internal actor identifiers and all notes. Expose learner-safe reason only if policy permits, keep actor hidden.

## G2-3-013-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:28-35`
- vNext now: `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:55-69`
- Fix: Legacy transition DTO uses oldStatus/newStatus/changedAt, vNext labels only Application submitted, Application withdrawn or generic status. Map all visible statuses to precise legacy words.

## G2-3-013-029  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobApplicationStatusHistoryService.java:18-22`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:55-81`
- vNext now: `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:23-29`, `51-53`
- Fix: Legacy nonexistent application or no history returns empty list at service level; vNext invalid/unauthorized application notFound and valid no-rows renders titled empty state. Align viewer-specific error/empty handling and avoid enumeration.

## G2-3-013-035  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:800-813`
- vNext now: `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:38-52`
- Fix: Legacy API success message `History retrieved` and statuses include APPLIED, OFFERED, REJECTED; vNext page says `Persisted status-change timeline`/`Only recorded application status changes are shown` and `No application-status history records available`. Match source copy after restoring fallback.

## G2-3-013-036  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:30-32`
- vNext now: `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:51-53`
- Fix: Legacy no data returns synthetic current event or empty list, vNext user-facing copy claims no records available despite a known currentStatus. Replace with baseline row rather than contradictory empty label.

## G2-5-015-030  [P2] GAP  facet F13  effort S
- Legacy: Legacy empty read synthesizes event from appliedAt or statusUpdatedAt `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:60-77`
- vNext now: New history page says No application-status history records available `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:51-53`
- Fix: Restore synthetic baseline where application exists without event.

## G2-8-019-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:543-564 GET /applications/{applicationId}/history
- vNext now: src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:18-29 UUID route /learn/my-placements/applications/[applicationId]/history
- Fix: Add mapping for legacy numeric application history deep links.

## G2-8-019-006  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:550-564 response includes record ID, actor, reason
- vNext now: src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:54-71 event labels and status values only
- Fix: Preserve metadata in structured API for authorized admin readers.

## G2-8-019-029  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:565-567 denied 403 response
- vNext now: src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:23-29 404 for inaccessible resource
- Fix: Document deliberate existence-hiding policy or match 403.

## G2-8-019-034  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:55-80 no history returns synthetic if application exists
- vNext now: src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:51-53 generic No application-status history records available
- Fix: Distinguish genuine no-history versus pre-feature synthetic timeline.

## G2-8-019-035  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:565-572 403/404/500 distinct error bodies
- vNext now: src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:23-29 resource 404 and server boundary
- Fix: Provide local retry for history load failures.

## G2-8-019-041  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:562-564 History retrieved response string
- vNext now: src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:45-49 Status history section label
- Fix: Match legacy human-readable status vocabulary.

## G2-8-019-043  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:565-572 Access denied and explicit failure retry message
- vNext now: src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:51-53 No application-status history records available
- Fix: Never confuse server failure with genuinely empty timeline.

## G2-8-019-048  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:42 implicit LocalDateTime.now timezone
- vNext now: src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:10-16 IST rendered date from timezone-aware timestamp
- Fix: Normalize legacy MySQL timestamps using authoritative source time zone.

## G2-3-013-041  [P3] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:69-77`
- vNext now: `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:10-16`
- Fix: Legacy fallback LocalDateTime.now without explicit zone; vNext IST display for timezone-aware stored timestamps. Normalize imported historic times without double offsets.
