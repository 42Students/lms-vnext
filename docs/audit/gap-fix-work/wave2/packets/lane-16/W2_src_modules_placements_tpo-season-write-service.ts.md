# Work packet (wave 2): edit src/modules/placements/tpo-season-write-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/tpo-season-controller.md

## G2-8-022-004  [P2] GAP  facet F02  effort M
- Legacy: Controller exposes list,current,start,open-registration in that order (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoSeasonController.java:34-60).
- vNext now: New central season service lists, creates, closes, resolves job-creation season; separate TPO settings edit (src/modules/placements/season-service.ts:25-53,175-175,328-360; src/modules/placements/tpo-season-write-service.ts:27-69).
- Fix: Keep registration action discoverable in TPO season page or explicitly document retirement.

## G2-8-022-062  [P2] GAP  facet F22  effort M
- Legacy: Legacy createdAt and updatedAt LocalDateTime, @Version Long (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementSeason.java:63-73).
- vNext now: New tz-aware timestamps and CAS updatedAt in settings, no version column (src/db/schema/placements.ts:406-415; src/modules/placements/tpo-season-write-service.ts:35-42).
- Fix: Normalize timezone/millisecond token and import old version history.
