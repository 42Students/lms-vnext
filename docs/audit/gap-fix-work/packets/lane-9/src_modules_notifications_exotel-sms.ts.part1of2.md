# Work packet: edit src/modules/notifications/exotel-sms.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/sms-service.md, docs/audit/gap2/lane-19/sms-delivery-log-repository.md, docs/audit/gap2/lane-2/admin-sms-log-controller.md, docs/audit/gap2/lane-3/exotel-sms-service-impl.md, docs/audit/gap2/lane-4/cross-third-party-integrations.md

## G2-15-012-020  [P1] GAP  facet F06  effort S
- Legacy: Legacy normalizes 10-digit and 91-prefixed numbers to +91; accepts E.164. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:211-217`)
- vNext now: Requires already canonical E.164 phone; no implicit +91 conversion. (`src/modules/notifications/exotel-sms.ts:65-69`)
- Fix: Add India phone normalization before sendOtp; avoid rejecting valid legacy input.

## G2-15-012-033  [P1] GAP  facet F10  effort M
- Legacy: send() records SENT/FAILED, provider Sid or error. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:147-205`)
- vNext now: New OTP provider only logs structured telemetry; no SmsDeliveryLog row here. (`src/modules/notifications/exotel-sms.ts:106-137`)
- Fix: Write privacy-safe durable OTP send attempts or equivalent audit DB/event.

## G2-15-012-060  [P1] GAP  facet F20  effort S
- Legacy: Trims phone spaces, parentheses, hyphens; +91 conversion. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:211-217`)
- vNext now: New rejects noncanonical phone in provider. (`src/modules/notifications/exotel-sms.ts:65-69`)
- Fix: Normalize at auth request to ensure unchanged login experience.

## G2-19-014-016  [P1] GAP  facet F07  effort M
- Legacy: Legacy SMS provider failures stored safe summary, support can query FAILED `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:42-49` `docs/legacy-source/backend/src/main/resources/db/migration/V134__sms_delivery_log.sql:28-34`
- vNext now: vNext Exotel logs failure reasons without durable attempt row `src/modules/notifications/exotel-sms.ts:106-122` `src/modules/notifications/exotel-sms.ts:131-137`
- Fix: Persist sanitized failure code/summary for each attempted send.

## G2-19-014-023  [P1] GAP  facet F10  effort M
- Legacy: Legacy `@Query` performs SQL SELECT and Page response, no data mutation `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`
- vNext now: vNext provider attempts outbound HTTP POST to Exotel; no log query path `src/modules/notifications/exotel-sms.ts:86-104`
- Fix: Separate append-on-send and read-only history service.

## G2-19-014-030  [P1] GAP  facet F13  effort M
- Legacy: Legacy missing recipient/status rows are simply absent from Page `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`
- vNext now: vNext current Exotel logs INFO/WARNING only, without durable table `src/modules/notifications/exotel-sms.ts:106-137`
- Fix: Show explicit 'No attempts found' and distinguish ledger unconfigured.

## G2-19-014-042  [P1] GAP  facet F20  effort L
- Legacy: Legacy provider logging precedes later read without delayed recomputation `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:8-17`
- vNext now: vNext current log only transient observability, staged row not yet registered `src/modules/notifications/exotel-sms.ts:125-137` `scripts/sql/db10-sms-delivery-attempts-staging.sql:1-2`
- Fix: Persist attempt atomically or durably enqueue recorder for support lookup.

## G2-19-014-043  [P1] GAP  facet F21  effort L
- Legacy: Legacy JpaRepository + `@Query` support reads `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:6-12` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`
- vNext now: vNext Drizzle staging SQL without registered adapter, Exotel provider only `scripts/sql/db10-sms-delivery-attempts-staging.sql:1-19` `src/modules/notifications/exotel-sms.ts:52-55`
- Fix: Create typed Drizzle repository and admin reader.

## G2-19-014-044  [P1] GAP  facet F21  effort L
- Legacy: Legacy BulkSMSApps and Exotel write same model per DB031 source review `docs/planning/database-parity-db10-sms-delivery-attempts.md:22-29`
- vNext now: vNext Exotel OTP adapter logs accepted but other notification sender paths need ledger wiring `src/modules/notifications/exotel-sms.ts:52-55` `docs/planning/database-parity-db10-sms-delivery-attempts.md:86-92`
- Fix: Capture OTP, absence, correction, job.update attempts generically, not just OTP.

## G2-19-014-048  [P1] GAP  facet F23  effort L
- Legacy: Legacy admin can answer 'what happened to number ending XXXX' `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:14-24` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:61-82`
- vNext now: vNext structured log has suffix only after accepted, no persisted support query `src/modules/notifications/exotel-sms.ts:125-137`
- Fix: Store both failure and accepted attempts and expose bounded support lookup.

## G2-2-024-007  [P1] GAP  facet F04  effort M
- Legacy: SmsDeliveryLog.java:24-55 ID,purpose,recipientSuffix,status,providerMessageId,errorSummary,collegeId,createdAt
- vNext now: src/modules/notifications/exotel-sms.ts:125-130 logs providerStatus and suffix without durable DB attempt row
- Fix: Persist provider message ID and redacted attempt metadata in indexed DB.

## G2-2-024-017  [P1] MISSING  facet F08  effort M
- Legacy: AdminSmsLogController.java:80-82 note exact SENT means operator accepted, not handset delivery
- vNext now: src/modules/notifications/exotel-sms.ts:125-129 internal comment says acceptance not delivery
- Fix: Expose provider-acceptance caveat beside statuses in UI and API response.

## G2-2-024-021  [P1] MISSING  facet F10  effort M
- Legacy: AdminSmsLogController.java:71-72 searches persisted SmsDeliveryLog
- vNext now: src/modules/notifications/exotel-sms.ts:57-137 OTP sends boolean and structured logs, no DB insert
- Fix: Persist OTP accepted/failed outcomes and provider IDs transactionally where possible.

## G2-2-024-033  [P1] GAP  facet F15  effort M
- Legacy: SmsDeliveryLog.java:9-17 attempt status without sending itself
- vNext now: src/modules/notifications/exotel-sms.ts:57-137 direct provider adapter
- Fix: Instrument send adapters to durable write, not as a second send.

## G2-2-024-034  [P1] GAP  facet F15  effort M
- Legacy: SmsDeliveryLog.java:45-49 providerMessageId/errorSummary supported
- vNext now: src/modules/notifications/exotel-sms.ts:113-129 parses response Sid but doesn't store it
- Fix: Persist sanitized provider Sid, status and failure reason.

## G2-2-024-037  [P1] MISSING  facet F18  effort M
- Legacy: AdminSmsLogController.java:80-82 exact accepted-not-delivered note
- vNext now: src/modules/notifications/exotel-sms.ts:125-126 internal comment not displayed
- Fix: Use exact note in status help text.

## G2-2-024-043  [P1] GAP  facet F21  effort M
- Legacy: AdminSmsLogController.java:40-47 repository+AccessControlService+SecurityContextUtil
- vNext now: src/modules/notifications/exotel-sms.ts:1-4 direct provider and structured logger
- Fix: Create an authorized support-read service integrated with provider outcome audit.

## G2-3-012-019  [P1] MISSING  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:183-204`
- vNext now: `src/modules/notifications/exotel-sms.ts:106-138`, `src/modules/messaging/providers.ts:84-90`
- Fix: Legacy persists every attempted send as SENT/FAILED with provider id/error, vNext logs OTP acceptance/failure only to structured logger and generic provider returns boolean. Persist privacy-safe support audit.

## G2-3-012-055  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SmsService.java:29-49`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:220-239`
- vNext now: `src/modules/notifications/types.ts:6-9`, `src/modules/notifications/exotel-sms.ts:124-138`
- Fix: Legacy deliberate transport-wide SMS attempt log with support endpoint dropped; no stated product exception, restore encrypted/minimized support audit.

## G2-4-033-008  [P1] GAP  facet F04  effort M
- Legacy: Legacy uses `SmsDeliveryLog` for SMS purpose/status/provider reference `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:3-4`; records missing DLT `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:96-100`
- vNext now: OTP provider emits structured logs, not same relational receipt `src/modules/notifications/exotel-sms.ts:59-73`
- Fix: Provide privacy-safe provider attempt ledger for OTP and all message categories.
