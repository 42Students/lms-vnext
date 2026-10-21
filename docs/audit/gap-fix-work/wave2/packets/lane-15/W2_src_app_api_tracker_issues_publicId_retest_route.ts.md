# Work packet (wave 2): edit src/app/api/tracker/issues/[publicId]/retest/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l17-u024-superadmin-bug-tracker-controller.md

## G2-17-024-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminBugTrackerController.java:29-32,48-73 — /api/v1/superadmin/bug-tracker/issues/:publicId/{status,workflow,retest}.
- vNext now: src/app/api/tracker/issues/[publicId]/workflow/route.ts:10-40 and src/app/api/tracker/issues/[publicId]/retest/route.ts:10-38 — /api/tracker/issues/:publicId/{workflow,retest}, no dedicated status route.
- Fix: Migrate status-only consumers to workflow PATCH.

## G2-17-024-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminBugTrackerController.java:53-54,62-63,71-72 — mutation returns full BugReportResponse via trackerService.get.
- vNext now: src/app/api/tracker/issues/[publicId]/workflow/route.ts:35 — returns {issue}, src/app/api/tracker/issues/[publicId]/retest/route.ts:33 — {issue}.
- Fix: Preserve client response serialization/envelope.

## G2-17-024-003  [P3] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminBugTrackerController.java:48-73 — 3 controller methods status/workflow/retest.
- vNext now: src/app/api/tracker/issues/[publicId]/workflow/route.ts:10-40 and src/app/api/tracker/issues/[publicId]/retest/route.ts:10-38 — 2 mutation methods, status via workflow.
- Fix: Document status alias removal and no-impact UI migration.
