# Work packet (wave 2): edit src/modules/placements/tpo-live-drive-day-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-index.md

## G2-11-009-024  [P2] GAP  facet F05  effort S
- Legacy: Default order by scheduled_date ascending. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- vNext now: TPO default most recent scheduled first (descending). `src/modules/placements/tpo-live-drive-day-service.ts:40`
- Fix: Set default date/time ascending.

## G2-11-009-053  [P2] GAP  facet F12  effort S
- Legacy: Legacy only ON_CAMPUS mode. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- vNext now: vNext live query omits mode filter. `src/modules/placements/tpo-live-drive-day-service.ts:32`
- Fix: Add ON_CAMPUS mode predicate for parity list.

## G2-11-009-079  [P2] GAP  facet F19  effort M
- Legacy: Successful response replaces whole array. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:33`
- vNext now: vNext exposes truncated sample with warning. `src/modules/placements/tpo-live-drive-day-service.ts:63`
- Fix: Add full result count/pages.

## G2-11-009-087  [P2] GAP  facet F22  effort M
- Legacy: Legacy job_round/job have integer IDs, scheduled date, mode, venue. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:345`
- vNext now: vNext UUID placementJobRounds/Jobs, scheduledAt and duration. `src/modules/placements/tpo-live-drive-day-service.ts:25`
- Fix: Map old mode/date statuses, not just IDs.

## G2-11-009-088  [P2] GAP  facet F22  effort M
- Legacy: Legacy lifecycle_status PUBLISHED. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- vNext now: New placementJobs.status=PUBLISHED plus archivedAt IS NULL. `src/modules/placements/tpo-live-drive-day-service.ts:34`
- Fix: Verify archive semantics parity in legacy.
