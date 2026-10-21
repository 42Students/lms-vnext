# Work packet: edit src/components/admin/super-admin-company-merge.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-company-curation.md, docs/audit/gap2/lane-16/u024-super-admin-company-controller.md

## G2-9-034-078  [P1] GAP  facet F06  effort M
- Legacy: Legacy merge modal target searchable, options only current 50 rows and exclude source `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:161-173`
- vNext now: Merge selects source/target only detected duplicate group `src/components/admin/super-admin-company-merge.tsx:37-50`
- Fix: Search all accessible target companies, not only same-page duplicate detections.

## G2-9-034-089  [P1] GAP  facet F09  effort M
- Legacy: Old Merge modal warns domains, drives, recruiters and every college's notes move `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:161-171`
- vNext now: New confirmation only states jobs and recruiter grants reassigned `src/components/admin/super-admin-company-merge.tsx:55-59`
- Fix: Preserve explicit data-migration disclosure or mark unsupported cross-college merge.

## G2-16-024-021  [P3] GAP  facet F07  effort S
- Legacy: CompanyCurationService.java:143 `Pick two different companies`.
- vNext now: super-admin-company-merge.tsx:19,50-53 disables same source and target, no inline exact error.
- Fix: Keep exact validation in server response and visible guidance.

## G2-9-034-086  [P3] GAP  facet F08  effort S
- Legacy: Legacy merge success toast 'Merged' `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:161-164`
- vNext now: New inline result 'Company merged. Canonical company retained; duplicate archived.' `src/components/admin/super-admin-company-merge.tsx:29-33`
- Fix: Show same short toast, retaining informative detail as nonblocking text.
