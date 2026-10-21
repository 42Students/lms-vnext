# Work packet (wave 2): edit src/components/placements/super-admin-bulk-drive-actions.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-all.md, docs/audit/gap2/lane-8/super-admin-jobs-directory.md

## G2-10-016-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:723-754 — Selection >0 reveals blue (#e6f4ff) bulk strip below header.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:109-112; src/components/placements/super-admin-bulk-drive-actions.tsx:46-70 — Bulk Open/Close collapsed disclosure separate from table.
- Fix: Show selected count and visible blue action strip.

## G2-10-016-030  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:363-394 — Bulk selection Open/Close directly from blue toolbar; partial failures remain selected.
- vNext now: src/components/placements/super-admin-bulk-drive-actions.tsx:21-45 — Bulk two-step preview/confirmation, failed IDs selected.
- Fix: Keep safer preview but clone disclosure-free selected toolbar.

## G2-10-016-039  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:579-597 — Open/Close has small Popconfirm Yes/No anchored to row.
- vNext now: src/components/placements/super-admin-bulk-drive-actions.tsx:117-125 — Bulk ConfirmDialog full modal; no per-row Popconfirm.
- Fix: Use direct row confirmation with comparable UI.

## G2-10-016-044  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:334-361 — setAdminJobStatus on exact numeric jobId, selected college.
- vNext now: src/components/placements/super-admin-bulk-drive-actions.tsx:21-45 — New bulk POST UUID IDs, selected adminScope.
- Fix: Preserve single-row state endpoint and explicit expected lifecycle.

## G2-8-030-008  [P2] GAP  facet F03  effort M
- Legacy: Old toolbar bulk banner N selected with inline Open/Close actions docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:723-755.
- vNext now: New bulk actions collapsed under details summary, separate checkbox list src/components/placements/super-admin-bulk-drive-actions.tsx:51-88.
- Fix: Keep table selection integrated and selected count visible without expanding separate section.

## G2-8-030-018  [P2] GAP  facet F05  effort M
- Legacy: Old rowSelection on table, draft checkboxes disabled docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:827-835.
- vNext now: New separate bulk controls only eligible CLOSED or PUBLISHED, select first25 src/components/placements/super-admin-bulk-drive-actions.tsx:25-32,55-63.
- Fix: Integrate checkbox in table and preserve legacy selection semantics/limits.

## G2-8-030-021  [P2] GAP  facet F06  effort M
- Legacy: Old per-row Open/Close guarded Popconfirm Yes/No docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:578-596.
- vNext now: New bulk preview+ConfirmDialog, no direct row action src/components/placements/super-admin-bulk-drive-actions.tsx:92-125.
- Fix: Expose row status change with equivalent confirm copy and disabled pending.

## G2-8-030-022  [P2] GAP  facet F06  effort M
- Legacy: Old bulk selection arbitrary rows, draft disabled; retry only failed IDs docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:363-396,827-835.
- vNext now: New bulk only 25 selected, preview and retry skipped, server strict max25 src/components/placements/super-admin-bulk-drive-actions.tsx:31-45,106-111; src/modules/placements/super-admin-bulk-drive-service.ts:16-20.
- Fix: Explain 25 cap and preserve progress/failure counts when processing >25 via batches.

## G2-8-030-034  [P2] GAP  facet F10  effort M
- Legacy: Old setAdminJobStatus(jobId,Boolean,collegeId), single toggle refresh docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:334-360.
- vNext now: New POST /api/admin/placements/drives/bulk action OPEN/CLOSE jobIds confirmed src/components/placements/super-admin-bulk-drive-actions.tsx:31-46; src/modules/placements/super-admin-bulk-drive-service.ts:86-110.
- Fix: Provide adapter and distinguish PUBLISHED/CLOSED state from legacy isActive boolean.

## G2-8-030-050  [P2] GAP  facet F18  effort M
- Legacy: Old bulk failure N opened,N failed Retry will target only the failed drives docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:377-382.
- vNext now: New N updated,N failed Retry will target only failed drives src/components/placements/super-admin-bulk-drive-actions.tsx:106-109.
- Fix: Keep action verb and exact failure guidance.
