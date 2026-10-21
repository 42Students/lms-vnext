# Work packet: edit src/modules/messaging/providers.ts (part 4 of 4)

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/zeptomail-service.md, docs/audit/gap2/lane-14/u012-zeptomail-service.md, docs/audit/gap2/lane-15/email-variable-validator.md, docs/audit/gap2/lane-15/sms-service.md, docs/audit/gap2/lane-18/tpo-mail-service.md, docs/audit/gap2/lane-3/exotel-sms-service-impl.md

## G2-13-011-012  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:115-120` throws exact 'ZeptoMail template ID is required' or 'Recipient email is required'
- vNext now: `src/modules/notifications/zeptomail-email.ts:64-75` logs email.otp_not_sent + returns false; `src/modules/messaging/providers.ts:36-46` returns false
- Fix: Map provider failure reasons to typed internal errors; keep user-facing errors at feature boundary

## G2-14-012-017  [P2] GAP  facet F07  effort S
- Legacy: Missing template ID throws ZeptoMail template ID is required `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:115-117`
- vNext now: New OTP/provider returns false without exception `src/modules/notifications/zeptomail-email.ts:63-75` `src/modules/messaging/providers.ts:40-46`
- Fix: Map validation failures to useful caller-facing state and structured code

## G2-15-010-023  [P2] GAP  facet F07  effort S
- Legacy: Failure string missing or blank required variable for email: <key>. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:70-75`)
- vNext now: Generic parse failure returns false, no reason emitted here. (`src/modules/messaging/providers.ts:36-38`)
- Fix: Log structured missing-key reason with redacted data, preserving diagnosability.

## G2-15-010-024  [P2] MISSING  facet F07  effort S
- Legacy: Failure string at least one of [meetingLink, venueAddress] must be set for email. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:79-84`)
- vNext now: Provider returns Boolean without corresponding reason. (`src/modules/messaging/providers.ts:50-60`)
- Fix: Emit event-level location missing reason before send.

## G2-15-010-026  [P2] GAP  facet F08  effort M
- Legacy: Validation failure silently skips provider call and emits warning log. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:119-125`)
- vNext now: send returns false for invalid input; no event-variable warning reason. (`src/modules/messaging/providers.ts:32-41`)
- Fix: Record suppression reason missing-template-variable rather than opaque false.

## G2-15-012-022  [P2] GAP  facet F07  effort S
- Legacy: No job DLT mapping: Exotel job SMS not sent: job-update DLT template ID not configured. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:97-101`)
- vNext now: Generic send false when DLT/sender missing, no dedicated text. (`src/modules/messaging/providers.ts:62-64`)
- Fix: Record clear job DLT mapping absent reason and suppress send.

## G2-15-012-028  [P2] GAP  facet F08  effort S
- Legacy: Missing DLT returns false, persists failed audit. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:100-101`)
- vNext now: New false on missing config but no guaranteed persisted record in provider. (`src/modules/messaging/providers.ts:62-64`)
- Fix: Persist failure/rejection reason in outbound delivery audit.

## G2-18-010-025  [P2] GAP  facet F07  effort M
- Legacy: Legacy absent/placeholder Zepto template ID returns NOT_CONFIGURED without sending (`TpoMailService.java:63-71,172-177`).
- vNext now: New missing template provider false and digest config guards short-circuit (`messaging/providers.ts:39-47`; `recruiter-message-email-provider.ts:21-31`).
- Fix: Keep distinct NOT_CONFIGURED status with exact old warning copy.

## G2-3-012-016  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:95-101`, `124-130`
- vNext now: `src/modules/messaging/providers.ts:40-41`, `62-66`
- Fix: Legacy missing job/notification DLT writes `DLT template ID not configured` failure record; vNext generic returns false without typed persisted failure. Add support-safe failure code.

## G2-15-012-023  [P3] GAP  facet F07  effort S
- Legacy: Unsupported template key or missing context logs warning and false. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:115-118`)
- vNext now: Generic unconfigured key false; context not modeled. (`src/modules/messaging/providers.ts:40-41`)
- Fix: Expose typed unsupported job key diagnostic at service boundary.

## G2-18-010-030  [P3] GAP  facet F08  effort S
- Legacy: Legacy no UI success toast; service returns SENT to caller (`TpoMailService.java:172-190`).
- vNext now: New provider returns boolean and deliveredBatch records SENT with final audit summary (`messaging/providers.ts:32-61`; `messaging/service.ts:128-147`).
- Fix: Map service result to old operator-facing sent/failed wording in each TPO action.
