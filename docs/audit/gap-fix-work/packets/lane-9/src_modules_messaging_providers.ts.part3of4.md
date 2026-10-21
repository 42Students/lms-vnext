# Work packet: edit src/modules/messaging/providers.ts (part 3 of 4)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/exotel-sms-service-impl.md, docs/audit/gap2/lane-4/cross-third-party-integrations.md, docs/audit/gap2/lane-4/sms-delivery-log.md, docs/audit/gap2/lane-6/bulksmsapps-service.md

## G2-3-012-008  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:34-36`, `112-121`
- vNext now: `src/modules/operations/outbound-delivery-contract.ts:8-12`, `src/modules/messaging/providers.ts:40-41`
- Fix: Seven legacy job event keys map to one approved job SMS; vNext outbound contract keys only recruiter invitation/reminder and campaign guard. Register job-event intents.

## G2-3-012-009  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:97-109`, `124-133`
- vNext now: `src/modules/messaging/providers.ts:11-24`, `62-71`
- Fix: Legacy job and notification DLT/sender IDs resolved independently with GLOBAL override; vNext generic uses caller-supplied templates with no global override equivalent. Add registered mapping/lookup.

## G2-3-012-019  [P1] MISSING  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:183-204`
- vNext now: `src/modules/notifications/exotel-sms.ts:106-138`, `src/modules/messaging/providers.ts:84-90`
- Fix: Legacy persists every attempted send as SENT/FAILED with provider id/error, vNext logs OTP acceptance/failure only to structured logger and generic provider returns boolean. Persist privacy-safe support audit.

## G2-3-012-031  [P1] MISSING  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:34-39`, `95-120`
- vNext now: `src/modules/operations/outbound-delivery-contract.ts:8-12`, `src/modules/messaging/providers.ts:40-41`
- Fix: Legacy single job-update TRAI body covers seven events; vNext no active matching approved job template key/content in notification provider. Register after DLT verification.

## G2-3-012-037  [P1] MISSING  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:34-39`, `112-133`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:156-171`
- vNext now: `src/modules/messaging/providers.ts:11-24`, `src/modules/operations/outbound-delivery-contract.ts:8-12`
- Fix: Legacy dispatcher sends seven job status updates via single approved SMS body, vNext generic contract has no job-status delivery producers. Add event mapping with registered templates.

## G2-3-012-049  [P1] MISSING  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:156-171`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/NotificationOutboxService.java:145-165`
- vNext now: `src/db/schema/db10-general-notices.draft.ts:1-12`, `src/modules/messaging/providers.ts:26-91`
- Fix: Legacy has active dispatcher and TPO background due-scan; vNext general notices is draft and generic provider is not connected to source job events. Implement durable provider handoff after migration.

## G2-4-033-009  [P1] GAP  facet F04  effort M
- Legacy: Legacy sender configuration has job, notification and OTP IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:58-73`
- vNext now: OTP has DLT and sender `src/modules/notifications/exotel-sms.ts:20-37`; campaign supply per-template sender/ID `src/modules/messaging/providers.ts:11-16`
- Fix: Inventory/validate each non-OTP DLT template and global override before live release.

## G2-4-033-010  [P1] GAP  facet F04  effort M
- Legacy: Legacy TPO sender can be college name and college-specific link/reply-to `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:78-109`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:133-161`
- vNext now: Outbound provider sends configured default from address/name `src/modules/messaging/providers.ts:47-53`
- Fix: Preserve campus-recruitment sender display, verified sender domain, college link and safe reply-to aliases.

## G2-4-033-013  [P1] GAP  facet F05  effort M
- Legacy: Legacy notification dispatcher routes event types by central registry `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:53-70`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-157`
- vNext now: Outbound adapter accepts registered campaign keys `src/modules/messaging/providers.ts:36-46`
- Fix: Produce event-by-event matrix, including email/SMS opt-out and old template mapping.

## G2-4-033-021  [P1] GAP  facet F08  effort M
- Legacy: Legacy TPO mail returns SENT, NOT_CONFIGURED or FAILED `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:29-31`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:172-188`
- vNext now: Outbound adapter exposes boolean acceptance `src/modules/messaging/providers.ts:32-60`
- Fix: Return structured delivery acceptance/error outcomes to calling pages, avoid false 'sent' claims.

## G2-4-033-025  [P1] GAP  facet F10  effort M
- Legacy: Legacy ZeptoMail send overload supports senderName, replyTo, fromAddress `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:99-109`
- vNext now: New OTP/campaign adapter uses one config from address/name `src/modules/notifications/zeptomail-email.ts:24-31`; `src/modules/messaging/providers.ts:47-53`
- Fix: Extend per-message sender/reply-to safely for college-scoped placements mail.

## G2-4-033-026  [P1] GAP  facet F10  effort M
- Legacy: Legacy email event retries are bounded with attempts `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:123-148`
- vNext now: New outbound provider performs one remote send `src/modules/messaging/providers.ts:43-60`
- Fix: Move retries and idempotency into durable sender with backoff and dead-letter reason.

## G2-4-033-031  [P1] GAP  facet F12  effort M
- Legacy: Legacy job SMS uses one approved TRAI job template and rejects missing ID `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:96-109`
- vNext now: Outbound campaign requires distinct template metadata and rejects OTP reuse `src/modules/messaging/providers.ts:62-66`
- Fix: Document controlled migration from legacy single job-update template to registered per-campaign templates.

## G2-4-033-038  [P1] GAP  facet F15  effort M
- Legacy: Legacy registry drives email/SMS per recipient and consent in central dispatcher `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:53-70`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-169`
- vNext now: Campaign provider can contact only runtime-valid recipients `src/modules/messaging/providers.ts:36-41`
- Fix: Crosswalk all templates, recipients, consent and unsubscribes with U032 before enabling sends.

## G2-4-033-039  [P1] GAP  facet F15  effort M
- Legacy: Legacy recruiter reply aliases route via Cloudflare email worker `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:43-45`
- vNext now: Campaign mail adapter does not encode recruiter reply alias `src/modules/messaging/providers.ts:47-60`
- Fix: Recreate signed worker/webhook idempotency, domain routing and reply-to mapping.

## G2-4-016-035  [P1] GAP  facet F10  effort L
- Legacy: Legacy Exotel records FAILED for missing job/general notification DLT id. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:95-109`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:123-133`)
- vNext now: New generic provider validates DLT but receipts are campaign-only; no global SMS attempt ledger. (`src/modules/messaging/providers.ts:62-86`; `src/db/schema/messaging-receipts.ts:59-78`)
- Fix: Persist FAILED attempt on DLT rejection for job/general SMS.

## G2-6-012-002  [P1] GAP  facet F01  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BulkSmsAppsServiceImpl.java:84-138`
- vNext now: `src/modules/messaging/providers.ts:26-41`
- Fix: Map all OTP, job, and attendance legacy SMS purposes to new providers

## G2-6-012-007  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BulkSmsAppsServiceImpl.java:54-61`
- vNext now: `src/modules/messaging/providers.ts:18-25`
- Fix: Reconcile global job-update-template edit with Exotel registered templates

## G2-6-012-010  [P1] GAP  facet F06  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BulkSmsAppsServiceImpl.java:103-114`
- vNext now: `src/modules/messaging/providers.ts:32-41`
- Fix: Enforce max-30-character DLT-safe learner name and strip template delimiters

## G2-6-012-026  [P1] GAP  facet F15  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BulkSmsAppsServiceImpl.java:64-73`
- vNext now: `src/modules/messaging/providers.ts:39-41`
- Fix: Register seven job-event SMS routes and approved DLT templates
