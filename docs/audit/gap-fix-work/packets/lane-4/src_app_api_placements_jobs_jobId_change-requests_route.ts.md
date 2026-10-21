# Work packet: edit src/app/api/placements/jobs/[jobId]/change-requests/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md

## G2-5-023-038  [P1] GAP  facet F10  effort M
- Legacy: Legacy `/internal-notes` GET/POST reads/writes Team DRIVE messages with kind MESSAGE and deleted filtering. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoChangeRequestController.java:75-102`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoTeamThreadService.java:275-296`
- vNext now: vNext scoped change-request API has no internal-notes equivalent; request messages are separate store. `src/app/api/placements/jobs/[jobId]/change-requests/route.ts:8-19`, `src/modules/placements/tpo-drive-change-request-service.ts:77-151`
- Fix: Preserve Team DRIVE thread integration and legacy notes access in drive Discussion.
