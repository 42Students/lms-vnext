# Work packet: edit src/modules/messaging/providers.ts (part 1 of 4)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/zeptomail-service.md, docs/audit/gap2/lane-14/u012-zeptomail-service.md, docs/audit/gap2/lane-15/email-variable-validator.md

## G2-13-011-002  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:22-35` one template-send API with four overloads, including sender/Reply-To/from override
- vNext now: `src/modules/notifications/zeptomail-email.ts:57-62` OTP-specific port; `src/modules/messaging/providers.ts:26-32` templated outbound port; `src/modules/placements/recruiter-message-email-provider.ts:17-20` digest port
- Fix: Provide one reusable transactional template-mail adapter with explicit per-send sender, reply-to and verified from override as needed

## G2-13-011-007  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:137` null mergeInfo emits empty object
- vNext now: `src/modules/notifications/zeptomail-email.ts:99-106` hardcodes five OTP merge keys; `src/modules/messaging/providers.ts:54` uses validated arbitrary variables
- Fix: Unify templated mail merge model and preserve optional arbitrary template variables for non-OTP transactions

## G2-13-011-010  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:124-131` senderName blank→default, replyTo blank→omitted, fromAddressOverride blank→default
- vNext now: `src/modules/messaging/providers.ts:51-54` fixed configured sender, no per-send reply-to/from; `src/modules/placements/recruiter-message-email-provider.ts:40-43` custom replyTo only
- Fix: Add sanitized optional sender-name, Reply-To and authorized From choices for TPO college-branded senders

## G2-13-011-014  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:28-66` event-dependent required merge keys must be nonblank; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:119-125` skips missing key/template
- vNext now: `src/modules/messaging/providers.ts:36-41` validates size and shape, but no event-specific required variable map
- Fix: Add template/event-specific required-variable validators for job, interview and system emails

## G2-13-011-021  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:127-149` retries failed event mails up to 3 times with 500ms × attempt delay
- vNext now: `src/modules/messaging/providers.ts:56-58` and `src/lib/outbound.ts:37-39` single non-idempotent POST attempt
- Fix: Document intentional at-most-once semantics; implement provider idempotency/reconciliation before promising legacy retry guarantees

## G2-13-011-022  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:172-189` maps SENT / NOT_CONFIGURED / FAILED separately
- vNext now: `src/modules/messaging/providers.ts:36-60` returns one boolean from transport; `src/modules/messaging/service.ts:94-100` has QUEUED/SUPPRESSED/FAILED/SENT
- Fix: Expose typed NOT_CONFIGURED, SUPPRESSED, FAILED and provider ACCEPTED outcomes to TPO callers

## G2-13-011-025  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:82-110` college-branded recruiter/student messages with tenant-specific sender name
- vNext now: `src/modules/messaging/providers.ts:51-54` global sender; `src/modules/placements/recruiter-message-email-provider.ts:40-46` global sender
- Fix: Load authorized college display/from/reply context per tenant on branded notifications

## G2-13-011-026  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/ZeptoMailTemplateIdResolver.java:55-60` templates per NotificationEvent via zepto.template.*
- vNext now: `src/modules/messaging/providers.ts:40-46` explicit template registry keyed by purpose, `src/modules/notifications/zeptomail-email.ts:27-29` separate OTP key
- Fix: Map every legacy NotificationEvent and TPO template to purpose-scoped vNext template registry

## G2-13-011-032  [P1] GAP  facet F15  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:5-22` ZeptoMail interface shared by dispatcher; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-155` job/course/pre-login email event sends
- vNext now: `src/modules/messaging/providers.ts:26-60` generic outbound mail but event registry mapping not shown; `src/modules/auth/login-service.ts:363-370` OTP only
- Fix: Inventory and wire all legacy non-OTP transactional event sends to vNext adapters

## G2-13-011-045  [P1] GAP  facet F21  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-171` dispatcher also sends app and TRAI SMS alongside email
- vNext now: `src/modules/messaging/service.ts:3-7`/`src/modules/messaging/providers.ts:43-86` separates EMAIL and SMS provider; notification events not 1:1
- Fix: Create event-to-channel matrix and prove every legacy notification fan-out path is mapped

## G2-14-012-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy dispatcher sends OTP/email and notification event emails through central abstraction `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:5-9` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-155`
- vNext now: New OTP provider separated from outbound campaign provider `src/modules/notifications/zeptomail-email.ts:57-130` `src/modules/messaging/providers.ts:26-61`
- Fix: Map every legacy NotificationEvent to new template/recipient path

## G2-14-012-009  [P1] GAP  facet F04  effort M
- Legacy: Legacy mergeInfo Map String String passes through or empty `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:137-137`
- vNext now: New OTP defines fixed otp learnerName email mobile expiryMinutes; campaigns generic variables `src/modules/notifications/zeptomail-email.ts:99-106` `src/modules/messaging/providers.ts:50-55`
- Fix: Ensure each old merge variable has equivalent event-specific schema

## G2-14-012-015  [P1] GAP  facet F06  effort M
- Legacy: Legacy replyTo null means omit; nonblank adds array entry `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:29-32` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:127-132`
- vNext now: General outbound provider request omits reply_to; recruiter digest explicitly sets it `src/modules/messaging/providers.ts:50-55` `src/modules/placements/recruiter-message-email-provider.ts:40-44`
- Fix: Provide vetted optional reply-to for approved domains across templates

## G2-14-012-035  [P1] GAP  facet F12  effort M
- Legacy: Legacy dispatcher retries up to 3 sends with 500ms times attempt `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:123-149`
- vNext now: New non-idempotent provider POST sets maxAttempts 1 `src/modules/notifications/zeptomail-email.ts:108-109` `src/modules/messaging/providers.ts:56-57`
- Fix: Document deliberate no retry safety and add provider-idempotency aware outbox if repeat needed

## G2-14-012-041  [P1] GAP  facet F15  effort L
- Legacy: Interface used for OTP and dispatcher event emails `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:5-9` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-155`
- vNext now: New OTP endpoint plus separate campaigns/recruiter digests `src/modules/notifications/zeptomail-email.ts:57-130` `src/modules/messaging/providers.ts:26-61` `src/modules/placements/recruiter-message-email-provider.ts:17-57`
- Fix: Inventory every legacy NotificationEvent template and recipient timing

## G2-14-012-042  [P1] GAP  facet F15  effort L
- Legacy: Legacy dispatcher sends in-app then email then TRAI SMS from registry `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:69-106` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-170`
- vNext now: New provider abstraction sends one requested channel `src/modules/messaging/providers.ts:32-90`
- Fix: Map cross-channel notification policy per event and ordering

## G2-14-012-057  [P1] GAP  facet F21  effort L
- Legacy: Legacy NotificationDispatcherService event registry triggers Zepto templates `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-155`
- vNext now: New outbound provider requires explicit template map; campaign dispatch separately gated `src/modules/messaging/providers.ts:23-46` `src/modules/messaging/tpo-campaign-dispatch-service.ts:25-50`
- Fix: Create legacy event-to-template registry parity matrix

## G2-15-010-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy dispatcher routes eligible event through recipient+variable gate before ZeptoMail. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-123`)
- vNext now: New campaign provider routes template send directly after key and recipient validation. (`src/modules/messaging/providers.ts:33-54`)
- Fix: Require approved event-template schema before final provider request.

## G2-15-010-005  [P1] MISSING  facet F04  effort S
- Legacy: Scheduled interview requires learnerName, jobTitle, companyName, applicationId. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:33-36`)
- vNext now: Generic parsed variables forwarded with no event-required keys. (`src/modules/messaging/providers.ts:36-54`)
- Fix: Add exact four base fields to scheduled-interview template validation.

## G2-15-010-006  [P1] MISSING  facet F04  effort S
- Legacy: Scheduled interview additionally requires roundDescription, interviewDate, interviewTime, interviewMode. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:33-36`)
- vNext now: No interview event-specific presence check. (`src/modules/messaging/providers.ts:36-54`)
- Fix: Require each scheduling-specific merge field before send.
