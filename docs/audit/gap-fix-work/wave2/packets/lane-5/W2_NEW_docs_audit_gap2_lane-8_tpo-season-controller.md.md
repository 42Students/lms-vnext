# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-8/tpo-season-controller.md

7 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/tpo-season-controller.md

## G2-8-022-001  [P2] GAP  facet F01  effort M
- Legacy: Old /api/v1/tpo/season GET lists caller college (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoSeasonController.java:16-36).
- vNext now: New GET /api/placements/seasons requires explicit collegeId query (src/app/api/placements/seasons/route.ts:12-27).
- Fix: Preserve implicit college lookup or pass selected collegeId from TPO view.

## G2-8-022-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy list sort by startDate DESC (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:23-25).
- vNext now: New list sorts startDate ASC, then createdAt ASC (src/modules/placements/season-service.ts:38-50).
- Fix: Match most recent first and stable tie sort in season picker.

## G2-8-022-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy current select is first isCurrent=true sorted startDate DESC (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:27-29).
- vNext now: New list exposes status but no equivalent current=true query (src/modules/placements/season-service.ts:25-50).
- Fix: Implement deterministic latest current resolution that does not mark other seasons inactive.

## G2-8-022-041  [P2] GAP  facet F13  effort M
- Legacy: Legacy current endpoint auto-creates a default rather than empty/null (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:27-30).
- vNext now: New list can return [] and no create side effect (src/modules/placements/season-service.ts:25-50).
- Fix: Provide a clear no seasons created empty state; explain change from auto-current.

## G2-8-022-050  [P2] MISSING  facet F18  effort M
- Legacy: Legacy API action called open-registration and request field deadline (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoSeasonController.java:56-59).
- vNext now: New visible edit model CREATE/EDIT and requires code, no OPEN_REGISTRATION action (src/modules/placements/tpo-season-write-model.ts:9-15).
- Fix: Restore expected Register/Open registration label and deadline hint if not intentionally retired.

## G2-8-022-053  [P2] GAP  facet F19  effort M
- Legacy: Legacy current likely one indexed lookup by college/isCurrent/startDate (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:27-29).
- vNext now: New list loads all seasons then caller determines current, no current lookup in reviewed API (src/modules/placements/season-service.ts:25-50).
- Fix: Add cheap single-current selector without loading whole history.

## G2-8-022-055  [P2] GAP  facet F20  effort M
- Legacy: Legacy endDate can be null and registrationDeadline LocalDateTime has no timezone in DTO (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementSeason.java:43-50; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoSeasonController.java:44-48,56-59).
- vNext now: New season dates are ISO dates, activity event uses Date timestamps for close (src/db/schema/placements.ts:385-415).
- Fix: Define legacy India-local registration timestamp mapping, particularly midnight deadlines.
