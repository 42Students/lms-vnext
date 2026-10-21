# Work packet (wave 2): edit src/db/schema/placement-public-page.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-placements-page-controller.md, docs/audit/gap2/lane-4/public-placements-page-controller.md

## G2-17-022-045  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:45-68 — MySQL college_placements_page about,numbers_json,enabled,updated_by.
- vNext now: src/db/schema/placement-public-page.ts:6-31 — Postgres publication settings separate from public page content.
- Fix: Map content+publication tables and keys in migration.

## G2-4-026-084  [P2] GAP  facet F22  effort M
- Legacy: college_placements_page single row stores enabled/about/numbers_json and updater faculty (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:45-69`)
- vNext now: Settings table stores publication counters; separate content table (`src/db/schema/placement-public-page.ts:6-19`)
- Fix: Document normalized split and preserve updater/audit metadata.
