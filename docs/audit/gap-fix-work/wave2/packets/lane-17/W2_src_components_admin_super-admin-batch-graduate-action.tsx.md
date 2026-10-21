# Work packet (wave 2): edit src/components/admin/super-admin-batch-graduate-action.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-batch-promotion-component.md, docs/audit/gap2/lane-9/superadmin-batch-promotion.md

## G2-9-028-011  [P2] GAP  facet F03  effort M
- Legacy: Inline Mark graduated button with check-circle icon `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:334-347`
- vNext now: Graduate button appears only in preview, with no icon `src/app/(authenticated)/admin/batch-promotion/page.tsx:129-132` `src/components/admin/super-admin-batch-graduate-action.tsx:37-45`
- Fix: Render graduation inline with icon

## G2-9-028-035  [P2] GAP  facet F09  effort S
- Legacy: Graduation Popconfirm Graduate NAME, reactivation hint, Mark graduated `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:334-348`
- vNext now: Graduation ConfirmDialog mentions retained history, no reactivation guidance `src/components/admin/super-admin-batch-graduate-action.tsx:42-47`
- Fix: Match legacy reactivation hint

## G2-9-022-011  [P2] GAP  facet F03  effort M
- Legacy: Inline Mark graduated button with check-circle icon `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:334-347`
- vNext now: Graduate button appears only in preview, with no icon `src/app/(authenticated)/admin/batch-promotion/page.tsx:129-132` `src/components/admin/super-admin-batch-graduate-action.tsx:37-45`
- Fix: Render graduation inline with icon

## G2-9-022-035  [P2] GAP  facet F09  effort S
- Legacy: Graduation Popconfirm Graduate NAME, reactivation hint, Mark graduated `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:334-348`
- vNext now: Graduation ConfirmDialog mentions retained history, no reactivation guidance `src/components/admin/super-admin-batch-graduate-action.tsx:42-47`
- Fix: Match legacy reactivation hint

## G2-9-028-040  [P3] GAP  facet F10  effort M
- Legacy: Graduation uses updateBatch full payload status COMPLETED `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:124-138`
- vNext now: POST /api/college/batches/{id}/graduate confirm true `src/components/admin/super-admin-batch-graduate-action.tsx:12-33`
- Fix: Preserve lifecycle outcomes and detailed receipt validation

## G2-9-022-040  [P3] GAP  facet F10  effort M
- Legacy: Graduation uses updateBatch full payload status COMPLETED `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:124-138`
- vNext now: POST /api/college/batches/{id}/graduate confirm true `src/components/admin/super-admin-batch-graduate-action.tsx:12-33`
- Fix: Preserve lifecycle outcomes and detailed receipt validation
