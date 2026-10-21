# Work packet (wave 2): edit src/app/api/placements/tpo/settings/season/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l19-u022-tpo-hub-controller.md

## G2-19-022-085  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:392-395 GET /lens/seasons
- vNext now: src/app/api/placements/tpo/settings/season/route.ts:7-13
- Fix: Preserve selected lens calendar options

## G2-19-022-087  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:399-404 PUT update season
- vNext now: src/app/api/placements/tpo/settings/season/route.ts:7-13 POST changeTpoSeason
- Fix: Reconcile update by seasonId against selected-season write
