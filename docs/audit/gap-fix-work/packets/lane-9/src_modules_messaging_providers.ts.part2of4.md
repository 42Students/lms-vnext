# Work packet: edit src/modules/messaging/providers.ts (part 2 of 4)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/email-variable-validator.md, docs/audit/gap2/lane-15/sms-service.md, docs/audit/gap2/lane-18/tpo-mail-service.md, docs/audit/gap2/lane-3/exotel-sms-service-impl.md

## G2-15-010-007  [P1] MISSING  facet F04  effort S
- Legacy: Interview scheduled requires meetingLink OR venueAddress. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:36-36`)
- vNext now: No alternative key group rule for provider merge_info. (`src/modules/messaging/providers.ts:36-54`)
- Fix: Reject scheduled-interview email lacking both meaningful location alternatives.

## G2-15-010-008  [P1] MISSING  facet F04  effort S
- Legacy: Reminder requires learnerName/jobTitle/companyName/applicationId. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:38-40`)
- vNext now: No event-based reminder merge schema. (`src/modules/messaging/providers.ts:36-54`)
- Fix: Implement reminder base-identity required fields.

## G2-15-010-009  [P1] MISSING  facet F04  effort S
- Legacy: Reminder requires interviewDate, interviewTime, interviewMode, interviewLocation. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:38-40`)
- vNext now: No reminder date/mode/location variable gate. (`src/modules/messaging/providers.ts:36-54`)
- Fix: Implement reminder date/time/mode/location gating.

## G2-15-010-010  [P1] MISSING  facet F04  effort S
- Legacy: Confirmation requires learnerName/jobTitle/companyName/applicationId. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:38-40`)
- vNext now: Generic provider has no confirmation-specific check. (`src/modules/messaging/providers.ts:36-54`)
- Fix: Implement confirmation identity required fields.

## G2-15-010-011  [P1] MISSING  facet F04  effort S
- Legacy: Confirmation requires interviewDate, interviewTime, interviewMode, interviewLocation. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:38-40`)
- vNext now: Generic provider has no confirmation-specific check. (`src/modules/messaging/providers.ts:36-54`)
- Fix: Implement confirmation time/location checks.

## G2-15-010-015  [P1] MISSING  facet F04  effort S
- Legacy: SYSTEM_APPLICATION_APPROVED needs learnerName and applicationId. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:55-56`)
- vNext now: Generic template merge sender has no application-approved schema. (`src/modules/messaging/providers.ts:40-54`)
- Fix: Create system-approved merge schema; fail closed on missing name or ID.

## G2-15-010-016  [P1] MISSING  facet F04  effort S
- Legacy: SYSTEM_APPLICATION_REJECTED additionally needs rejectionReason. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:58-59`)
- vNext now: Generic merge sender has no rejection-specific reason gate. (`src/modules/messaging/providers.ts:40-54`)
- Fix: Require nonblank rejectionReason before sending template.

## G2-15-010-019  [P1] GAP  facet F06  effort S
- Legacy: At least one of two keys nonblank; both permissible. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:79-84`)
- vNext now: Provider accepts unvalidated request.variables. (`src/modules/messaging/providers.ts:50-54`)
- Fix: Support one-of union constraint meetingLink/venueAddress at dispatch.

## G2-15-010-021  [P1] GAP  facet F06  effort S
- Legacy: Uses String.value via toString() and trimmed nonblank; whitespace rejected. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:86-95`)
- vNext now: Provider serializes raw variables without value-level trim check. (`src/modules/messaging/providers.ts:50-54`)
- Fix: Reject whitespace-only required merge values; normalize string values before send.

## G2-15-010-029  [P1] GAP  facet F10  effort M
- Legacy: Legacy calls validator BEFORE template selection and ZeptoMail send. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:119-133`)
- vNext now: New selects template but does not check required merge keys before request. (`src/modules/messaging/providers.ts:40-54`)
- Fix: Insert approved variable validation before outboundFetch.

## G2-15-010-034  [P1] GAP  facet F11  effort M
- Legacy: Only interview urgency and system events eligible for legacy email. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:50-59`)
- vNext now: Generic campaign key whitelist not tied to legacy event registry. (`src/modules/messaging/providers.ts:40-46`)
- Fix: Maintain separate event-to-email channel policy to prevent noisy bulk email.

## G2-15-010-059  [P1] MISSING  facet F23  effort M
- Legacy: Many per-event nonblank rules. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:33-59`)
- vNext now: Generic campaign provider lacks direct equivalent. (`src/modules/messaging/providers.ts:36-54`)
- Fix: Do not consider email parity complete without equivalent event-variable skip gate.

## G2-15-012-011  [P1] GAP  facet F04  effort M
- Legacy: Job update text uses one {#var#} name substitution. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:97-109`)
- vNext now: Generic template may supply renderSms with arbitrary variables. (`src/modules/messaging/providers.ts:11-16`)
- Fix: Provide registered job update template with single recipientName substitution.

## G2-15-012-034  [P1] GAP  facet F10  effort L
- Legacy: sendJobUpdateSms dedicated transport. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:96-110`)
- vNext now: Campaign send generic SMS branch with renderSms and no dedicated job function. (`src/modules/messaging/providers.ts:62-86`)
- Fix: Wire status-change event -> approved job template -> outbound provider with fallback/sanitizer.

## G2-15-012-035  [P1] GAP  facet F10  effort M
- Legacy: sendNotification arbitrary approved text with DLT mapping. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:123-134`)
- vNext now: New template renderer and DLT mapping, no direct sendNotification port. (`src/modules/messaging/providers.ts:63-86`)
- Fix: Map attendance correction/absence and other notices to registered templates.

## G2-15-012-040  [P1] GAP  facet F12  effort S
- Legacy: Name DLT placeholder stripped and max30. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:103-109`)
- vNext now: No hardcoded name normalization in campaign renderer. (`src/modules/messaging/providers.ts:63-69`)
- Fix: Ensure jobUpdate body only substitutes sanitized max30 name.

## G2-15-012-049  [P1] GAP  facet F15  effort M
- Legacy: Legacy TRAI SMS selected by NotificationEventRegistry for job events. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:156-170`)
- vNext now: New outbound send requires explicit channel/template key. (`src/modules/messaging/providers.ts:26-86`)
- Fix: Port event-to-SMS trigger matrix, avoid missing interview reminders.

## G2-18-010-001  [P1] GAP  facet F01  effort L
- Legacy: Legacy TpoMailService is server-side service invoked by TpoEmailCampaign/Drive/Offer/RecruiterMessage, not browser route (`TpoMailService.java:20-29,73-109`; `TpoEmailCampaignService.java:29-40`).
- vNext now: New standalone outbound provider and placements services, no unified TPO mail service entry (`messaging/providers.ts:10-32`; `recruiter-message-email-provider.ts:9-21`).
- Fix: Create central placement-email facade mapping all triggers, or document intentional per-workflow replacements.

## G2-18-010-039  [P1] GAP  facet F11  effort M
- Legacy: Legacy sender derives college using caller-provided int collegeId DB lookup (`TpoMailService.java:82-97,123-130`).
- vNext now: New generic provider has no tenant or permission context; send gated by policy service and per-workflow queries (`messaging/providers.ts:26-40`; `recruiter-message-email-dispatch-service.ts:45-65`).
- Fix: Require authorized college scope at enqueue, ensure tenant context cannot be spoofed in variables.

## G2-3-012-007  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SmsService.java:19-49`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:80-134`
- vNext now: `src/modules/notifications/types.ts:6-9`, `src/modules/messaging/providers.ts:11-24`
- Fix: Legacy transport has sendNotification, sendJobUpdateSms, sendSmsWithTemplate, and context-aware sendOtp; vNext SmsProvider only supports sendOtp. Add parity send methods with DLT mappings.
