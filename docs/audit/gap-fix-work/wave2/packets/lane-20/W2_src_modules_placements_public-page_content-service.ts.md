# Work packet (wave 2): edit src/modules/placements/public-page/content-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-placements-page-controller.md

## G2-17-022-008  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoPlacementsPageController.java:25-29 — Request enabled nullable bool, about nullable string, numbers nullable list.
- vNext now: src/modules/placements/public-page/content-service.ts:24-62 — Content JSON about/metricKeys/expectedUpdatedAt; publication separate.
- Fix: Offer old combined payload mapping or update callers.

## G2-17-022-017  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:58-68 — PATCH-like nullable semantics; omitted enabled/about/numbers retain current.
- vNext now: src/modules/placements/public-page/content-service.ts:24-54 — Full content with expectedUpdatedAt on separate service.
- Fix: Preserve partial-update semantics for legacy callers.

## G2-17-022-030  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:63-66 — About sanitized and limited4000, null preserves saved value.
- vNext now: src/modules/placements/public-page/content-service.ts:24-50 — Explicit optimistic version/content replace.
- Fix: Handle null/empty distinction and trim.
