# Work packet: edit src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/job-application-status-history.md

## G2-8-019-005  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:19-35 old/new/status, when, actor, reason
- vNext now: src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:55-75 displays transition and time, hides actor/reason
- Fix: Show reason/actor in authorized TPO timeline; redact for learner where appropriate.

## G2-8-019-032  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:60-77 synthetic APPLIED status with appliedAt/statusUpdatedAt
- vNext now: src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:51-53 no-snapshot empty state
- Fix: Reconstruct baseline from historic application with timestamp.

## G2-8-019-042  [P1] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:68-75 fallback APPLIED/REJECTED
- vNext now: src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:63-68 SUBMITTED/WITHDRAWN labels formatted
- Fix: Map historical labels correctly across lifecycle and recruiting stages.

## G2-8-019-059  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:60-77 synthetic initial history generated for older apps
- vNext now: src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:51-53 empty without synthesis
- Fix: Restore history baseline for legacy existing applications.

## G2-8-019-020  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:565-572 403 Access denied, 404 not found, 500 explicit retry
- vNext now: src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx:23-29 returns notFound() for unowned/bad UUID
- Fix: Clarify unauthorized-versus-not-found convention and retriable error screen.
