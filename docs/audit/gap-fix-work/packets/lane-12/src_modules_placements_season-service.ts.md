# Work packet: edit src/modules/placements/season-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/tpo-season-controller.md

## G2-8-022-030  [P1] GAP  facet F10  effort M
- Legacy: Legacy GET /season; GET /current; POST /season; POST /{id}/open-registration (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoSeasonController.java:34-60).
- vNext now: New /api/placements/seasons GET and POST plus internal close+edit services, no /current/open-registration routes in examined mapping (src/app/api/placements/seasons/route.ts:12-53; src/modules/placements/season-service.ts:175-326).
- Fix: Document endpoint migration including removed current/register actions.
