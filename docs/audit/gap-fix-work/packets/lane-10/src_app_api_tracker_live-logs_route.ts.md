# Work packet: edit src/app/api/tracker/live-logs/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l12-u024-superadmin-logs-controller.md

## G2-12-024-008  [P1] GAP  facet F05  effort M
- Legacy: Query fields environment/window/level/search/pageToken/anchor/size `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/GcpLogQueryRequest.java:8-15`
- vNext now: New GET query windowMinutes/pageToken/query/minimumSeverity `src/app/api/tracker/live-logs/route.ts:12-18`
- Fix: Support historical anchor, environment and size safely.

## G2-12-024-018  [P1] GAP  facet F10  effort M
- Legacy: POST query and POST detail `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:56-66`
- vNext now: GET live logs and filtered summary only `src/app/api/tracker/live-logs/route.ts:7-23`
- Fix: Port safe detail with request filters and validation.

## G2-12-024-020  [P1] MISSING  facet F10  effort M
- Legacy: GET deploys, POST deploys/health `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:201-219`
- vNext now: Live read only paginated provider errors `src/app/api/tracker/live-logs/route.ts:7-23`
- Fix: Restore deploy health and regression comparison.
