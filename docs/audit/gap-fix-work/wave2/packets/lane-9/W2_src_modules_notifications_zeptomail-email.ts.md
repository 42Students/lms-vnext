# Work packet (wave 2): edit src/modules/notifications/zeptomail-email.ts

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u012-zeptomail-service.md, docs/audit/gap2/lane-18/tpo-mail-service.md, docs/audit/gap2/lane-4/cross-notifications.md, docs/audit/gap2/lane-4/cross-third-party-integrations.md, docs/audit/gap2/lane-13/zeptomail-service.md

## G2-14-012-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy interface has one base method and 3 successive sender/reply/from overloads `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:14-37`
- vNext now: New separate OTP/provider/recruiter digest APIs expose different option shapes `src/modules/notifications/zeptomail-email.ts:11-17` `src/modules/placements/recruiter-message-email-provider.ts:9-20`
- Fix: Preserve equivalent from/name/reply override support via dedicated safe API

## G2-14-012-006  [P2] GAP  facet F03  effort M
- Legacy: Errors logged server-side and not displayed directly from service `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:147-157`
- vNext now: New returns booleans and structured log events `src/modules/notifications/zeptomail-email.ts:113-127`
- Fix: Expose structured delivery outcome to administrative status view without leaking content

## G2-14-012-007  [P2] GAP  facet F04  effort M
- Legacy: Template key sent as trimmed Zepto template ID `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:115-123`
- vNext now: New OTP uses environment OTP key and campaigns use configured template map `src/modules/notifications/zeptomail-email.ts:27-29` `src/modules/messaging/providers.ts:40-54`
- Fix: Map legacy template IDs by event with explicit provisioning table

## G2-14-012-013  [P2] GAP  facet F06  effort S
- Legacy: Legacy fields template ID and recipient required nonblank `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:115-120`
- vNext now: New OTP checks template token recipient and code `src/modules/notifications/zeptomail-email.ts:63-75`
- Fix: Surface equivalent field-level error in calling workflow

## G2-14-012-026  [P2] GAP  facet F10  effort M
- Legacy: Legacy template_key from supplied ID, from, optional reply_to, to, merge_info `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:121-146`
- vNext now: New OTP sends template_key from env, from/to and fixed merge_info `src/modules/notifications/zeptomail-email.ts:85-107`
- Fix: Build parity adapter for old dynamic template merge keys

## G2-14-012-027  [P2] GAP  facet F10  effort M
- Legacy: Legacy responds void on 2xx and throws on non-2xx `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:147-157`
- vNext now: New returns boolean accepted/not accepted and no thrown provider error `src/modules/notifications/zeptomail-email.ts:113-127`
- Fix: Normalize caller delivery outcome including not-sent/error reason

## G2-14-012-036  [P2] GAP  facet F13  effort M
- Legacy: Legacy send can synchronously throw provider exception `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:147-157`
- vNext now: New returns false and logs structured failure `src/modules/notifications/zeptomail-email.ts:113-127`
- Fix: Provide caller retry state that distinguishes rejected and configuration failures

## G2-14-012-048  [P2] GAP  facet F18  effort S
- Legacy: Legacy validation text Recipient email is required `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:118-120`
- vNext now: New silent boolean failure in provider `src/modules/notifications/zeptomail-email.ts:63-75`
- Fix: Restore exact consumer error copy where appropriate

## G2-14-012-058  [P2] GAP  facet F21  effort M
- Legacy: Legacy template ID resolver warns at startup for missing event keys `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/ZeptoMailTemplateIdResolver.java:27-47`
- vNext now: New config checks at send time for invalid OTP/template `src/modules/notifications/zeptomail-email.ts:63-75` `src/modules/messaging/providers.ts:40-46`
- Fix: Add startup/readiness validation for required templates without leaking key

## G2-14-012-060  [P2] GAP  facet F22  effort M
- Legacy: Legacy provider config via application properties and env; template map external `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:33-47` `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/ZeptoMailTemplateIdResolver.java:11-57`
- vNext now: New reads env values and campaign mapping `src/modules/notifications/zeptomail-email.ts:19-32` `src/modules/messaging/providers.ts:18-24`
- Fix: Audit complete environment variable/migration mapping

## G2-18-010-008  [P2] GAP  facet F03  effort S
- Legacy: Legacy inbox prefix `Campus Recruitment` exact suffix plus capital letters (`TpoMailService.java:155-162`).
- vNext now: New digest fromName globally `42Learn` by default (`zeptomail-email.ts:30-32`; `recruiter-message-email-provider.ts:40-42`).
- Fix: Restore per-college suffix/capitalization with test snapshots.

## G2-18-010-047  [P2] GAP  facet F13  effort S
- Legacy: Legacy failure at collegeName lookup falls back generic sender rather than crash (`TpoMailService.java:123-130,155-162`).
- vNext now: New provider receives caller collegeName, default generic `42Learn` (`recruiter-message-email-provider.ts:9-21`; `zeptomail-email.ts:30-32`).
- Fix: Keep no-college brand fallback and report missing tenant metadata.

## G2-4-032-064  [P2] GAP  facet F19  effort M
- Legacy: Email retry3 with 500ms * attempt backoff (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:127-149`)
- vNext now: OTP provider only 1 attempt because not idempotent (`src/modules/notifications/zeptomail-email.ts:107-110`)
- Fix: Keep one attempt OTP; implement retry3 for idempotent non-OTP templates.

## G2-4-032-071  [P2] GAP  facet F21  effort M
- Legacy: Zepto retry up to 3 with logs (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:127-149`)
- vNext now: Generic OTP uses maxAttempts1 and structured log (`src/modules/notifications/zeptomail-email.ts:77-129`)
- Fix: Split idempotent template vs OTP policies.

## G2-4-033-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy ZeptoMail template transport callable with per-message template IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:94-109`
- vNext now: OTP provider and separate outbound campaign provider `src/modules/notifications/zeptomail-email.ts:57-63`; `src/modules/messaging/providers.ts:40-60`
- Fix: Map each legacy caller and template key to OTP, campaign or placement sender.

## G2-4-033-035  [P2] GAP  facet F13  effort M
- Legacy: Legacy ZeptoMail exception propagates to TPO caller `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:148-156`
- vNext now: New provider catches failures as false `src/modules/notifications/zeptomail-email.ts:114-128`
- Fix: Differentiate timeout, provider rejection and config omission in UI/operator state.

## G2-13-011-011  [P3] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:140-145` trims surrounding paired quotes off Authorization value only
- vNext now: `src/modules/notifications/zeptomail-email.ts:26` trims whitespace and removes edge quotes by regex
- Fix: Restrict config unquoting to a balanced surrounding pair, or document intentional normalization difference

## G2-13-011-037  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:113` warning says fallback token used; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:115-120` exact required-field text
- vNext now: `src/modules/notifications/zeptomail-email.ts:71-74` structured warning 'email.otp_not_sent'; `src/modules/messaging/providers.ts:36-46` false
- Fix: Provide stable error-code mapping and review copy in login/placement flows; do not replicate unsafe fallback wording

## G2-18-010-054  [P3] GAP  facet F16  effort S
- Legacy: Legacy sender name can exceed 80 when suffix appended (base name limit80), no UI text truncation (`TpoMailService.java:155-170`).
- vNext now: New From name default `42Learn`, external template may wrap unknown (`zeptomail-email.ts:30-32`).
- Fix: Enforce composed sender header length and test long college names in email clients.

## G2-18-010-058  [P3] GAP  facet F18  effort S
- Legacy: Legacy exact sender suffix ` Campus Recruitment` (`TpoMailService.java:155-162`).
- vNext now: New From name `42Learn` by default (`zeptomail-email.ts:30-32`).
- Fix: Restore college-specific phrase in recruiter-facing mail.
