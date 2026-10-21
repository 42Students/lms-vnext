# Work packet (wave 2): edit src/modules/placements/tpo-job-type-write-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-types.md

## G2-3-011-027  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:199-201`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:402-408`
- vNext now: `src/app/api/placements/tpo/settings/job-types/route.ts:7-16`, `src/modules/placements/tpo-job-type-write-service.ts:19-49`
- Fix: Legacy GET /api/v1/tpo/settings/job-types and PUT whole array of id/name/builtin/countsAsPlaced/hidden; vNext server read and individual POST/PUT/PATCH routes. Support equivalent atomic bulk transaction.

## G2-3-011-029  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:174-177`
- vNext now: `src/modules/placements/tpo-job-type-write-service.ts:39-47`, `88-95`, `130-135`, `216-220`
- Fix: Legacy one JOB_TYPES_UPDATED audit entry per save; vNext separate created/status_changed/renamed/placed_rule_changed activity events. Preserve enough old/new values and bulk action association.

## G2-3-011-045  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypes.java:29-38`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:93-105`
- vNext now: `src/modules/placements/tpo-configuration-model.ts:6-8`, `src/modules/placements/tpo-job-type-write-service.ts:99-125`
- Fix: Legacy case-insensitive type normalization and collapse of repeated whitespace; vNext builtins normalize but custom create/rename only trim. Canonicalize spaces, case and Unicode consistently.
