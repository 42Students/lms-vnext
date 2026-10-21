# Work packet (wave 2): edit src/modules/placements/recruiter-message-email-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/tpo-mail-service.md, docs/audit/gap2/lane-20/recruiter-message-email-service.md

## G2-18-010-010  [P2] GAP  facet F03  effort S
- Legacy: Legacy name safe limits 80 chars and replaces CR/LF/quote/angle/comma/semicolon/colon/backslash (`TpoMailService.java:164-170`).
- vNext now: New recruiter digest sanitizes recipient name (160), but collegeName is merged as content, not From name (`recruiter-message-email-model.ts:20-40`; `recruiter-message-email-provider.ts:40-47`).
- Fix: Port 80-char safe From name sanitizer and test header injection.

## G2-18-010-011  [P2] GAP  facet F03  effort S
- Legacy: Legacy greeting `name` blank becomes `there` (`TpoMailService.java:192-200`).
- vNext now: New digest `name` uses safeRecruiterEmailMergeText but no blank fallback (`recruiter-message-email-provider.ts:43-48`; `recruiter-message-email-model.ts:20-30`).
- Fix: Use `there` when recipientName trims empty.

## G2-18-010-017  [P2] GAP  facet F04  effort S
- Legacy: Legacy angle brackets in merge values replaced with ‹ and ›, null becomes empty string (`TpoMailService.java:192-201`).
- vNext now: New recruiter digest escapes HTML including & <> quotes and trims controls, max4000 (`recruiter-message-email-model.ts:19-30`).
- Fix: Agree exact email-rendering and escaping contract; test ampersands/markup and expected punctuation.

## G2-20-010-003  [P2] GAP  facet F01  effort M
- Legacy: Reply-To recruitment+<tag>-<code>@42lms.com by environment `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:46-59`
- vNext now: Reply-To r-<32hex>@configured domain `src/modules/placements/recruiter-message-email-model.ts:47-60`
- Fix: Verify DNS routing and aliases across production/development and preserve old replies

## G2-18-010-059  [P3] GAP  facet F18  effort S
- Legacy: Legacy blank `name` becomes `there` (`TpoMailService.java:196-200`).
- vNext now: New safeRecruiterEmailMergeText empty remains blank (`recruiter-message-email-model.ts:20-30`).
- Fix: Use exact `there` fallback.

## G2-20-010-013  [P3] GAP  facet F04  effort S
- Legacy: Full messages in latest-three digest, up to DB message length `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:125-135`
- vNext now: HTML escaping and 4000-character post-escape truncation `src/modules/placements/recruiter-message-email-model.ts:20-30,41-43`
- Fix: Test ampersands, entities and surrogate text to avoid silently cutting content
