# Work packet (wave 2): edit src/modules/placements/public-college-join-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/dns-mail-domain-resolver.md

## G2-13-012-010  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:35` null or blank domain yields NO_MAIL, no exception
- vNext now: `src/modules/placements/public-college-join-model.ts:6-7` zod rejects invalid email before send-code and no DNS call
- Fix: Preserve concise input error mapping; prohibit DNS on blank domain

## G2-13-012-012  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:111-125` accepts typed URL, @domain, email and bare host through canonicalizer
- vNext now: `src/modules/placements/public-college-join-model.ts:6-7` workEmail field only; `src/modules/placements/tpo-company-domain-service.ts:12-25` plain domain schema
- Fix: Preserve each consuming form's intended accepted input syntaxes and centralized normalization

## G2-13-012-043  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:34-43` cache key exact caller-supplied domain; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:111-125` canonicalizes before lookup
- vNext now: `src/modules/placements/public-join/send-code-service.ts:76` takes normalized email domain, case normalization by `src/modules/placements/public-college-join-model.ts:6-7`
- Fix: Canonicalize IDNs, trailing dot, host/subdomain consistently before cache/dns checks
