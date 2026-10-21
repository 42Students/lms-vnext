# Work packet (wave 2): edit src/app/api/placements/tpo/jobs/[jobId]/rounds/[roundId]/apply-all/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u022-tpo-results-controller.md

## G2-12-022-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoResultsController.java:52-57,59-71 — GET /{roundId}/results/pending; POST /{roundId}/results/apply
- vNext now: src/app/api/placements/tpo/jobs/[jobId]/rounds/[roundId]/apply-all/route.ts:8-19 — GET preview and POST apply-all nested under /tpo/jobs/{jobId}/rounds/{roundId}
- Fix: Update navigation/API crosswalk, retain explicit pending-only contract for any old caller
