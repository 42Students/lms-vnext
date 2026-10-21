# Work packet: edit src/app/api/lecture-halls/[hallId]/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/lecture-hall-controller.md

## G2-4-027-004  [P1] GAP  facet F01  effort M
- Legacy: PUT `/update/{id}` and DELETE `/delete/{id}` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:147-206`)
- vNext now: PATCH update/archive/restore; no DELETE (`src/app/api/lecture-halls/[hallId]/route.ts:15-38`)
- Fix: Either implement legacy-compatible delete with schedule guard or explicitly retire it in navigation.

## G2-4-027-040  [P1] GAP  facet F10  effort M
- Legacy: PUT edit, DELETE schedule-guarded removal (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:147-206`)
- vNext now: PATCH edit/archive/restore (`src/app/api/lecture-halls/[hallId]/route.ts:15-38`)
- Fix: Preserve mutation reachability by existing automation and UI.
