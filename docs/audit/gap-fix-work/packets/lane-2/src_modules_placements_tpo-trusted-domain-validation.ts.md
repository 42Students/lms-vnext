# Work packet: edit src/modules/placements/tpo-trusted-domain-validation.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/company-domain.md

## G2-12-020-017  [P1] GAP  facet F06  effort M
- Legacy: Legacy CompanyDomainService accepts email/URL/@domain, canonicalizes registrable domain with PSL `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:77-103,110-138`
- vNext now: New superadmin regex max253 and website strips only www; TPO parser validates host without PSL `src/modules/placements/company-curation-domain-model.ts:2-8` `src/modules/placements/tpo-trusted-domain-validation.ts:15-23`
- Fix: Normalize every input to registrable domain using a complete public-suffix parser.

## G2-12-020-055  [P1] GAP  facet F23  effort M
- Legacy: Old domain accepts website/email/registrable normalized input via one CompanyDomainService `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:16-25,77-103`
- vNext now: New validators diverge between public/admin/TPO `src/modules/placements/super-admin-company-identities-service.ts:20-31` `src/modules/placements/tpo-trusted-domain-validation.ts:15-23`
- Fix: Adopt shared registry validation with exact error mapping.

## G2-12-020-022  [P2] GAP  facet F07  effort S
- Legacy: Old invalid mail/domain typed response from CompanyDomainService exact error enum `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:29-49`
- vNext now: New regex Zod and generic 'Use valid non-free company domain' from TPO `src/modules/placements/tpo-trusted-domain-validation.ts:15-23`
- Fix: Map each original invalid reason to actionable field message.
