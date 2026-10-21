# Work packet: edit src/modules/placements/public-join/error-copy.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/dns-mail-domain-resolver.md, docs/audit/gap2/lane-6/public-company-join-controller.md

## G2-13-012-029  [P1] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:58-59` DNS failure results UNKNOWN; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:101-102` caller accepts UNKNOWN
- vNext now: `src/modules/placements/public-join/error-copy.ts:3` shows 'We couldn't verify this email domain right now. Please try again.' and `src/modules/placements/public-join/send-code-service.ts:88` rejects
- Fix: Specify transient DNS UX and offer resilient retry without misreporting NO_MAIL

## G2-13-012-039  [P1] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/MailDomainResolver.java:11-12` UNKNOWN has no user-facing blocking warning
- vNext now: `src/modules/placements/public-join/error-copy.ts:3` EMAIL_MX_UNAVAILABLE is a blocking UI error
- Fix: Avoid presenting temporary DNS uncertainty as a definitive bad email

## G2-13-012-015  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:48` user copy 'This domain doesn't receive email. Check the spelling'
- vNext now: `src/modules/placements/public-join/error-copy.ts:2` vNext copy 'This email domain has no mail server. Check the address.'
- Fix: Unify exact legacy domain error copy or record a deliberate wording exception

## G2-6-026-021  [P2] GAP  facet F07  effort M
- Legacy: Legacy invalid email can map COMPANY_EMAIL_REQUIRED or OTHER_COMPANY_EMAIL under Work email (company-join/[token].js:6-10,53-59).
- vNext now: VNext error is shared InlineNotice with generic 'Use your company work email address' copy (public-recruiter-join-form.tsx:69-72,217; error-copy.ts:12-15).
- Fix: Restore field-level invalid email annotations and exact company-specific domain wording.

## G2-6-026-023  [P2] GAP  facet F07  effort S
- Legacy: Legacy ACCESS_REMOVED error detailed contact placement cell explanation (CompanyJoinService.java:259-263).
- vNext now: VNext REMOVED maps to ACCESS_REMOVED code and shorter notice (join/route.ts:20-27; error-copy.ts:14).
- Fix: Restore legacy wording that includes appeal if placement cell revoked access.
