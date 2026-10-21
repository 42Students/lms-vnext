# Work packet (wave 2): edit src/db/schema/placement-public-page-content.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/public-placements-page-controller.md

## G2-4-026-085  [P2] GAP  facet F22  effort M
- Legacy: Legacy numbers_json uses original seven keys and default order (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:45-54`)
- vNext now: jsonb metricKeys use renamed keys, about length check4000 (`src/db/schema/placement-public-page-content.ts:5-13`)
- Fix: Migrate keys and order deterministically.
