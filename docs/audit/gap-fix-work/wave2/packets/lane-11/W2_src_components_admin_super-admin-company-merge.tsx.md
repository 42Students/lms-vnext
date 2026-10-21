# Work packet (wave 2): edit src/components/admin/super-admin-company-merge.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-9/superadmin-company-curation.md, docs/audit/gap2/lane-16/u024-super-admin-company-controller.md

## G2-10-004-029  [P2] GAP  facet F06  effort M
- Legacy: Old global merge is AsyncModal Merge X into… with searchable target list `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:161-173`
- vNext now: New merge source/keep dropdowns inline in duplicate cards and separate confirmation `src/components/admin/super-admin-company-merge.tsx:36-61` `src/app/(authenticated)/admin/companies/page.tsx:205-211`
- Fix: Expose Merge on each global company row and searchable company selector including targets beyond page

## G2-9-034-017  [P2] GAP  facet F06  effort M
- Legacy: Old global merge is AsyncModal Merge X into… with searchable target list `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:161-173`
- vNext now: New merge source/keep dropdowns inline in duplicate cards and separate confirmation `src/components/admin/super-admin-company-merge.tsx:36-61` `src/app/(authenticated)/admin/companies/page.tsx:205-211`
- Fix: Expose Merge on each global company row and searchable company selector including targets beyond page

## G2-16-024-020  [P3] GAP  facet F06  effort S
- Legacy: SuperAdminCompanyController.java:29-43 verify/alias/domain/merge body property names.
- vNext now: super-admin-company-merge.tsx:23-26 uses keepCompanyId,mergeCompanyId,confirm rather than intoCompanyId.
- Fix: Map old `{intoCompanyId}` to new command if preserving client API.
