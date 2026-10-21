# Work packet (wave 2): edit src/app/api/placements/jobs/[jobId]/change-requests/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md

## G2-5-023-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy TPO endpoints under `/api/v1/tpo`, including drive list/create and `/change-requests/{id}/accept
- vNext now: vNext GET/POST aggregate commands on `/api/placements/jobs/{jobId}/change-requests`; requests identified by UUID in body. `src/app/api/placements/jobs/[jobId]/change-requests/route.ts:8-19`
- Fix: Preserve a documented route/action compatibility mapping for all six operations.

## G2-5-023-034  [P2] GAP  facet F10  effort M
- Legacy: Legacy GET list + POST create/accept/answer/reply/withdraw, per-action `/api/v1/tpo` endpoints. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoChangeRequestController.java:45-72`, `docs/legacy-source/frontend/src/api/Services/TpoService.js:17-27`
- vNext now: vNext GET all and POST command envelope; no endpoint-level response aliases. `src/app/api/placements/jobs/[jobId]/change-requests/route.ts:8-19`, `src/modules/placements/tpo-drive-change-request-service.ts:77-151`
- Fix: Document route/action adapters and preserve status semantics for migrated clients.
