# Work packet (wave 2): edit src/modules/notifications/types.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/sms-service.md, docs/audit/gap2/lane-3/exotel-sms-service-impl.md

## G2-15-012-001  [P2] GAP  facet F01  effort M
- Legacy: Interface SmsService with synchronous sendOtp(phone,otp). (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SmsService.java:5-19`)
- vNext now: New SmsProvider async sendOtp(phoneE164,code). (`src/modules/notifications/types.ts:6-9`)
- Fix: Map synchronous caller behavior to awaited provider acceptance/timeout.

## G2-15-012-008  [P2] GAP  facet F04  effort S
- Legacy: OTP recipient and OTP string only; return boolean. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SmsService.java:11-19`)
- vNext now: New phoneE164 and code, Promise<boolean>. (`src/modules/notifications/types.ts:6-9`)
- Fix: Normalize legacy ten-digit India inputs to E.164 at caller and await result.

## G2-15-012-064  [P2] GAP  facet F21  effort M
- Legacy: Provider-agnostic interface supports SMS & DLT job notification. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SmsService.java:5-49`)
- vNext now: New OTP-only SmsProvider; separate campaign provider. (`src/modules/notifications/types.ts:1-9`)
- Fix: Document transport split and map all call-site integrations.

## G2-3-012-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:29-33`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SmsService.java:9-49`
- vNext now: `src/modules/notifications/exotel-sms.ts:52-55`, `src/modules/notifications/types.ts:6-9`
- Fix: Legacy @Primary SmsService exposes OTP, job update, generic notification, templated SMS in one transport; vNext SmsProvider only has sendOtp and separate outbound provider. Wire shared adapter/contract.

## G2-15-012-002  [P3] GAP  facet F01  effort S
- Legacy: Overload sendOtp with NotificationTemplateContext. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SmsService.java:21-29`)
- vNext now: No context overload in OTP port; global config instead. (`src/modules/notifications/types.ts:6-9`)
- Fix: Document LMS-only context; remove unsupported overload intentionally.
