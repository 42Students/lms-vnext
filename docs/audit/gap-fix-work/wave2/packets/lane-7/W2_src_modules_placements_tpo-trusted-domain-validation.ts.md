# Work packet (wave 2): edit src/modules/placements/tpo-trusted-domain-validation.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/company-domain.md

## G2-12-020-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy model is server-side domain row, UI comes from company Settings/curation `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:14-48`
- vNext now: New superadmin domain editor separate from TPO trusted-domain flow `src/modules/placements/super-admin-company-identities-service.ts:20-62` `src/modules/placements/tpo-trusted-domain-validation.ts:3-23`
- Fix: Match domain list/add/remove visuals across roles.

## G2-12-020-044  [P2] GAP  facet F18  effort S
- Legacy: Legacy errors differentiate personal/disposable/academic/IP/no-mail `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:39-49`
- vNext now: New generic regex and limited academic domain check `src/modules/placements/super-admin-company-identities-service.ts:28-31` `src/modules/placements/tpo-trusted-domain-validation.ts:15-23`
- Fix: Provide precise legacy validation copy in UI.
