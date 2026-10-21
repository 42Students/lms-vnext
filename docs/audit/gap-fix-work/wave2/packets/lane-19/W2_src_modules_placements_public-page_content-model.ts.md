# Work packet (wave 2): edit src/modules/placements/public-page/content-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/placements-index.md, docs/audit/gap2/lane-4/public-placements-page-controller.md

## G2-11-001-013  [P2] GAP  facet F04  effort S
- Legacy: Placed % legacy key PLACED_PERCENT labeled Placed. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:32`
- vNext now: PERCENT labeled Placed %. `src/modules/placements/public-page/content-model.ts:8`
- Fix: Use legacy key/label mapping.

## G2-11-001-016  [P2] GAP  facet F04  effort S
- Legacy: Packages use stripTrailingZeros; no forced decimal. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:171`
- vNext now: Fixed one decimal in INR/LPA conversion. `src/modules/placements/public-page/content-model.ts:28`
- Fix: Match decimal presentation.

## G2-4-026-013  [P2] GAP  facet F04  effort S
- Legacy: Metrics keys `STUDENTS/PLACED/PLACED_PERCENT/OFFERS/COMPANIES/HIGHEST_CTC/MEDIAN_CTC` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:29-33,76-84`)
- vNext now: Keys `STUDENTS/PLACED/PERCENT/OFFERS/HIRING_COMPANIES/HIGHEST_CTC/MEDIAN_CTC` (`src/modules/placements/public-page/content-model.ts:2-11`)
- Fix: Map renamed percent/companies keys when restoring legacy saved selections.

## G2-4-026-014  [P2] GAP  facet F04  effort S
- Legacy: Default chosen metrics STUDENTS, PLACED, COMPANIES (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:45-54`)
- vNext now: Default PLACED, OFFERS, HIRING_COMPANIES (`src/modules/placements/public-page/content-model.ts:6`)
- Fix: Restore default public metric set/order on first enable.

## G2-4-026-015  [P2] GAP  facet F04  effort S
- Legacy: Legacy label `Placed` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:32-33`)
- vNext now: New label `Placed %` (`src/modules/placements/public-page/content-model.ts:7-10`)
- Fix: Match label for percent metric.

## G2-4-026-019  [P2] GAP  facet F04  effort M
- Legacy: Below-threshold metrics entirely omitted from numbers array (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:101-114`)
- vNext now: Selected metric still displays `(not enough data yet)` (`src/modules/placements/public-page/content-model.ts:22-30`)
- Fix: Hide suppressed tiles, not reveal selected metric placeholders if legacy parity required.
