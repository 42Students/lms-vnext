# Work packet (wave 2): edit src/app/api/placements/tpo/bulk-actions/preview/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l19-u022-tpo-hub-controller.md

## G2-19-022-123  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java:186-187 exact stage/reason errors
- vNext now: src/app/api/placements/tpo/bulk-actions/preview/route.ts:23-29 machine codes if bulk fails
- Fix: Map known legacy stage/undo/follow-up errors into friendly UI wording

## G2-19-022-127  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:164-178 bulk-record action max 80, counts clamped0..1000000
- vNext now: src/app/api/placements/tpo/bulk-actions/preview/route.ts:14-29 bounded request parser and errors
- Fix: Keep audit input sanitation, accurate batch counts and origin-bound idempotency
