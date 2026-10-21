# Work packet: edit src/app/api/placements/tpo/jobs/[jobId]/rounds/[roundId]/apply-all/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u022-tpo-results-controller.md

## G2-12-022-045  [P1] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoResultsController.java:59-66 — apply?notify=true query defaults true; false suppresses student notification
- vNext now: src/app/api/placements/tpo/jobs/[jobId]/rounds/[roundId]/apply-all/route.ts:14-18 — apply-all accepts confirmed/token, no notify parameter
- Fix: Decide notification suppression compatibility; ensure explicit user intent for sends
