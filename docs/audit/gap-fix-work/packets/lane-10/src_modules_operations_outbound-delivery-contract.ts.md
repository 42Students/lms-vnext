# Work packet: edit src/modules/operations/outbound-delivery-contract.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-sms-log-controller.md, docs/audit/gap2/lane-3/exotel-sms-service-impl.md

## G2-2-024-044  [P1] GAP  facet F21  effort M
- Legacy: AdminSmsLogController.java:51-52 mentions notification/otp/job.update origins
- vNext now: src/modules/operations/outbound-delivery-contract.ts:8-12 only invitation templates
- Fix: Instrument all authorized SMS producers including attendance parent notifications.

## G2-3-012-008  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:34-36`, `112-121`
- vNext now: `src/modules/operations/outbound-delivery-contract.ts:8-12`, `src/modules/messaging/providers.ts:40-41`
- Fix: Seven legacy job event keys map to one approved job SMS; vNext outbound contract keys only recruiter invitation/reminder and campaign guard. Register job-event intents.

## G2-3-012-025  [P1] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:80-134`
- vNext now: `src/modules/notifications/types.ts:6-9`, `src/modules/operations/outbound-delivery-contract.ts:8-12`
- Fix: Legacy notification/job updates sent via SmsService methods; vNext OTP transport cannot send them and outbound contract only recruiter intents. Integrate mapping and safe delivery calls.

## G2-3-012-031  [P1] MISSING  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:34-39`, `95-120`
- vNext now: `src/modules/operations/outbound-delivery-contract.ts:8-12`, `src/modules/messaging/providers.ts:40-41`
- Fix: Legacy single job-update TRAI body covers seven events; vNext no active matching approved job template key/content in notification provider. Register after DLT verification.

## G2-3-012-037  [P1] MISSING  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:34-39`, `112-133`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:156-171`
- vNext now: `src/modules/messaging/providers.ts:11-24`, `src/modules/operations/outbound-delivery-contract.ts:8-12`
- Fix: Legacy dispatcher sends seven job status updates via single approved SMS body, vNext generic contract has no job-status delivery producers. Add event mapping with registered templates.
