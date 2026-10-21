# Work packet: edit src/components/admin/super-admin-company-identities.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-9/superadmin-companies-college.md, docs/audit/gap2/lane-9/superadmin-company-curation.md

## G2-10-004-036  [P2] GAP  facet F07  effort S
- Legacy: Old alias validator 2..150 and collision message Merge them instead `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:183-199`
- vNext now: New alias input allows 160 and canonical normalization via NFKC `src/modules/placements/company-curation-alias-model.ts:2-11` `src/components/admin/super-admin-company-identities.tsx:41-44`
- Fix: Set alias upper limit150 and ensure cross-company collision text and normalization parity

## G2-10-004-037  [P2] GAP  facet F07  effort M
- Legacy: Old domain accepts domain or name@company.com with ownership collision and minimum-one-domain guard `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:107-137` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:123-130`
- vNext now: New domain Input max253; schema strict hostname regex and input label says Company domain or email `src/components/admin/super-admin-company-identities.tsx:40-54` `src/modules/placements/company-curation-domain-model.ts:2-7`
- Fix: Verify email extraction path and preserve legacy collision and minimum-one-domain messages

## G2-9-033-022  [P2] GAP  facet F07  effort M
- Legacy: Old domain accepts domain or name@company.com with ownership collision and minimum-one-domain guard `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:107-137` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:123-130`
- vNext now: New domain Input max253; schema strict hostname regex and input label says Company domain or email `src/components/admin/super-admin-company-identities.tsx:40-54` `src/modules/placements/company-curation-domain-model.ts:2-7`
- Fix: Verify email extraction path and preserve legacy collision and minimum-one-domain messages

## G2-9-034-021  [P2] GAP  facet F07  effort S
- Legacy: Old alias validator 2..150 and collision message Merge them instead `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:183-199`
- vNext now: New alias input allows 160 and canonical normalization via NFKC `src/modules/placements/company-curation-alias-model.ts:2-11` `src/components/admin/super-admin-company-identities.tsx:41-44`
- Fix: Set alias upper limit150 and ensure cross-company collision text and normalization parity

## G2-9-034-022  [P2] GAP  facet F07  effort M
- Legacy: Old domain accepts domain or name@company.com with ownership collision and minimum-one-domain guard `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:107-137` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:123-130`
- vNext now: New domain Input max253; schema strict hostname regex and input label says Company domain or email `src/components/admin/super-admin-company-identities.tsx:40-54` `src/modules/placements/company-curation-domain-model.ts:2-7`
- Fix: Verify email extraction path and preserve legacy collision and minimum-one-domain messages

## G2-9-034-083  [P2] MISSING  facet F08  effort S
- Legacy: Legacy domain added and removed message.success `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:114-127`
- vNext now: New mutation router.refresh only `src/components/admin/super-admin-company-identities.tsx:14-24`
- Fix: Show 'Domain added' and 'Domain removed' toast.

## G2-9-034-084  [P2] MISSING  facet F08  effort S
- Legacy: Legacy Alias Add 'Name added. The company search finds it now.' `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:53-57`
- vNext now: New alias add silent refresh `src/components/admin/super-admin-company-identities.tsx:14-24`
- Fix: Restore exact alias-add notification.

## G2-9-034-085  [P2] MISSING  facet F08  effort S
- Legacy: Legacy alias removal 'Name removed' `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:140-145`
- vNext now: New alias remove silent refresh `src/components/admin/super-admin-company-identities.tsx:14-24`
- Fix: Restore exact alias-remove toast.
