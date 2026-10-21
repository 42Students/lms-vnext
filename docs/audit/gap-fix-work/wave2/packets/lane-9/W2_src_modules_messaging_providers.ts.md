# Work packet (wave 2): edit src/modules/messaging/providers.ts

38 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/zeptomail-service.md, docs/audit/gap2/lane-14/u012-zeptomail-service.md, docs/audit/gap2/lane-15/email-variable-validator.md, docs/audit/gap2/lane-15/sms-service.md, docs/audit/gap2/lane-18/tpo-mail-service.md, docs/audit/gap2/lane-3/exotel-sms-service-impl.md

## G2-13-011-003  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:121-146` JSON payload arranged as template/from/reply_to/to/merge_info
- vNext now: `src/modules/messaging/providers.ts:50-55` emits template/from/to/merge_info (no reply_to); `src/modules/placements/recruiter-message-email-provider.ts:40-50` includes reply_to
- Fix: Support optional reply_to consistently in shared outbound adapter; preserve sender header fields

## G2-13-011-018  [P2] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:127-132` optional reply_to has address AND senderName
- vNext now: `src/modules/placements/recruiter-message-email-provider.ts:43` sends reply_to address only; `src/modules/messaging/providers.ts:50-55` none
- Fix: Allow optional Reply-To display name when the sending flow requires it

## G2-14-012-007  [P2] GAP  facet F04  effort M
- Legacy: Template key sent as trimmed Zepto template ID `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:115-123`
- vNext now: New OTP uses environment OTP key and campaigns use configured template map `src/modules/notifications/zeptomail-email.ts:27-29` `src/modules/messaging/providers.ts:40-54`
- Fix: Map legacy template IDs by event with explicit provisioning table

## G2-14-012-014  [P2] GAP  facet F06  effort M
- Legacy: Legacy senderName blank falls back to platform name `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:24-26` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:123-125`
- vNext now: New shared provider uses config name, no caller senderName override `src/modules/messaging/providers.ts:50-55`
- Fix: Support approved sender display name overrides for event templates

## G2-14-012-016  [P2] GAP  facet F06  effort M
- Legacy: Legacy fromAddress override blank falls back default `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:34-37` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:123-126`
- vNext now: New provider has only fixed configured from address `src/modules/messaging/providers.ts:50-55`
- Fix: Allow only verified, authorized sender aliases with safe fallback

## G2-14-012-038  [P2] GAP  facet F13  effort M
- Legacy: No dedicated offline session state at provider layer `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:10-38`
- vNext now: New outbound catch returns false for provider outages `src/modules/messaging/providers.ts:87-90`
- Fix: Expose meaningful send pending/failure in calling workflow

## G2-14-012-058  [P2] GAP  facet F21  effort M
- Legacy: Legacy template ID resolver warns at startup for missing event keys `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/ZeptoMailTemplateIdResolver.java:27-47`
- vNext now: New config checks at send time for invalid OTP/template `src/modules/notifications/zeptomail-email.ts:63-75` `src/modules/messaging/providers.ts:40-46`
- Fix: Add startup/readiness validation for required templates without leaking key

## G2-14-012-060  [P2] GAP  facet F22  effort M
- Legacy: Legacy provider config via application properties and env; template map external `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:33-47` `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/ZeptoMailTemplateIdResolver.java:11-57`
- vNext now: New reads env values and campaign mapping `src/modules/notifications/zeptomail-email.ts:19-32` `src/modules/messaging/providers.ts:18-24`
- Fix: Audit complete environment variable/migration mapping

## G2-15-010-001  [P2] MISSING  facet F01  effort M
- Legacy: Private utility getSkipReason invoked before email; not user navigable. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:19-28`)
- vNext now: No shared event-aware validator entrypoint, outbound provider validates generic request. (`src/modules/messaging/providers.ts:26-43`)
- Fix: Create provider-independent template variable guard used at each event dispatch boundary.

## G2-15-010-018  [P2] GAP  facet F06  effort M
- Legacy: Required keys passed as string-varargs; first missing key wins. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:70-77`)
- vNext now: Zod parses generic outbound request, not per-event variable fields. (`src/modules/messaging/providers.ts:36-41`)
- Fix: Implement per-template ordered merge schema and first-key failure diagnostic.

## G2-15-010-032  [P2] GAP  facet F10  effort M
- Legacy: Legacy truncates merge values at 8192 chars, skips blank/null keys. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:175-191`)
- vNext now: New merge_info takes request.variables without matching 8192 truncation at provider. (`src/modules/messaging/providers.ts:50-54`)
- Fix: Bound per-value lengths and reject blank keys in outbound schema; do not silently overrun provider.

## G2-15-010-037  [P2] GAP  facet F12  effort S
- Legacy: Extra merge map keys ignored by validator; null unknown map keys irrelevant. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:70-94`)
- vNext now: New sends all parsed variables to provider. (`src/modules/messaging/providers.ts:50-54`)
- Fix: Allow benign extra keys but sanitize / bound values and reject risky reserved names.

## G2-15-010-043  [P2] GAP  facet F15  effort M
- Legacy: In-app notifications are created before email validation. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:69-104`)
- vNext now: Generic outbound provider only transmits specified channel. (`src/modules/messaging/providers.ts:26-93`)
- Fix: Preserve independent in-app channel when email is skipped by variable guard.

## G2-15-010-047  [P2] GAP  facet F18  effort S
- Legacy: Diagnostic exact missing or blank required variable for email: key. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:73-74`)
- vNext now: Only Boolean false; lacks operator-readable diagnostic. (`src/modules/messaging/providers.ts:36-41`)
- Fix: Use exact or structured equivalent missing-field diagnostic in server log.

## G2-15-010-048  [P2] MISSING  facet F18  effort S
- Legacy: Diagnostic exact at least one of [meetingLink, venueAddress] must be set for email. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:83-84`)
- vNext now: No location-specific diagnostic. (`src/modules/messaging/providers.ts:40-54`)
- Fix: Include both eligible keys in a safe diagnostic reason.

## G2-15-010-049  [P2] GAP  facet F19  effort S
- Legacy: O(k) first failure and no network calls during validation. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:70-77`)
- vNext now: Zod generic parse then outbound network; no event validation pass. (`src/modules/messaging/providers.ts:36-60`)
- Fix: Validate complete template variable contract before expensive provider call.

## G2-15-010-057  [P2] GAP  facet F22  effort M
- Legacy: Required fields encoded only in switch; no DB constraints. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java:32-68`)
- vNext now: Config template registry rather than typed per-event field relation. (`src/modules/messaging/providers.ts:10-24`)
- Fix: Define code-owned schema keyed by template/event; no DB migration necessary for rules.

## G2-15-012-019  [P2] GAP  facet F06  effort M
- Legacy: Supports only set of 7 job keys, requires non-null context. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:113-121`)
- vNext now: Generic isCampaignTemplateKey requires provisioned key and excludes OTP template. (`src/modules/messaging/providers.ts:40-46`)
- Fix: Map legacy key aliases and exact DLT template to registered outbound catalog.

## G2-15-012-041  [P2] GAP  facet F12  effort S
- Legacy: SMS body maximum 2000 chars. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:156-158`)
- vNext now: Generic rendered SMS bound 1600 chars. (`src/modules/messaging/providers.ts:65-66`)
- Fix: Document stricter vNext 1600 cap and validate before submit.

## G2-15-012-050  [P2] GAP  facet F15  effort M
- Legacy: Job update SMS uses one approved message with recipient name. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SmsService.java:45-49`)
- vNext now: New SMS body comes from configured template renderer. (`src/modules/messaging/providers.ts:63-66`)
- Fix: Provide default approved job update copy and verify DLT registration.

## G2-15-012-055  [P2] MISSING  facet F18  effort S
- Legacy: Legacy job message Reminder: Hello {#var#} ... Login to 42lms.com ... JRSPF. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:37-37`)
- vNext now: No default job message literal in generic renderer. (`src/modules/messaging/providers.ts:63-66`)
- Fix: Add exact approved job template in config; avoid altering registered punctuation.

## G2-15-012-056  [P2] GAP  facet F18  effort S
- Legacy: Job template missing warning and DLT template ID not configured audit reason. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:99-101`)
- vNext now: New false without visible equivalent reason. (`src/modules/messaging/providers.ts:62-64`)
- Fix: Retain diagnostic error reason in support logs/UI.

## G2-18-010-013  [P2] GAP  facet F04  effort M
- Legacy: Legacy template name `zepto.template.tpo.{name}` dynamic, PLACEHOLDER rejected (`TpoMailService.java:20-24,63-71`).
- vNext now: New config.templates maps app template keys and dedicated recruiter digest env key (`messaging/providers.ts:10-25,39-47`; `recruiter-message-email-provider.ts:25-30`).
- Fix: Catalog old→new template names/keys, reject placeholders and verify deployments.

## G2-18-010-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy Result outcomes SENT, NOT_CONFIGURED, FAILED (`TpoMailService.java:29-33,172-190`).
- vNext now: New generic Provider returns boolean success, Messaging stores QUEUED/SENT/FAILED/SUPPRESSED (`messaging/providers.ts:32-61`; `messaging/model.ts:3-5`).
- Fix: Keep explicit not-configured reason rather than generic FAILED and expose per-trigger disabled copy.

## G2-18-010-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy event `OFFER_RELEASED` mapped `offer-released` via lowercase+underscore replacement (`TpoMailService.java:222-225`).
- vNext now: New templateKeys are arbitrary configured whitelist and require namespaced formatting (`messaging/providers.ts:39-46`; `messaging/template-boundary-model.ts:2-7`).
- Fix: Provide normalized event→configured template map for every old TPO event.

## G2-18-010-035  [P2] GAP  facet F10  effort M
- Legacy: Legacy Zepto service `sendEmailWithTemplateId(id,to,merge,senderName,replyTo,fromAddress)` (`TpoMailService.java:183-185`).
- vNext now: New posts Zepto template_key/from/to/merge_info with outboundFetch timeout10s and no unconfirmed retries (`messaging/providers.ts:43-60`).
- Fix: Document full provider field contract including Reply-To/college sender not present in generic send.

## G2-18-010-046  [P2] GAP  facet F13  effort M
- Legacy: Legacy missing template NOT_CONFIGURED before checking recipient (`TpoMailService.java:172-182`).
- vNext now: New provider returns false for invalid template and invalid address without distinct status (`messaging/providers.ts:36-47`).
- Fix: Expose configured-templates readiness in send preview and no-send state.

## G2-18-010-067  [P2] GAP  facet F21  effort M
- Legacy: Legacy external template registry in application.properties has `zepto.template.tpo.<name>` (`TpoMailService.java:20-24,63-71`).
- vNext now: New template registry passed as app config map plus RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY env (`messaging/providers.ts:18-25`; `recruiter-message-email-provider.ts:25-29`).
- Fix: Build namespaced registry and provision all required IDs in deployment.

## G2-3-012-014  [P2] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:103-109`
- vNext now: `src/modules/messaging/providers.ts:65-66`, `src/modules/messaging/model.ts:9-17`
- Fix: Legacy recipient name is stripped of DLT placeholders, trimmed, User fallback and max30; vNext generic renderSms delegates to template without job-specific name cleanup. Add canonical job SMS renderer.

## G2-3-012-015  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:155-162`
- vNext now: `src/modules/notifications/exotel-sms.ts:65-74`, `src/modules/messaging/providers.ts:62-66`, `src/modules/attendance/parent-sms-provider.ts:16-20`
- Fix: Legacy global message body max2000 chars; vNext generic max1600, attendance max1000, OTP fixed. Reconcile per-template max with approved DLT content, document intentional limits.

## G2-3-012-032  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:66-73`, `123-134`
- vNext now: `src/modules/messaging/providers.ts:11-24`, `62-71`
- Fix: Legacy separates OTP sender/registration from job and notification; vNext generic templates supply independent registered IDs. Verify mapping, forbid OTP template reuse.

## G2-3-012-043  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:98-102`, `124-130`, `151-160`
- vNext now: `src/modules/notifications/exotel-sms.ts:106-123`, `src/modules/messaging/providers.ts:84-90`
- Fix: Legacy failure reasons distinguish missing DLT, incomplete credentials, invalid parameters and provider not accepted; vNext mostly false/event codes. Use safe mapped messages in support log.

## G2-4-033-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy transactional SMS routed through `SmsService` in Exotel implementation; OTP and job updates exposed as separate methods `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:81-109`
- vNext now: Separate OTP provider and campaign adapter `src/modules/notifications/exotel-sms.ts:52-58`; `src/modules/messaging/providers.ts:26-43`
- Fix: Document legacy event-to-provider route mapping; ensure every old caller is mapped.

## G2-4-033-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy ZeptoMail template transport callable with per-message template IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:94-109`
- vNext now: OTP provider and separate outbound campaign provider `src/modules/notifications/zeptomail-email.ts:57-63`; `src/modules/messaging/providers.ts:40-60`
- Fix: Map each legacy caller and template key to OTP, campaign or placement sender.

## G2-4-033-058  [P2] GAP  facet F23  effort M
- Legacy: Legacy backend sends job updates via one template `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:96-109`
- vNext now: New excludes OTP key from campaign templates `src/modules/messaging/providers.ts:40-46`; `src/modules/messaging/providers.ts:62-66`
- Fix: Catalog intentionally retired templates and ensure no essential event silently dropped.

## G2-6-012-031  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BulkSmsAppsServiceImpl.java:123-131`
- vNext now: `src/modules/messaging/providers.ts:39-41`
- Fix: Add operator-safe rejection reason metrics for unsupported template

## G2-6-012-040  [P2] GAP  facet F23  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BulkSmsAppsServiceImpl.java:54-61`
- vNext now: `src/modules/messaging/providers.ts:18-25`
- Fix: Document configuration migration for platform job-update SMS text

## G2-13-011-037  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:113` warning says fallback token used; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:115-120` exact required-field text
- vNext now: `src/modules/notifications/zeptomail-email.ts:71-74` structured warning 'email.otp_not_sent'; `src/modules/messaging/providers.ts:36-46` false
- Fix: Provide stable error-code mapping and review copy in login/placement flows; do not replicate unsafe fallback wording
