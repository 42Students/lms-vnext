# Work packet: edit src/modules/placements/admin-company-directory-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-16/u024-super-admin-company-controller.md, docs/audit/gap2/lane-9/superadmin-companies-college.md, docs/audit/gap2/lane-9/superadmin-company-curation.md

## G2-10-004-016  [P1] GAP  facet F04  effort L
- Legacy: Old global item summarizes number of colleges and drives across platform `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:66-70` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:44-50`
- vNext now: New row repeats one company per relationship and counts company colleges within authorized scope `src/modules/placements/admin-company-directory-service.ts:68-104` `src/app/(authenticated)/admin/companies/page.tsx:176-181`
- Fix: Build distinct global company view with global counts for unscoped admin and scoped counts when restricted

## G2-10-004-025  [P1] GAP  facet F05  effort L
- Legacy: Old global page 50 and fixed no size chooser `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-41` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:93-95`
- vNext now: New relationship page 50 but duplicates same employer for each college `src/modules/placements/admin-company-directory-service.ts:63-120`
- Fix: Page distinct global companies before joining college relationships to match 50 unique employers

## G2-10-004-047  [P1] GAP  facet F10  effort L
- Legacy: Legacy global GET returns distinct companies with domains aliases colleges drives `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminCompanyController.java:45-51` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-65`
- vNext now: New service joins relationships and pages relationship rows `src/modules/placements/admin-company-directory-service.ts:63-120`
- Fix: Add distinct global-company list endpoint/service projection before relationship joins

## G2-10-004-053  [P1] GAP  facet F11  effort M
- Legacy: Legacy curator sees global master regardless selected college, while college tab restricted `docs/legacy-source/frontend/src/pages/superadmin/companies/index.js:8-21` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-65`
- vNext now: New GLOBAL tab while a college is selected warns results remain scoped to college `src/app/(authenticated)/admin/companies/page.tsx:40-55` `src/modules/placements/admin-company-directory-service.ts:36-40`
- Fix: Restore genuine global curated list independent of selected college, or clearly require clearing scope before selecting global tab

## G2-10-004-080  [P1] GAP  facet F19  effort L
- Legacy: Legacy global query page 50 distinct companies and college query page 10 from full client list `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-41` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:55-56`
- vNext now: New always 50 relationships server-paged `src/modules/placements/admin-company-directory-service.ts:109-120`
- Fix: Decouple pagination units by tab: company vs relationship; restore 10 college page size

## G2-10-004-081  [P1] GAP  facet F19  effort L
- Legacy: Old global companies with same name but different domain both listed distinct IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-65` `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-15`
- vNext now: New query joins and repeats one company on multiple colleges, and schema enforces unique lower(name) `src/modules/placements/admin-company-directory-service.ts:68-112` `src/db/schema/placements.ts:59-64`
- Fix: Redesign distinct identity listing independent of relationship rows

## G2-16-024-003  [P1] GAP  facet F02  effort L
- Legacy: CompanyCurationService.java:35-65 global curated company list not per-college rows.
- vNext now: admin-company-directory-service.ts:10-18 and companies/page.tsx:44-55 relationship rows constrained by selected scope.
- Fix: Provide true global company identity list independent of existing college relationships.

## G2-16-024-036  [P1] GAP  facet F11  effort M
- Legacy: SuperAdminCompanyController.java:20 restricted ROLE_SUPER_ADMIN globally.
- vNext now: admin-company-directory-service.ts:11-18 require SuperAdmin and selected college/org filter.
- Fix: Permit authorized global curation independent of selected college where owner intends platform-wide.

## G2-16-024-055  [P1] GAP  facet F22  effort M
- Legacy: CompanyCurationService.java:35-51 global company search includes all live companies including unlinked.
- vNext now: admin-company-directory-service.ts:63-67 FROM placementCompanyRelationships INNER JOIN companies.
- Fix: Use placementCompanies left join relationships for truly global directory.

## G2-9-033-047  [P1] GAP  facet F19  effort L
- Legacy: Legacy global query page 50 distinct companies and college query page 10 from full client list `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-41` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:55-56`
- vNext now: New always 50 relationships server-paged `src/modules/placements/admin-company-directory-service.ts:109-120`
- Fix: Decouple pagination units by tab: company vs relationship; restore 10 college page size

## G2-9-033-061  [P1] MISSING  facet F04  effort M
- Legacy: Company contact person name shown on first line `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:263-269`
- vNext now: Private contacts not projected from relationships `src/modules/placements/admin-company-directory-service.ts:68-104`
- Fix: Expose scoped contact person in college-only list query and column.

## G2-9-033-062  [P1] MISSING  facet F04  effort M
- Legacy: Company contact email muted on second line `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:263-269`
- vNext now: Private contact email absent from directory projection `src/modules/placements/admin-company-directory-service.ts:68-104`
- Fix: Expose and mask email only in authorized college CRM.

## G2-9-034-010  [P1] GAP  facet F04  effort L
- Legacy: Old global item summarizes number of colleges and drives across platform `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:66-70` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:44-50`
- vNext now: New row repeats one company per relationship and counts company colleges within authorized scope `src/modules/placements/admin-company-directory-service.ts:68-104` `src/app/(authenticated)/admin/companies/page.tsx:176-181`
- Fix: Build distinct global company view with global counts for unscoped admin and scoped counts when restricted

## G2-9-034-015  [P1] GAP  facet F05  effort L
- Legacy: Old global page 50 and fixed no size chooser `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-41` `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:93-95`
- vNext now: New relationship page 50 but duplicates same employer for each college `src/modules/placements/admin-company-directory-service.ts:63-120`
- Fix: Page distinct global companies before joining college relationships to match 50 unique employers

## G2-9-034-026  [P1] GAP  facet F10  effort L
- Legacy: Legacy global GET returns distinct companies with domains aliases colleges drives `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminCompanyController.java:45-51` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-65`
- vNext now: New service joins relationships and pages relationship rows `src/modules/placements/admin-company-directory-service.ts:63-120`
- Fix: Add distinct global-company list endpoint/service projection before relationship joins

## G2-9-034-030  [P1] GAP  facet F11  effort M
- Legacy: Legacy curator sees global master regardless selected college, while college tab restricted `docs/legacy-source/frontend/src/pages/superadmin/companies/index.js:8-21` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-65`
- vNext now: New GLOBAL tab while a college is selected warns results remain scoped to college `src/app/(authenticated)/admin/companies/page.tsx:40-55` `src/modules/placements/admin-company-directory-service.ts:36-40`
- Fix: Restore genuine global curated list independent of selected college, or clearly require clearing scope before selecting global tab

## G2-9-034-046  [P1] GAP  facet F19  effort L
- Legacy: Legacy global query page 50 distinct companies and college query page 10 from full client list `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-41` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:55-56`
- vNext now: New always 50 relationships server-paged `src/modules/placements/admin-company-directory-service.ts:109-120`
- Fix: Decouple pagination units by tab: company vs relationship; restore 10 college page size

## G2-9-034-047  [P1] GAP  facet F19  effort L
- Legacy: Old global companies with same name but different domain both listed distinct IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-65` `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-15`
- vNext now: New query joins and repeats one company on multiple colleges, and schema enforces unique lower(name) `src/modules/placements/admin-company-directory-service.ts:68-112` `src/db/schema/placements.ts:59-64`
- Fix: Redesign distinct identity listing independent of relationship rows

## G2-9-034-068  [P1] GAP  facet F05  effort L
- Legacy: Default list is 50 distinct company IDs with page0 and 50 rows fixed `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:34-43,94-95`
- vNext now: 50 relationship records with repeated company IDs `src/modules/placements/admin-company-directory-service.ts:63-120`
- Fix: Page companies before relationship enrichment; never count multiple colleges as rows.

## G2-9-034-091  [P1] GAP  facet F10  effort L
- Legacy: Legacy GET q/unverified/page/size distinct platform companies `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminCompanyController.java:45-51`
- vNext now: New RSC service query filters relationship rows `src/modules/placements/admin-company-directory-service.ts:63-120`
- Fix: Separate global-catalogue query from college-company relationships.
