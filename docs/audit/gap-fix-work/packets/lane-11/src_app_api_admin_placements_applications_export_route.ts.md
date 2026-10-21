# Work packet: edit src/app/api/admin/placements/applications/export/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u014-job-application-search-controller.md

## G2-12-014-004  [P1] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:106-115`
- vNext now: `src/app/api/admin/placements/applications/export/route.ts:5-11`
- Fix: Legacy POST `/refresh` for global Super Admin cache rebuild; no corresponding vNext app search-cache refresh endpoint (SQL read has no cache). Document intentional removal.
