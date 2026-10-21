# Work packet (wave 2): edit src/modules/placements/public-join/domain-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l12-u012-mail-domain-resolver.md

## G2-12-012-006  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:78-107 checkEmail trims and lowercases; checkDomain accepts typed domain, @domain and URL
- vNext now: src/modules/placements/validation.ts:15-30 accepts plain domain only; src/modules/placements/public-join/domain-model.ts:19-24 email only
- Fix: Normalize websites, leading @, email domains and typed subdomains before validation consistently
