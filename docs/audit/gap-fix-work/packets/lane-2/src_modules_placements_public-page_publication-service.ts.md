# Work packet: edit src/modules/placements/public-page/publication-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-placements-page-controller.md

## G2-17-022-026  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:76-112 — Public page reads enabled settings, live metric values.
- vNext now: src/modules/placements/public-page/publication-service.ts:53-99 — Separate publication snapshot opt-in, population gating.
- Fix: Verify public metrics are live/within 12 months, approved publish state.
