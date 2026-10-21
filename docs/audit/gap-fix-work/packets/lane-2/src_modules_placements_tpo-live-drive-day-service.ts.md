# Work packet: edit src/modules/placements/tpo-live-drive-day-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-index.md

## G2-11-009-021  [P1] GAP  facet F04  effort M
- Legacy: API provides id, roundName, kind, scheduled date, venue, company and role. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:345`
- vNext now: Live summary also carries duration and counts, but only for subset. `src/modules/placements/tpo-live-drive-day-service.ts:49`
- Fix: Expose all full-day items with original fields.

## G2-11-009-023  [P1] GAP  facet F05  effort L
- Legacy: SQL filters ON_CAMPUS and current day, no pagination. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- vNext now: Filter uses duration-based live window and cap 20. `src/modules/placements/tpo-live-drive-day-service.ts:42`
- Fix: Fetch full today's on-campus round list.

## G2-11-009-041  [P1] GAP  facet F10  effort M
- Legacy: Legacy GET /api/v1/tpo/drive-day/mine returns today's college list. `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:82`
- vNext now: TPO server calls live snapshot service instead. `src/modules/placements/tpo-live-drive-day-service.ts:12`
- Fix: Build all-day equivalent GET/service and use it for index.

## G2-11-009-052  [P1] GAP  facet F12  effort M
- Legacy: Legacy includes noncancelled and other status based only on job lifecycle. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- vNext now: vNext requires round status SCHEDULED. `src/modules/placements/tpo-live-drive-day-service.ts:36`
- Fix: Show completed same-day rounds; define cancelled separately.

## G2-11-009-077  [P1] GAP  facet F19  effort L
- Legacy: Legacy query one SQL query for all today rounds. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- vNext now: vNext cap20, calls getTpoRoundDriveDay for each row. `src/modules/placements/tpo-live-drive-day-service.ts:47`
- Fix: Batch aggregate joins and support full day set.

## G2-11-009-094  [P1] GAP  facet F23  effort L
- Legacy: Legacy all-day queue independent of duration. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- vNext now: New live-only 20-sample view drops expected rounds. `src/modules/placements/tpo-live-drive-day-service.ts:47`
- Fix: Implement day queue and retain live now as extra.
