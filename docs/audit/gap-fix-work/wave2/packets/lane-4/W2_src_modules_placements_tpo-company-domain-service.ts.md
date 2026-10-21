# Work packet (wave 2): edit src/modules/placements/tpo-company-domain-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/company-domain.md, docs/audit/gap2/lane-13/dns-mail-domain-resolver.md

## G2-12-020-036  [P2] GAP  facet F12  effort S
- Legacy: Legacy record addedByCollegeId retains first source college `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:43-44`
- vNext now: New creator global user only; TPO add writes primary domain without provenance `src/modules/placements/tpo-company-domain-service.ts:45-55`
- Fix: Retain verified provenance for shared recruiter/company matching.

## G2-13-012-012  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:111-125` accepts typed URL, @domain, email and bare host through canonicalizer
- vNext now: `src/modules/placements/public-college-join-model.ts:6-7` workEmail field only; `src/modules/placements/tpo-company-domain-service.ts:12-25` plain domain schema
- Fix: Preserve each consuming form's intended accepted input syntaxes and centralized normalization
