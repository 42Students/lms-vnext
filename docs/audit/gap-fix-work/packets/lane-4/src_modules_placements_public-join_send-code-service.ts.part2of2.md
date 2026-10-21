# Work packet: edit src/modules/placements/public-join/send-code-service.ts (part 2 of 2)

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l12-u012-mail-domain-resolver.md

## G2-12-012-018  [P1] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:28-35 repeats lookup if cache expired and leaves UNKNOWN uncached
- vNext now: src/modules/placements/public-join/send-code-service.ts:83-89 stops code delivery on timeout
- Fix: On temporary DNS outage show retryable state and permit continuation when safe

## G2-12-012-026  [P1] GAP  facet F20  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:50-52 MX OR A OR AAAA; NO_MAIL only if all absent
- vNext now: src/modules/placements/public-join/send-code-service.ts:84-91 NO_MAIL on ENODATA
- Fix: Support valid A/AAAA-only domains rather than false negative

## G2-12-012-008  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:38-49 maps no-mail to 'This domain doesn't receive email. Check the spelling'
- vNext now: src/modules/placements/public-join/send-code-service.ts:84-91 emits EMAIL_NO_MX with separate error-code display path
- Fix: Use exact no-mail legacy sentence for linked company/recruiter form or document approved replacement
