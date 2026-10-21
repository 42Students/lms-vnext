# Work packet: edit src/modules/placements/public-page/content-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/placements-index.md, docs/audit/gap2/lane-4/public-placements-page-controller.md

## G2-11-001-011  [P1] GAP  facet F04  effort S
- Legacy: Backend supplies only non-null selected values. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:112`
- vNext now: Displays null metrics as `(not enough data yet)`. `src/modules/placements/public-page/content-model.ts:27`
- Fix: Filter suppressed metrics entirely.

## G2-11-001-012  [P1] GAP  facet F04  effort S
- Legacy: Default numbers STUDENTS/PLACED/COMPANIES. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:51`
- vNext now: Defaults PLACED/OFFERS/HIRING_COMPANIES. `src/modules/placements/public-page/content-model.ts:6`
- Fix: Restore defaults/order with key migration.

## G2-11-001-051  [P1] GAP  facet F12  effort S
- Legacy: Privacy minimum group 5 per metric. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:29`
- vNext now: Null release represented as placeholder. `src/modules/placements/public-page/content-model.ts:27`
- Fix: Omit metric below five.

## G2-4-026-090  [P1] GAP  facet F23  effort M
- Legacy: Below k=5 data entirely absent (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:101-113`)
- vNext now: Shows placeholder tiles for suppressed values (`src/modules/placements/public-page/content-model.ts:26-30`)
- Fix: Do not reveal unavailable metric selection; align exact public disclosure.
