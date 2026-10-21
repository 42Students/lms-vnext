# Work packet: NEW / MISSING items from docs/audit/gap2/lane-8/tpo-season-controller.md (part 1 of 2)

20 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/tpo-season-controller.md

## G2-8-022-002  [P1] MISSING  facet F01  effort M
- Legacy: Old /api/v1/tpo/season/current returns most recently started isCurrent season (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoSeasonController.java:39-42; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:27-29).
- vNext now: New seasons route exposes GET list only, no /current equivalent (src/app/api/placements/seasons/route.ts:12-29).
- Fix: Provide current-season resolution and deep-link compatibility, or document removed endpoint.

## G2-8-022-006  [P1] GAP  facet F03  effort M
- Legacy: Legacy season exposes name,start/end,current,registration-open,deadline and blocked dates (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementSeason.java:40-61).
- vNext now: New schema exposes name/code/start/end/status/creator/closed, no registration UI fields (src/db/schema/placements.ts:383-415).
- Fix: Restore registration open/deadline affordance or publish intentional feature removal.

## G2-8-022-007  [P1] GAP  facet F03  effort M
- Legacy: Legacy can make multiple seasons current; UI season chip identifies latest current (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:27-40; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAccessGuard.java:61-80).
- vNext now: New ACTIVE vs CLOSED status under active-unique index (src/db/schema/placements.ts:391-393,424-430).
- Fix: Use nonexclusive season chips/filters if overlapping seasons remain supported.

## G2-8-022-009  [P1] GAP  facet F04  effort M
- Legacy: Legacy id Long identity, collegeId Integer (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementSeason.java:33-38).
- vNext now: New id and collegeId UUID (src/db/schema/placements.ts:377-382).
- Fix: Create stable season and college ID mapping for historical jobs and links.

## G2-8-022-011  [P1] GAP  facet F04  effort M
- Legacy: Legacy startDate and endDate are nullable LocalDate (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementSeason.java:43-47).
- vNext now: New start_date and end_date NOT NULL date strings (src/db/schema/placements.ts:385-390).
- Fix: Define how open-ended legacy seasons map to required dates without manufacturing historical endings.

## G2-8-022-012  [P1] MISSING  facet F04  effort M
- Legacy: Legacy registrationDeadline nullable LocalDateTime (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementSeason.java:49-50).
- vNext now: New placement_seasons header lacks deadline column (src/db/schema/placements.ts:374-415).
- Fix: Add registrationDeadline/registrationOpen or documented alternative keyed by season.

## G2-8-022-013  [P1] MISSING  facet F04  effort M
- Legacy: Legacy JSON blockedDates array of date,label pairs (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementSeason.java:55-58).
- vNext now: New season record has no blockedDates JSON (src/db/schema/placements.ts:374-415).
- Fix: Map season-scoped blocked dates to explicit schedule blackout rows/UI.

## G2-8-022-014  [P1] GAP  facet F04  effort M
- Legacy: Legacy isCurrent true default, isRegistrationOpen false default (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementSeason.java:52-61).
- vNext now: New status ACTIVE default, no separate registration flag (src/db/schema/placements.ts:391-393).
- Fix: Do not equate ACTIVE with registration OPEN; retain two distinct flags.

## G2-8-022-019  [P1] GAP  facet F06  effort M
- Legacy: Legacy permits NULL endDate for open season start (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:27-40).
- vNext now: New date validation rejects absent/invalid endDate (src/modules/placements/validation.ts:229-246).
- Fix: Support legitimate open-ended season or owner-approved mandatory end-date rule.

## G2-8-022-020  [P1] MISSING  facet F06  effort M
- Legacy: Legacy registration-open POST deadline is string parsed as LocalDateTime, no body (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoSeasonController.java:56-60).
- vNext now: New seasons route accepts POST create only; no deadline mutation (src/app/api/placements/seasons/route.ts:30-53).
- Fix: Add scoped registration deadline action and client form validation.

## G2-8-022-025  [P1] GAP  facet F07  effort M
- Legacy: Legacy multiple current seasons accepted (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:32-41).
- vNext now: New PLACEMENT_SEASON_ACTIVE_EXISTS rejects next ACTIVE season (src/modules/placements/season-service.ts:83-104).
- Fix: Remove incompatible active-only guard if overlapping seasons are permitted.

## G2-8-022-031  [P1] GAP  facet F10  effort M
- Legacy: Legacy current() auto-creates Current season at today's date if none exists (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:27-30).
- vNext now: New list is read-only, create requires explicit payload (src/modules/placements/season-service.ts:25-63).
- Fix: Choose whether no-season should auto-create; do not silently start a season during GET without owner approval.

## G2-8-022-036  [P1] GAP  facet F11  effort M
- Legacy: Legacy seasons can be visible to TPO or college admin via controller access, not row filters in shown method (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoSeasonController.java:16-53; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAccessGuard.java:13-18).
- vNext now: New TPO settings write requires active TPO role, not College Admin role (src/modules/placements/tpo-season-write-service.ts:15-25).
- Fix: Confirm old college admin season-writing permission and provide equivalent allowed path if needed.

## G2-8-022-037  [P1] GAP  facet F12  effort M
- Legacy: Legacy seasons are filters, may overlap; starting next never closes prior (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:12-15,32-41).
- vNext now: New permits at most one active season per college index (src/db/schema/placements.ts:424-430).
- Fix: Remove exclusive-active rule or explicitly implement a distinct selection field separate from active.

## G2-8-022-038  [P1] GAP  facet F12  effort M
- Legacy: Legacy current picks newest isCurrent from potential multiple matches (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:27-29).
- vNext now: New status ACTIVE/CLOSED, no current flag (src/db/schema/placements.ts:391-393).
- Fix: Separate selection-current from lifecycle ACTIVE/CLOSED.

## G2-8-022-039  [P1] MISSING  facet F12  effort M
- Legacy: Legacy registration opens with arbitrary LocalDateTime deadline without deadline-window guard in shown method (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:44-49).
- vNext now: New has no matching deadline rule/column (src/db/schema/placements.ts:374-415).
- Fix: Define deadline <= season end and timezone semantics only after restoring independent field.

## G2-8-022-059  [P1] GAP  facet F22  effort M
- Legacy: Legacy placement_season id Long identity, college INT, start/end nullable, version Long (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementSeason.java:25-50,71-73).
- vNext now: New UUID id/college, required dates, no numeric version (src/db/schema/placements.ts:374-415).
- Fix: Backfill IDs, dates and optimistic token with traceable migration for historic linked drives.

## G2-8-022-060  [P1] GAP  facet F22  effort M
- Legacy: Legacy registration_open, deadline, blocked_dates JSON, is_current columns (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementSeason.java:49-61).
- vNext now: New schema lacks all four and instead has code,status,createdBy,closedBy,closedAt (src/db/schema/placements.ts:383-415).
- Fix: Implement individual field parity/migration rules for all four missing properties.

## G2-8-022-061  [P1] GAP  facet F22  effort M
- Legacy: Legacy no global unique current-season restriction, multiple current rows intentional (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:32-41).
- vNext now: New unique ACTIVE per college and unique lower(code) index (src/db/schema/placements.ts:418-430).
- Fix: Split lifecycle from selection and relax conflicting uniqueness.

## G2-8-022-064  [P1] GAP  facet F23  effort M
- Legacy: Legacy permits multiple concurrent current seasons; explicitly not a global mode (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:12-15,32-40).
- vNext now: New ACTIVE single-college restriction changes product semantics (src/db/schema/placements.ts:424-430).
- Fix: Record owner decision; preserve prior drives while creating overlapping seasons.
