# Work packet (wave 2): edit src/modules/placements/public-page/publication-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-placements-page-controller.md

## G2-17-022-009  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:45-53 — settings returns enabled, about, numbers, available, preview.
- vNext now: src/modules/placements/public-page/publication-service.ts:102-115 — Publication read enabled/count, while content and preview separate.
- Fix: Aggregate old keys for view if needed.

## G2-17-022-044  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:119-146 — Legacy public page recruitment enquiry and email code downstream.
- vNext now: src/modules/placements/public-page/publication-service.ts:16-99 — Publication service only; public enquiry separate.
- Fix: Map full public page enquiry route and email flows.
