# Work packet: edit src/modules/placements/public-join/domain-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/dns-mail-domain-resolver.md, docs/audit/gap2/lane-8/l12-u012-mail-domain-resolver.md

## G2-13-012-027  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:94-102` normalized registrable via Guava public suffix, then domain lookup
- vNext now: `src/modules/placements/public-join/domain-model.ts:3-17` hand-maintained multipart suffix set; `src/modules/placements/public-join/domain-model.ts:19-25` exact/subdomain matching
- Fix: Use PSL-backed registrable-domain library and shared normalization across all company gates

## G2-12-012-015  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:123-141 uses Guava public suffix list for registrable domain
- vNext now: src/modules/placements/public-join/domain-model.ts:3-17 uses hand-listed multipart suffixes
- Fix: Replace handcrafted registrable-domain list with maintained public suffix logic

## G2-12-012-031  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:123-141 uses complete public-suffix registry
- vNext now: src/modules/placements/public-join/domain-model.ts:3-17 adds abbreviated suffix registry with potentially wrong company grouping
- Fix: Replace abbreviated list with public suffix registry and tests for co.in/com.au/unknown suffix
