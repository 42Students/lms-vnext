# Work packet (wave 2): edit src/modules/bug-tracker/readiness.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/bug-report-activity.md

## G2-3-021-039  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicBugTrackerController.java:58-62`
- vNext now: `src/modules/bug-tracker/readiness.ts:4-11`, `src/app/api/tracker/issues/[publicId]/route.ts:14-19`
- Fix: Legacy public event read available independently; vNext runtime gate DB10_TRACKER_READY=DB10_VERIFIED must be enabled after migration0076. Document deployment acceptance and safe disabled UI.
