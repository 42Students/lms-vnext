# Work packet: edit src/app/api/placements/rounds/[roundId]/results/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u022-tpo-results-controller.md

## G2-12-022-021  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoResultsController.java:74-77 — IllegalArgumentException maps to HTTP 404 JSON error
- vNext now: src/app/api/placements/rounds/[roundId]/results/route.ts:33-59 — apiErrorResponse for errors; origin 403
- Fix: Document response code mapping for invalid outcome vs not found vs wrong tenant
