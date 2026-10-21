# Work packet (wave 2): edit src/app/api/placements/tpo/settings/job-types/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-types.md

## G2-3-011-027  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:199-201`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:402-408`
- vNext now: `src/app/api/placements/tpo/settings/job-types/route.ts:7-16`, `src/modules/placements/tpo-job-type-write-service.ts:19-49`
- Fix: Legacy GET /api/v1/tpo/settings/job-types and PUT whole array of id/name/builtin/countsAsPlaced/hidden; vNext server read and individual POST/PUT/PATCH routes. Support equivalent atomic bulk transaction.
