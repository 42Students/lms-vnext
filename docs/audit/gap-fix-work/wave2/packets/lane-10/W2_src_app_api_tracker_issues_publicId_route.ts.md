# Work packet (wave 2): edit src/app/api/tracker/issues/[publicId]/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l17-u024-superadmin-bug-tracker-controller.md, docs/audit/gap2/lane-3/bug-report-activity.md, docs/audit/gap2/lane-6/l11-u026-public-bug-tracker-controller.md

## G2-17-024-043  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminBugTrackerController.java:50 — publicId path string; trackerService.get returns legacy DTO.
- vNext now: src/modules/bug-tracker/admin-validation.ts:50 — regex LMS-[0-9]{4,}; src/app/api/tracker/issues/[publicId]/route.ts:31-32 — admin issue DTO.
- Fix: Map legacy IDs/response fields via crosswalk.

## G2-3-021-036  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tracker/issues/[issueId].js:45-79`
- vNext now: `src/app/api/tracker/issues/[publicId]/route.ts:10-34`
- Fix: Legacy independently loads secondary activity via one GET, vNext returns activity plus all report fields and screenshot metadata in one admin detail response. Consider payload splitting and failure isolation.

## G2-3-021-039  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicBugTrackerController.java:58-62`
- vNext now: `src/modules/bug-tracker/readiness.ts:4-11`, `src/app/api/tracker/issues/[publicId]/route.ts:14-19`
- Fix: Legacy public event read available independently; vNext runtime gate DB10_TRACKER_READY=DB10_VERIFIED must be enabled after migration0076. Document deployment acceptance and safe disabled UI.

## G2-11-026-019  [P2] GAP  facet F10  effort M
- Legacy: GET issues calls trackerService.search; GET detail trackerService.get (PublicBugTrackerController.java:37-52).
- vNext now: GET calls listBugTrackerIssuesForAdmin/getBugTrackerIssueForAdmin with request context (issues/route.ts:19-25; issues/[publicId]/route.ts:20-33).
- Fix: Create compatibility adapter, preserve 404 response and list semantics.
