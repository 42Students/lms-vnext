# Work packet (wave 2): edit src/app/api/placements/tpo/public-placement/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-placements-page-controller.md

## G2-17-022-024  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoPlacementsPageController.java:31-40 — GET settings, PUT enabled/about/numbers with actor id.
- vNext now: src/app/api/placements/tpo/public-placement/route.ts:10-23 — POST enabled form; content PUT in different endpoint.
- Fix: Expose equivalent GET+PUT versioned controller contract.
