# Work packet: edit src/modules/placements/recruiter-message-email-provider.ts (part 2 of 2)

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/tpo-mail-service.md, docs/audit/gap2/lane-20/recruiter-message-email-service.md

## G2-18-010-066  [P1] GAP  facet F21  effort L
- Legacy: Legacy integrates ZeptoMail, tenant-domain DB, Cloudflare replies via Worker (`TpoMailService.java:43-46,133-153,183-185`).
- vNext now: New ZeptoMail+OutboundFetch, HMAC authenticated inbound, tenant-domain schema but no recruiter URL helper (`recruiter-message-email-provider.ts:34-53`; `recruiter-message-email-inbound-service.ts:21-40`; `tenant-domains.ts:15-41`).
- Fix: Verify provider token/From DNS, Cloudflare HMAC webhook and tenant URL mapping.

## G2-18-010-071  [P1] GAP  facet F23  effort L
- Legacy: Legacy support recruiter/system/student email under one branded abstraction (`TpoMailService.java:73-110`).
- vNext now: New TPO student nudges send only in-app and email bridge supports recruiter digest only (`tpo-student-nudge-send-service.ts:15-19,46-65`; `recruiter-message-email-provider.ts:9-21`).
- Fix: Create event/channel coverage matrix, add missing mail event integrations intentionally.

## G2-20-010-002  [P1] MISSING  facet F01  effort M
- Legacy: Tenant-specific deep link /recruiter/messages or /recruiter/drives/{jobId} `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:110-116`
- vNext now: Digest merge info has no route or job link `src/modules/placements/recruiter-message-email-provider.ts:40-50`
- Fix: Add verified tenant-domain deep link and proper job context to template

## G2-20-010-004  [P1] GAP  facet F02  effort M
- Legacy: Email layout includes greeting, subject, count, newest messages, earlier count and link `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:106-136`
- vNext now: Payload only name, college, company and message1-3; template content external `src/modules/placements/recruiter-message-email-provider.ts:40-50`
- Fix: Restore complete original email information hierarchy and verify rendered template

## G2-20-010-027  [P1] MISSING  facet F10  effort S
- Legacy: Deep link uses verified college domain via mail.collegeLink `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:110-116`
- vNext now: Provider sends no tenant workspace URL `src/modules/placements/recruiter-message-email-provider.ts:40-50`
- Fix: Build safe per-college URL to job/general conversation and send in merge

## G2-20-010-040  [P1] GAP  facet F15  effort M
- Legacy: Dedicated recruiter-message Zepto template, merge includes count/subject/more/link `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:106-122`
- vNext now: Dedicated campaign Zepto template but only five merge concepts `src/modules/placements/recruiter-message-email-provider.ts:24-31,40-50`
- Fix: Provision full variable set and verify template render, subject and reply-to

## G2-18-010-025  [P2] GAP  facet F07  effort M
- Legacy: Legacy absent/placeholder Zepto template ID returns NOT_CONFIGURED without sending (`TpoMailService.java:63-71,172-177`).
- vNext now: New missing template provider false and digest config guards short-circuit (`messaging/providers.ts:39-47`; `recruiter-message-email-provider.ts:21-31`).
- Fix: Keep distinct NOT_CONFIGURED status with exact old warning copy.

## G2-18-010-027  [P2] GAP  facet F07  effort M
- Legacy: Legacy missing collegeName DB warns then falls back no senderName (`TpoMailService.java:123-130,155-162`).
- vNext now: New digest requires caller collegeName but fromName remains generic, no DB lookup (`recruiter-message-email-provider.ts:9-21,40-48`).
- Fix: Look up verified college display name, report fallback and keep safe header.

## G2-18-010-031  [P2] GAP  facet F08  effort S
- Legacy: Legacy NOT_CONFIGURED reason does not send and logs info (`TpoMailService.java:172-177`).
- vNext now: New `sendRecruiterMessageDigest` boolean false, no reason to caller (`recruiter-message-email-provider.ts:17-31`).
- Fix: Record safe structured not-configured reason, distinguish from provider error.

## G2-20-010-022  [P3] GAP  facet F07  effort S
- Legacy: Legacy delivered result enums SENT/NOT_CONFIGURED/FAILED `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:31,172-189`
- vNext now: New provider returns boolean, worker exposes enabled/sent `src/modules/placements/recruiter-message-email-provider.ts:17-21,54-55`
- Fix: Distinguish disabled configuration from temporary send failure for operators
