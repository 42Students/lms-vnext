# Work packet: edit src/app/api/tracker/issues/[publicId]/retest/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l17-u024-superadmin-bug-tracker-controller.md

## G2-17-024-020  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminBugTrackerController.java:54,63,72 — returns refreshed full BugReportResponse after action.
- vNext now: src/app/api/tracker/issues/[publicId]/workflow/route.ts:35 and src/app/api/tracker/issues/[publicId]/retest/route.ts:33 — JSON issue envelope.
- Fix: Keep UI refreshing latest status/version.
