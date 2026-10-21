# Work packet (wave 2): edit src/components/admin/super-admin-company-verification.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-9/superadmin-company-curation.md

## G2-10-004-048  [P2] GAP  facet F10  effort M
- Legacy: Legacy global verify POST id/verify toggles verified and domain verified flag; invalidates search `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminCompanyController.java:53-56` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:67-76`
- vNext now: New POST /api/admin/companies/verification invoked for verified state; company verifiedAt field `src/components/admin/super-admin-company-verification.tsx:13-22` `src/db/schema/placements.ts:34-38`
- Fix: Check verification propagates across all domains and recruiter drive company matching

## G2-9-034-027  [P2] GAP  facet F10  effort M
- Legacy: Legacy global verify POST id/verify toggles verified and domain verified flag; invalidates search `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminCompanyController.java:53-56` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:67-76`
- vNext now: New POST /api/admin/companies/verification invoked for verified state; company verifiedAt field `src/components/admin/super-admin-company-verification.tsx:13-22` `src/db/schema/placements.ts:34-38`
- Fix: Check verification propagates across all domains and recruiter drive company matching
