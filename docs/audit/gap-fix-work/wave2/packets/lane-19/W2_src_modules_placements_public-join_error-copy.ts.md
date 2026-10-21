# Work packet (wave 2): edit src/modules/placements/public-join/error-copy.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/dns-mail-domain-resolver.md

## G2-13-012-005  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:40-49` user-visible outcomes INVALID, PERSONAL, DISPOSABLE, ACADEMIC, IP_ADDRESS, NO_MAIL
- vNext now: `src/modules/placements/public-join/error-copy.ts:1-3` public join shows EMAIL_NO_MX/EMAIL_MX_UNAVAILABLE
- Fix: Preserve per-outcome helper/error content in public-company and TPO entry flows

## G2-13-012-037  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:48` exact no-mail message 'This domain doesn't receive email. Check the spelling'
- vNext now: `src/modules/placements/public-join/error-copy.ts:2` exact new wording 'This email domain has no mail server. Check the address.'
- Fix: Align copy or document purposeful rewrite and update old-copy catalogue exception
