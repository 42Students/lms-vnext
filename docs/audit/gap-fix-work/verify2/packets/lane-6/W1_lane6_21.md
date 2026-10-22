# Verification packet (P1 round 2): 3 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-034-091 [P1] GAP facet F10
- Files: src/modules/placements/admin-company-directory-service.ts
- Legacy: Legacy GET q/unverified/page/size distinct platform companies `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminCompanyController.java:45-51`
- Expected fix: Separate global-catalogue query from college-company relationships.

## G2-9-034-111 [P1] GAP facet F19
- Files: src/modules/placements/admin-company-directory-service.ts
- Legacy: Old query caps page size100, UI 50, distinct global companies `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-39`
- Expected fix: Page on canonical company IDs; use joins only for row stats.

## G2-9-034-112 [P1] GAP facet F19
- Files: src/modules/placements/admin-company-directory-service.ts
- Legacy: Old data includes platform-wide counts from live relations and jobs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:44-51`
- Expected fix: Return correct platform-wide counts for authorized global curated list.
