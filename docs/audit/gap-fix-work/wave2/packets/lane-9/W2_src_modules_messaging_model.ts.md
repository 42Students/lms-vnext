# Work packet (wave 2): edit src/modules/messaging/model.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/zeptomail-service.md, docs/audit/gap2/lane-15/sms-service.md, docs/audit/gap2/lane-18/tpo-mail-service.md, docs/audit/gap2/lane-3/exotel-sms-service-impl.md

## G2-13-011-028  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:175-190` truncates each merge value >8192 to 8189 chars plus ellipsis
- vNext now: `src/modules/messaging/model.ts:9-26` 4k general bound; 10k body only TPO campaigns, 12k total
- Fix: Document per-event truncation/rejection behavior; use provider-safe template-specific caps with clear suppression reason

## G2-13-011-038  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:70-83` precise missing-variable errors
- vNext now: `src/modules/messaging/model.ts:9-26` INVALID_TEMPLATE_VARIABLES/VARIABLE_TOO_LONG
- Fix: Map required-key errors to actionable, non-sensitive per-template diagnostics

## G2-15-012-042  [P2] GAP  facet F12  effort S
- Legacy: Phone supports 10-digit local, country-prefixed and E.164. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:211-217`)
- vNext now: New SMS validator only +E.164. (`src/modules/messaging/model.ts:45-46`)
- Fix: Normalize and validate at API boundary, not provider only.

## G2-15-012-061  [P2] GAP  facet F20  effort S
- Legacy: Name longer than30 clipped; empty -> User. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:103-107`)
- vNext now: Generic values max4k except campaign body, not 30. (`src/modules/messaging/model.ts:9-27`)
- Fix: Clamp name in job event assembler independently of general variable cap.

## G2-15-012-068  [P2] GAP  facet F22  effort M
- Legacy: SENT means provider accepted; FAILED otherwise; provider_message_id nullable. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:37-46`)
- vNext now: QUEUED/SENT/FAILED/SUPPRESSED statuses; no SID in DeliveryRecord. (`src/modules/messaging/model.ts:3-4`)
- Fix: Preserve provider SID traceability in privacy-safe restricted audit.

## G2-18-010-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy Result outcomes SENT, NOT_CONFIGURED, FAILED (`TpoMailService.java:29-33,172-190`).
- vNext now: New generic Provider returns boolean success, Messaging stores QUEUED/SENT/FAILED/SUPPRESSED (`messaging/providers.ts:32-61`; `messaging/model.ts:3-5`).
- Fix: Keep explicit not-configured reason rather than generic FAILED and expose per-trigger disabled copy.

## G2-18-010-022  [P2] GAP  facet F06  effort M
- Legacy: Legacy send(name,to,merge) and sendAsCollege()/sendToStudentAsCollege() have no UI form (`TpoMailService.java:73-109`).
- vNext now: New OutboundSendRequest JSON schema channel/recipient/templateKey/variables/purpose (`messaging/model.ts:3-27`).
- Fix: Create adapter for legacy callers and preserve per-college/recipient defaults.

## G2-18-010-045  [P2] GAP  facet F12  effort M
- Legacy: Legacy message template values may be up to arbitrary length, angle replacements (`TpoMailService.java:192-201`).
- vNext now: New outbound variables capped per field4k and total12k (campaign body10k exception) (`messaging/model.ts:9-26`).
- Fix: Map each template merge length/field validation and reject oversized with precise reason.

## G2-3-012-014  [P2] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:103-109`
- vNext now: `src/modules/messaging/providers.ts:65-66`, `src/modules/messaging/model.ts:9-17`
- Fix: Legacy recipient name is stripped of DLT placeholders, trimmed, User fallback and max30; vNext generic renderSms delegates to template without job-specific name cleanup. Add canonical job SMS renderer.

## G2-3-012-011  [P3] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:61-72`
- vNext now: `src/modules/messaging/model.ts:42-46`, `src/modules/notifications/exotel-sms.ts:65-74`
- Fix: Legacy suffix-search strips non-digits and uses last 4 even when full phone pasted; vNext strict recipient validation is unsuitable for support search. Add dedicated filter normalization.
