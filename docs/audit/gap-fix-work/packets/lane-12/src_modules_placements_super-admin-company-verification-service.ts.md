# Work packet: edit src/modules/placements/super-admin-company-verification-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-company-curation.md

## G2-9-034-093  [P1] GAP  facet F10  effort M
- Legacy: Legacy POST verification updates global and domain verified flags `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:67-76`
- vNext now: New verification only placementCompanies.verifiedAt/ByUserId `src/modules/placements/super-admin-company-verification-service.ts:18-39`
- Fix: Track domain verification consistency after verify/unverify.
