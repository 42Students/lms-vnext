# Work packet (wave 2): edit src/modules/placements/tpo-drive-lifecycle-list-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u031-placements-end-to-end.md, docs/audit/gap2/lane-19/job-auto-expiry-service.md

## G2-16-031-082  [P2] GAP  facet F19  effort M
- Legacy: tpo/drives/index.js:142-157 loads all scoped drives once, DataTable paginates client with sorting.
- vNext now: tpo-drive-lifecycle-list-model.ts:40-46 fixed 25 per page, lifecycle/page.tsx:387-389 Prev/Next navigation.
- Fix: Restore 10/25/50/100 size chooser, visible row range and same sort controls.

## G2-19-011-042  [P2] GAP  facet F16  effort M
- Legacy: Legacy back-end scheduler has no responsive layout; active job simply disappears from active list `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:61-63` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:41-61`
- vNext now: vNext overdue PUBLISHED drives still labeled Live on TPO list `src/modules/placements/tpo-drive-lifecycle-list-service.ts:64-65` `src/modules/placements/tpo-drive-lifecycle-list-model.ts:98-108`
- Fix: Add responsive Applications closed badge, not misleading Live status.

## G2-19-011-045  [P2] GAP  facet F17  effort S
- Legacy: Legacy deactivation makes inactive listing disappear, no confusing label `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-63` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:41-61`
- vNext now: vNext `Live` label for status PUBLISHED when application deadline overdue `src/modules/placements/tpo-drive-lifecycle-list-model.ts:98-108` `src/modules/placements/tpo-drive-lifecycle-list-service.ts:64-65`
- Fix: Use descriptive Applications closed text on all screens.
