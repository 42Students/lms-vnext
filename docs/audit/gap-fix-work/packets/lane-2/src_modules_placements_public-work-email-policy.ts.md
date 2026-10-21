# Work packet: edit src/modules/placements/public-work-email-policy.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/dns-mail-domain-resolver.md, docs/audit/gap2/lane-8/l12-u012-mail-domain-resolver.md

## G2-13-012-028  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:94-99` blocks full resource-backed personal/disposable/academic domain lists
- vNext now: `src/modules/placements/public-work-email-policy.ts:3-24` small inline personal/disposable sets and regex-based academic detection
- Fix: Compare and migrate complete legacy blocklists and academic suffixes; keep centrally refreshed policy

## G2-12-012-007  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:109-120 rejects numeric IP or any colon (including IPv6)
- vNext now: src/modules/placements/public-work-email-policy.ts:16-23 only explicit dotted-quad and bracket patterns
- Fix: Apply true IP-address rejection for IPv4 variants and IPv6 hosts
