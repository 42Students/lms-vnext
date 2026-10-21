# Work packet: NEW / MISSING items from docs/audit/gap2/lane-8/tpo-season-controller.md (part 2 of 2)

3 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/tpo-season-controller.md

## G2-8-022-022  [P2] GAP  facet F07  effort M
- Legacy: Legacy LocalDateTime.parse(deadline) throws parse exception on wrong format (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoSeasonController.java:56-60).
- vNext now: New YYYY-MM-DD Zod errors Use YYYY-MM-DD / Use a valid calendar date (src/modules/placements/validation.ts:197-213).
- Fix: Provide exact date-time format hint for registration deadline field.

## G2-8-022-026  [P2] GAP  facet F08  effort M
- Legacy: Legacy POST /season returns 201 and entire PlacementSeason directly (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoSeasonController.java:50-54).
- vNext now: New POST returns 201 nested {season} (src/app/api/placements/seasons/route.ts:39-49).
- Fix: Update client adapter/response decoder while preserving created confirmation.

## G2-8-022-027  [P2] MISSING  facet F08  effort M
- Legacy: Legacy open registration returns 200 season, no toast specified by backend (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoSeasonController.java:56-60).
- vNext now: New no matching action/response (src/app/api/placements/seasons/route.ts:30-53).
- Fix: Create success feedback and saved deadline display for registration opening.
