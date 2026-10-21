# Work packet (wave 2): edit src/modules/placements/super-admin-bulk-drive-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/super-admin-jobs-directory.md

## G2-8-030-022  [P2] GAP  facet F06  effort M
- Legacy: Old bulk selection arbitrary rows, draft disabled; retry only failed IDs docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:363-396,827-835.
- vNext now: New bulk only 25 selected, preview and retry skipped, server strict max25 src/components/placements/super-admin-bulk-drive-actions.tsx:31-45,106-111; src/modules/placements/super-admin-bulk-drive-service.ts:16-20.
- Fix: Explain 25 cap and preserve progress/failure counts when processing >25 via batches.

## G2-8-030-034  [P2] GAP  facet F10  effort M
- Legacy: Old setAdminJobStatus(jobId,Boolean,collegeId), single toggle refresh docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:334-360.
- vNext now: New POST /api/admin/placements/drives/bulk action OPEN/CLOSE jobIds confirmed src/components/placements/super-admin-bulk-drive-actions.tsx:31-46; src/modules/placements/super-admin-bulk-drive-service.ts:86-110.
- Fix: Provide adapter and distinguish PUBLISHED/CLOSED state from legacy isActive boolean.

## G2-8-030-054  [P2] GAP  facet F21  effort M
- Legacy: Old JobForm and StudentPlacementLookup integrated; mutation AdminService audit/notifications docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:6-21,757-758,879-901.
- vNext now: New direct placement TPO operations read, bulk through closePlacementJob and activity events src/app/(authenticated)/admin/placements/drives/page.tsx:38-55; src/modules/placements/super-admin-bulk-drive-service.ts:74-81,100-102.
- Fix: Keep student lookup and per-action audit/notice parity.

## G2-8-030-056  [P2] GAP  facet F22  effort M
- Legacy: Old bulk status includes full job IDs and failed reason result, can select 100 rows/page docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:363-396,827-844.
- vNext now: New max25 bulk, results only UPDATED/SKIPPED, no persistent batch entity shown src/modules/placements/super-admin-bulk-drive-service.ts:16-20,86-110.
- Fix: Store batch audit and support safe resumable chunks for 100 rows.
