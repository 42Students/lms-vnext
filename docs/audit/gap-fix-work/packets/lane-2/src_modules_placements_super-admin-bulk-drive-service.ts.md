# Work packet: edit src/modules/placements/super-admin-bulk-drive-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/super-admin-jobs-directory.md

## G2-8-030-041  [P1] GAP  facet F12  effort M
- Legacy: Old delete preflight warns active applications and interviews, preserves app records and sends notice docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-450.
- vNext now: New CLOSE path may withdraw issued offers, historical decisions kept src/modules/placements/super-admin-bulk-drive-service.ts:86-109; src/components/placements/super-admin-bulk-drive-actions.tsx:88-90.
- Fix: Distinguish destructive delete from close/offer withdrawal, verify data handling.

## G2-8-030-046  [P1] GAP  facet F15  effort M
- Legacy: Old delete warning learners notified, bulk close disables applying docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:441-447,739-742.
- vNext now: New bulk CLOSE warns issued offers withdrawn; events via closePlacementJob src/components/placements/super-admin-bulk-drive-actions.tsx:88-97; src/modules/placements/super-admin-bulk-drive-service.ts:100-102.
- Fix: Preserve learner notification semantics for close/delete and make affected count visible.

## G2-8-030-025  [P2] GAP  facet F07  effort M
- Legacy: Old status toggle specific error response kept retry context and button docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:334-361,782-799.
- vNext now: New bulk skipped reasons generic Could not update this drive. Refresh and retry. src/modules/placements/super-admin-bulk-drive-service.ts:94-107.
- Fix: Report underlying validation reason safely and targeted retry for single status.
