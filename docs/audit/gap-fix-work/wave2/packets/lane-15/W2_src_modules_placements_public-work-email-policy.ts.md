# Work packet (wave 2): edit src/modules/placements/public-work-email-policy.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/dns-mail-domain-resolver.md, docs/audit/gap2/lane-8/l12-u012-mail-domain-resolver.md

## G2-13-012-038  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:43-47` differentiates invalid, personal, disposable, academic and IP messages
- vNext now: `src/modules/placements/public-work-email-policy.ts:26-31` gives different sentences and punctuation
- Fix: Create copy mapping per outcome so form fields and toasts match intended legacy language

## G2-12-012-003  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:30-50 supplies user-facing outcome text
- vNext now: src/modules/placements/public-work-email-policy.ts:26-31 has different domain-validation copy
- Fix: Map INVALID/PERSONAL/DISPOSABLE/ACADEMIC/IP/NO_MAIL text to canonical legacy copy in surfaced forms

## G2-12-012-023  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:37-49 contains exact seven-case error wording
- vNext now: src/modules/placements/public-work-email-policy.ts:26-31 provides alternative wording for same common failures
- Fix: Keep one legacy-copy mapping or record intentional text divergence
