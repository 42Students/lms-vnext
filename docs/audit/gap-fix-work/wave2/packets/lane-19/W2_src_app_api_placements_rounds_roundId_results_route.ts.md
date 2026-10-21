# Work packet (wave 2): edit src/app/api/placements/rounds/[roundId]/results/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u022-tpo-results-controller.md

## G2-12-022-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoResultsController.java:14-16,40-44 — REST root /api/v1/tpo/rounds; POST /{roundId}/results
- vNext now: src/app/api/placements/rounds/[roundId]/results/route.ts:10-18,29-55 — GET/POST /api/placements/rounds/{roundId}/results
- Fix: Document new route and migrate all old callers; avoid accidental compatibility assumption

## G2-12-022-028  [P3] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoResultsController.java:40-50 — POST 201 raw RoundResult from service.stage
- vNext now: src/app/api/placements/rounds/[roundId]/results/route.ts:29-55 — POST 201 {result}; JSON body, same-origin required
- Fix: Update consumers for response envelope and same-origin contract
