# Work packet: edit src/modules/notifications/exotel-sms.ts (part 2 of 2)

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/cross-third-party-integrations.md, docs/audit/gap2/lane-4/sms-delivery-log.md, docs/audit/gap2/lane-6/bulksmsapps-service.md, docs/audit/gap2/lane-19/sms-delivery-log-repository.md, docs/audit/gap2/lane-2/admin-sms-log-controller.md, docs/audit/gap2/lane-15/sms-service.md

## G2-4-033-009  [P1] GAP  facet F04  effort M
- Legacy: Legacy sender configuration has job, notification and OTP IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:58-73`
- vNext now: OTP has DLT and sender `src/modules/notifications/exotel-sms.ts:20-37`; campaign supply per-template sender/ID `src/modules/messaging/providers.ts:11-16`
- Fix: Inventory/validate each non-OTP DLT template and global override before live release.

## G2-4-016-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy writes originate from OTP, job-update, notification and attendance-purpose sender paths. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:28-30`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:80-133`)
- vNext now: New OTP Exotel logs structured events, attendance has separate outbox, TPO receipts only campaign sends. (`src/modules/notifications/exotel-sms.ts:125-138`; `src/modules/attendance/parent-sms-service.ts:102-155`; `src/db/schema/messaging-receipts.ts:59-78`)
- Fix: Create shared append-only attempt ledger integrated with every SMS sender.

## G2-4-016-013  [P1] MISSING  facet F04  effort M
- Legacy: Legacy provider_message_id varchar64 for accepted attempt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:45-46`)
- vNext now: New Exotel OTP response reads Sid but structured log omits it; generic receipts omit provider id. (`src/modules/notifications/exotel-sms.ts:113-129`; `src/db/schema/messaging-receipts.ts:59-78`)
- Fix: Persist safe provider trace ID in append-only attempt.

## G2-4-016-036  [P1] GAP  facet F10  effort L
- Legacy: Legacy Exotel records SENT and provider Sid when HTTP JSON confirms accepted. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:181-198`)
- vNext now: New OTP sends accepted structured log without provider Sid persistence. (`src/modules/notifications/exotel-sms.ts:113-130`)
- Fix: Create append of accepted outcome with Sid and suffix.

## G2-4-016-037  [P1] GAP  facet F10  effort M
- Legacy: Legacy Exotel catches network/provider errors, writes FAILED reason, returns false. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:199-204`)
- vNext now: New OTP writes only structured warning; attendance outbox result status. (`src/modules/notifications/exotel-sms.ts:131-138`; `src/modules/attendance/parent-sms-service.ts:142-155`)
- Fix: Log failed provider attempt durably without secrets.

## G2-4-016-048  [P1] GAP  facet F13  effort M
- Legacy: Legacy attempt records can show FAILED on missing DLT/config. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:95-101`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:148-153`)
- vNext now: New OTP only structured warnings; support search cannot retrieve failed attempt. (`src/modules/notifications/exotel-sms.ts:65-74`)
- Fix: Surface missing-configuration attempt in support UI with safe message.

## G2-4-016-053  [P1] GAP  facet F15  effort L
- Legacy: Legacy OTP, job and notification sender log attempts regardless of provider result. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:80-133`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:147-204`)
- vNext now: New OTP and attendance direct Exotel send do not append central attempts ledger. (`src/modules/notifications/exotel-sms.ts:57-138`; `src/modules/attendance/parent-sms-provider.ts:27-39`)
- Fix: Add universal provider attempt journal for all outgoing SMS categories.

## G2-6-012-035  [P1] GAP  facet F21  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BulkSmsAppsServiceImpl.java:154-186`
- vNext now: `src/modules/notifications/exotel-sms.ts:125-138`
- Fix: Restore masked persistence of purpose, suffix, state, provider id and error

## G2-6-012-037  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BulkSmsAppsServiceImpl.java:168-179`
- vNext now: `src/modules/notifications/exotel-sms.ts:125-138`
- Fix: Add retention-bound attempt ledger matching old SmsDeliveryLog fields

## G2-19-014-021  [P2] GAP  facet F08  effort M
- Legacy: Legacy pagination returns totalElements/Pages `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:74-79`
- vNext now: vNext structured log is not pageable product UI `src/modules/notifications/exotel-sms.ts:125-137`
- Fix: Display page/status counts and meaningful no-result notice.

## G2-2-024-015  [P2] GAP  facet F07  effort M
- Legacy: AdminSmsLogController.java:61-69 invalid suffix normalized silently
- vNext now: src/modules/notifications/exotel-sms.ts:65-74 invalid recipient fails send
- Fix: Do not treat query formatting as send validation; normalize and clarify searches.

## G2-4-033-017  [P2] GAP  facet F07  effort M
- Legacy: Missing Exotel DLT records failure reason to receipt `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:96-100`
- vNext now: OTP provider logs not-sent without per-recipient receipt `src/modules/notifications/exotel-sms.ts:59-73`
- Fix: Expose non-PII actionable configuration failure to admin and persist private support diagnostics.

## G2-4-016-029  [P2] GAP  facet F07  effort M
- Legacy: Legacy provider failure report uses safe terse reason such as DLT template ID not configured. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:96-101`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:123-129`)
- vNext now: New OTP structured log only generic reason; staged DB has safe_failure_code/summary. (`src/modules/notifications/exotel-sms.ts:65-74`; `scripts/sql/db10-sms-delivery-attempts-staging.sql:37-40`)
- Fix: Report fixed nonsecret reason/codes; never raw provider response.

## G2-4-016-030  [P2] GAP  facet F07  effort M
- Legacy: Legacy failure saving log is caught/logged and does not change send outcome. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:220-233`)
- vNext now: New structured log is best-effort, no DB attempt ledger. (`src/modules/notifications/exotel-sms.ts:125-138`)
- Fix: Make attempt recording error nonfatal but auditable.

## G2-6-012-012  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BulkSmsAppsServiceImpl.java:189-194`
- vNext now: `src/modules/notifications/exotel-sms.ts:65-74`
- Fix: Record failed configuration attempts in masked persistent ledger

## G2-15-012-021  [P3] GAP  facet F07  effort S
- Legacy: Exotel invalid OTP format logs Exotel OTP not sent: invalid OTP format. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:86-93`)
- vNext now: New sms.otp_rejected invalid_code_format structured log. (`src/modules/notifications/exotel-sms.ts:57-62`)
- Fix: Keep equivalent safe operator diagnostics without leaking code.

## G2-3-012-021  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:220-232`
- vNext now: `src/modules/notifications/exotel-sms.ts:131-137`
- Fix: Legacy log insert errors do not turn accepted SMS into failure; when adding vNext log table, isolate log write errors from sending.
