# Work packet: edit src/modules/notifications/types.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/sms-service.md, docs/audit/gap2/lane-3/exotel-sms-service-impl.md

## G2-15-012-003  [P1] GAP  facet F01  effort M
- Legacy: sendNotification/sendSmsWithTemplate/sendJobUpdateSms callable by legacy domains. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SmsService.java:31-49`)
- vNext now: OTP-only SmsProvider; separate outbound provider handles campaigns. (`src/modules/notifications/types.ts:6-9`)
- Fix: Build explicit job-update and approved notice SMS ports with DLT template schemas.

## G2-15-012-072  [P1] GAP  facet F23  effort L
- Legacy: Separate job/update and notification methods. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:96-134`)
- vNext now: New OTP-only interface; campaign support separate. (`src/modules/notifications/types.ts:6-9`)
- Fix: Verify complete feature trigger parity before release.

## G2-3-012-007  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SmsService.java:19-49`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:80-134`
- vNext now: `src/modules/notifications/types.ts:6-9`, `src/modules/messaging/providers.ts:11-24`
- Fix: Legacy transport has sendNotification, sendJobUpdateSms, sendSmsWithTemplate, and context-aware sendOtp; vNext SmsProvider only supports sendOtp. Add parity send methods with DLT mappings.

## G2-3-012-025  [P1] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:80-134`
- vNext now: `src/modules/notifications/types.ts:6-9`, `src/modules/operations/outbound-delivery-contract.ts:8-12`
- Fix: Legacy notification/job updates sent via SmsService methods; vNext OTP transport cannot send them and outbound contract only recruiter intents. Integrate mapping and safe delivery calls.

## G2-3-012-055  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SmsService.java:29-49`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:220-239`
- vNext now: `src/modules/notifications/types.ts:6-9`, `src/modules/notifications/exotel-sms.ts:124-138`
- Fix: Legacy deliberate transport-wide SMS attempt log with support endpoint dropped; no stated product exception, restore encrypted/minimized support audit.
