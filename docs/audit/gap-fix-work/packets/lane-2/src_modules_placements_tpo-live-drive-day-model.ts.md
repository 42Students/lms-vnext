# Work packet: edit src/modules/placements/tpo-live-drive-day-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-index.md

## G2-11-009-049  [P1] GAP  facet F12  effort M
- Legacy: Legacy includes all today's ON_CAMPUS PUBLISHED rounds irrespective of start time. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- vNext now: vNext excludes not-yet-started rounds. `src/modules/placements/tpo-live-drive-day-model.ts:8`
- Fix: Include future same-day rounds.

## G2-11-009-050  [P1] GAP  facet F12  effort M
- Legacy: Legacy includes rounds already ended earlier today. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- vNext now: vNext excludes rounds whose duration elapsed. `src/modules/placements/tpo-live-drive-day-model.ts:13`
- Fix: Retain completed earlier-in-day round entry.

## G2-11-009-051  [P1] GAP  facet F12  effort M
- Legacy: Legacy includes rounds with missing duration. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- vNext now: vNext excludes zero/null duration. `src/modules/placements/tpo-live-drive-day-model.ts:9`
- Fix: Do not gate daily access on duration completeness.
