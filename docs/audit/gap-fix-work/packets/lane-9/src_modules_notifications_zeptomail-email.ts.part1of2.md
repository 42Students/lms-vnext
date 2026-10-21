# Work packet: edit src/modules/notifications/zeptomail-email.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u012-zeptomail-service.md, docs/audit/gap2/lane-13/zeptomail-service.md, docs/audit/gap2/lane-18/tpo-mail-service.md, docs/audit/gap2/lane-4/cross-notifications.md, docs/audit/gap2/lane-4/cross-third-party-integrations.md

## G2-14-012-028  [P0] GAP  facet F10  effort M
- Legacy: Legacy default token is hardcoded in source and reused if runtime blank; active secret exposure risk `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:31-31` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:109-114`
- vNext now: New reads token only from ZEPTOMAIL_TOKEN env and declines send when absent `src/modules/notifications/zeptomail-email.ts:19-32` `src/modules/notifications/zeptomail-email.ts:63-75`
- Fix: Rotate compromised ZeptoMail credential immediately, revoke old key, purge code default in future fixes and scan history; never quote secret in audit

## G2-14-012-053  [P0] GAP  facet F20  effort M
- Legacy: Legacy token blank falls back to hardcoded secret `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:31-31` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:109-114`
- vNext now: New env-only token fails closed `src/modules/notifications/zeptomail-email.ts:19-32` `src/modules/notifications/zeptomail-email.ts:63-75`
- Fix: Rotate leaked credential and prohibit hardcoded fallback

## G2-13-011-002  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:22-35` one template-send API with four overloads, including sender/Reply-To/from override
- vNext now: `src/modules/notifications/zeptomail-email.ts:57-62` OTP-specific port; `src/modules/messaging/providers.ts:26-32` templated outbound port; `src/modules/placements/recruiter-message-email-provider.ts:17-20` digest port
- Fix: Provide one reusable transactional template-mail adapter with explicit per-send sender, reply-to and verified from override as needed

## G2-13-011-007  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:137` null mergeInfo emits empty object
- vNext now: `src/modules/notifications/zeptomail-email.ts:99-106` hardcodes five OTP merge keys; `src/modules/messaging/providers.ts:54` uses validated arbitrary variables
- Fix: Unify templated mail merge model and preserve optional arbitrary template variables for non-OTP transactions

## G2-13-011-026  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/ZeptoMailTemplateIdResolver.java:55-60` templates per NotificationEvent via zepto.template.*
- vNext now: `src/modules/messaging/providers.ts:40-46` explicit template registry keyed by purpose, `src/modules/notifications/zeptomail-email.ts:27-29` separate OTP key
- Fix: Map every legacy NotificationEvent and TPO template to purpose-scoped vNext template registry

## G2-14-012-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy dispatcher sends OTP/email and notification event emails through central abstraction `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:5-9` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-155`
- vNext now: New OTP provider separated from outbound campaign provider `src/modules/notifications/zeptomail-email.ts:57-130` `src/modules/messaging/providers.ts:26-61`
- Fix: Map every legacy NotificationEvent to new template/recipient path

## G2-14-012-009  [P1] GAP  facet F04  effort M
- Legacy: Legacy mergeInfo Map String String passes through or empty `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:137-137`
- vNext now: New OTP defines fixed otp learnerName email mobile expiryMinutes; campaigns generic variables `src/modules/notifications/zeptomail-email.ts:99-106` `src/modules/messaging/providers.ts:50-55`
- Fix: Ensure each old merge variable has equivalent event-specific schema

## G2-14-012-022  [P1] GAP  facet F08  effort S
- Legacy: Legacy warning blank token uses default fallback warning `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:109-114`
- vNext now: New missing env token means send not attempted and warning logged `src/modules/notifications/zeptomail-email.ts:63-75`
- Fix: Never fallback to code-embedded secrets; provide safe config validation diagnostics

## G2-14-012-035  [P1] GAP  facet F12  effort M
- Legacy: Legacy dispatcher retries up to 3 sends with 500ms times attempt `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:123-149`
- vNext now: New non-idempotent provider POST sets maxAttempts 1 `src/modules/notifications/zeptomail-email.ts:108-109` `src/modules/messaging/providers.ts:56-57`
- Fix: Document deliberate no retry safety and add provider-idempotency aware outbox if repeat needed

## G2-14-012-041  [P1] GAP  facet F15  effort L
- Legacy: Interface used for OTP and dispatcher event emails `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:5-9` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-155`
- vNext now: New OTP endpoint plus separate campaigns/recruiter digests `src/modules/notifications/zeptomail-email.ts:57-130` `src/modules/messaging/providers.ts:26-61` `src/modules/placements/recruiter-message-email-provider.ts:17-57`
- Fix: Inventory every legacy NotificationEvent template and recipient timing

## G2-14-012-050  [P1] GAP  facet F19  effort M
- Legacy: Legacy synchronous RestTemplate POST, dispatcher may retry 3 times `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:147-157` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:127-149`
- vNext now: New outboundFetch 10s timeout and max one attempt `src/modules/notifications/zeptomail-email.ts:108-109` `src/lib/outbound.ts:32-50`
- Fix: Set bounded timeout and outbox retry visibility; no blind duplicate sends

## G2-18-010-005  [P1] GAP  facet F02  effort M
- Legacy: Legacy recruitment emails branded `{college} Campus Recruitment` in inbox From name (`TpoMailService.java:77-81,155-162`).
- vNext now: New provider uses global `config.email.fromName` in from object (`recruiter-message-email-provider.ts:40-42`; `zeptomail-email.ts:30-32`).
- Fix: Override sender name per verified college and preserve safe header rules.

## G2-18-010-007  [P1] GAP  facet F02  effort M
- Legacy: Legacy college sender From address recruitment@42lms.com and Reply-To recruitment mailbox/tag (`TpoMailService.java:42-53,77-97`).
- vNext now: New digest From address configurable ZEPTOMAIL_FROM_ADDRESS default hello@42lms.com and Reply-To token address (`zeptomail-email.ts:27-32`; `recruiter-message-email-provider.ts:40-44`).
- Fix: Set verified recruiter From and safe Reply-To across environments; test inbox header.

## G2-4-032-051  [P1] GAP  facet F15  effort M
- Legacy: DEV_MAIL_ALLOW nonprod mail recipients, rejects undefined template (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:36-40,114-125`)
- vNext now: OTP email config gate, no broad event template registry (`src/modules/notifications/zeptomail-email.ts:63-75`)
- Fix: Apply dev allowlist per event and explicit configured provider template validation.

## G2-4-033-025  [P1] GAP  facet F10  effort M
- Legacy: Legacy ZeptoMail send overload supports senderName, replyTo, fromAddress `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:99-109`
- vNext now: New OTP/campaign adapter uses one config from address/name `src/modules/notifications/zeptomail-email.ts:24-31`; `src/modules/messaging/providers.ts:47-53`
- Fix: Extend per-message sender/reply-to safely for college-scoped placements mail.

## G2-13-011-012  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:115-120` throws exact 'ZeptoMail template ID is required' or 'Recipient email is required'
- vNext now: `src/modules/notifications/zeptomail-email.ts:64-75` logs email.otp_not_sent + returns false; `src/modules/messaging/providers.ts:36-46` returns false
- Fix: Map provider failure reasons to typed internal errors; keep user-facing errors at feature boundary

## G2-14-012-017  [P2] GAP  facet F07  effort S
- Legacy: Missing template ID throws ZeptoMail template ID is required `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:115-117`
- vNext now: New OTP/provider returns false without exception `src/modules/notifications/zeptomail-email.ts:63-75` `src/modules/messaging/providers.ts:40-46`
- Fix: Map validation failures to useful caller-facing state and structured code

## G2-14-012-018  [P2] GAP  facet F07  effort S
- Legacy: Missing recipient throws Recipient email is required `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:118-120`
- vNext now: New email normalizer and isValidRecipient fail with false `src/modules/notifications/zeptomail-email.ts:63-75`
- Fix: Give identical missing-email warning in consumer

## G2-14-012-019  [P2] GAP  facet F07  effort M
- Legacy: Legacy any provider failure rethrows Failed to send email cause `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:147-157`
- vNext now: New hides provider exception and returns false `src/modules/notifications/zeptomail-email.ts:122-127`
- Fix: Keep safe user-facing error while retain internal error classification

## G2-4-032-023  [P2] GAP  facet F07  effort M
- Legacy: Email missing/invalid contact or merge variable silently skipped with log (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:106-125`)
- vNext now: Email provider false on invalid config, structured warning (`src/modules/notifications/zeptomail-email.ts:63-75`)
- Fix: Return dispatch failure code to admin monitor rather than silently claiming sent.
