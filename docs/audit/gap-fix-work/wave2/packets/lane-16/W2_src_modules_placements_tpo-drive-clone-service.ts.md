# Work packet (wave 2): edit src/modules/placements/tpo-drive-clone-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l12-u015-job-role-option.md

## G2-12-015-028  [P2] GAP  facet F13  effort M
- Legacy: Empty roleOptionsJson renders one Default package `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:152-153`
- vNext now: Clone selects active rows and primary, does not guarantee fallback `src/modules/placements/tpo-drive-clone-service.ts:37-40`; `src/modules/placements/tpo-drive-clone-service.ts:67-71`
- Fix: Render Default draft package for empty historical data.

## G2-12-015-030  [P2] GAP  facet F14  effort M
- Legacy: JSON role packages imported/exported inside job `docs/legacy-source/backend/src/main/resources/db/migration/V161__tpo_v1_drives.sql:59-60`
- vNext now: Separate role table can be copied by clone `src/modules/placements/tpo-drive-clone-service.ts:37-85`
- Fix: Preserve array order, pay units and nulls on import and clone.

## G2-12-015-035  [P2] GAP  facet F19  effort M
- Legacy: Role array fetched wholesale with job `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:152-153`
- vNext now: Clone separately queries active role options `src/modules/placements/tpo-drive-clone-service.ts:37-41`
- Fix: Avoid N+1 and retain stable order with many role packages.
