# Work packet: edit src/modules/placements/debarment-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u022-tpo-student-controller.md

## G2-5-022-019  [P2] GAP  facet F07  effort S
- Legacy: Legacy debar accepts both untilDate and untilDrives `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentController.java:59-69` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentService.java:68-80`
- vNext now: VNext rejects both with exact 'Choose an end date or a number of drives, not both' `src/modules/placements/debarment-service.ts:28-35`
- Fix: Document intentionally stricter duration and error.

## G2-5-022-021  [P2] GAP  facet F08  effort S
- Legacy: Legacy create debar HTTP201 with PlacementDebarment body `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentController.java:65-70`
- vNext now: VNext service returns created row, activity+notification in transaction `src/modules/placements/debarment-service.ts:192-204`
- Fix: Preserve status/envelope for old client or update response handling.

## G2-5-022-022  [P3] GAP  facet F08  effort S
- Legacy: Legacy lift HTTP204 empty body `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentController.java:71-78`
- vNext now: VNext lift returns updated row (idempotent when lifted) `src/modules/placements/debarment-service.ts:223-255`
- Fix: Map old 204 or switch clients to new success result.
