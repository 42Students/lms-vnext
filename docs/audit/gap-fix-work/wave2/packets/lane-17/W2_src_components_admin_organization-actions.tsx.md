# Work packet (wave 2): edit src/components/admin/organization-actions.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/superadmin-organizations.md, docs/audit/gap2/lane-6/base-model.md, docs/audit/gap2/lane-6/organization.md

## G2-3-030-014  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:155-161`
- vNext now: `src/components/admin/organization-actions.tsx:104-110`
- Fix: Legacy Edit / Delete visible buttons with icons per row; vNext Actions dropdown with Rename / Archive hidden behind menu.

## G2-3-030-015  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:208-214`
- vNext now: `src/components/admin/organization-actions.tsx:113-158`
- Fix: Legacy Edit “name” modal and footer; vNext Rename organization Dialog with different title/body help.

## G2-3-030-036  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:134-146`
- vNext now: `src/components/admin/organization-actions.tsx:113-158`
- Fix: Legacy dirty edit cancel confirmation Discard changes to this organization?; vNext rename dialog closes without draft guard.

## G2-3-030-037  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:156-163`
- vNext now: `src/components/admin/organization-actions.tsx:160-169`
- Fix: Legacy compact Popconfirm Delete “name”?; vNext ConfirmDialog Archive name? with different button labels.

## G2-3-030-070  [P2] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:134-146`
- vNext now: `src/components/admin/organization-actions.tsx:113-158`
- Fix: Dirty edit cancel guard absent in new Rename dialog; add confirmation.

## G2-6-021-030  [P2] GAP  facet F18  effort S
- Legacy: Common columns snake_case created_at, updated_at, is_deleted (BaseModel.java:28-37).
- vNext now: VNext API status terms Archived vs legacy Deleted (organizations/service.ts:258-265; organization-actions.tsx:93-97).
- Fix: Map action labels with explicit intentional semantics and exact copy catalog.

## G2-6-018-005  [P2] GAP  facet F03  effort M
- Legacy: Legacy Plus icon on Create Organization; Reload on Refresh and Edit/Delete icons (Organizations.js:1-3,154-160,175-185).
- vNext now: vNext Create Organization button text without inline icon; Actions dropdown text (organization-create-form.tsx:79-81; organization-actions.tsx:104-110).
- Fix: Clone Plus/Reload/Edit/Delete icon affordances in equivalent UI.

## G2-3-030-038  [P3] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:208-215`
- vNext now: `src/components/admin/organization-actions.tsx:113-158`
- Fix: Legacy Edit modal title includes smart quotes and action footer; vNext generic Rename organization heading and Save name.
