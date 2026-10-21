# Work packet: edit src/modules/placements/super-admin-company-edit-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-company-curation.md

## G2-9-034-096  [P1] GAP  facet F11  effort M
- Legacy: Legacy global list is superadmin-only independent of college scope `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminCompanyController.java:20-24`
- vNext now: New identities/edit require global scope, and UI hides actions when scope selected `src/modules/placements/super-admin-company-identities-service.ts:15-19`; `src/modules/placements/super-admin-company-edit-service.ts:13-17`
- Fix: Treat 42 global catalogue as independent platform scope even if header has a selected college, with safe scoping.

## G2-9-034-097  [P1] GAP  facet F12  effort L
- Legacy: Legacy domain owned by company unique after V202; same names can belong to distinct companies `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-19`
- vNext now: New lower(name) unique index, and edit duplicate-name rejection `src/db/schema/placements.ts:59-64`; `src/modules/placements/super-admin-company-edit-service.ts:25-28`
- Fix: Drop name uniqueness, key canonical identity by verified domain.
