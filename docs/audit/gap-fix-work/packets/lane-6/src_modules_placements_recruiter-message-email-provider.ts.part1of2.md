# Work packet: edit src/modules/placements/recruiter-message-email-provider.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/zeptomail-service.md, docs/audit/gap2/lane-14/u012-zeptomail-service.md, docs/audit/gap2/lane-18/tpo-mail-service.md

## G2-13-011-002  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:22-35` one template-send API with four overloads, including sender/Reply-To/from override
- vNext now: `src/modules/notifications/zeptomail-email.ts:57-62` OTP-specific port; `src/modules/messaging/providers.ts:26-32` templated outbound port; `src/modules/placements/recruiter-message-email-provider.ts:17-20` digest port
- Fix: Provide one reusable transactional template-mail adapter with explicit per-send sender, reply-to and verified from override as needed

## G2-13-011-010  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:124-131` senderName blank→default, replyTo blank→omitted, fromAddressOverride blank→default
- vNext now: `src/modules/messaging/providers.ts:51-54` fixed configured sender, no per-send reply-to/from; `src/modules/placements/recruiter-message-email-provider.ts:40-43` custom replyTo only
- Fix: Add sanitized optional sender-name, Reply-To and authorized From choices for TPO college-branded senders

## G2-13-011-025  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:82-110` college-branded recruiter/student messages with tenant-specific sender name
- vNext now: `src/modules/messaging/providers.ts:51-54` global sender; `src/modules/placements/recruiter-message-email-provider.ts:40-46` global sender
- Fix: Load authorized college display/from/reply context per tenant on branded notifications

## G2-13-011-034  [P1] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:88-109` college name and workspace link
- vNext now: `src/modules/placements/recruiter-message-email-provider.ts:44-50` digest-specific fields
- Fix: Preserve legacy recruiter and student TPO template variables separately from digest-only mail

## G2-14-012-015  [P1] GAP  facet F06  effort M
- Legacy: Legacy replyTo null means omit; nonblank adds array entry `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:29-32` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:127-132`
- vNext now: General outbound provider request omits reply_to; recruiter digest explicitly sets it `src/modules/messaging/providers.ts:50-55` `src/modules/placements/recruiter-message-email-provider.ts:40-44`
- Fix: Provide vetted optional reply-to for approved domains across templates

## G2-14-012-030  [P1] GAP  facet F11  effort M
- Legacy: Legacy accepts any nonblank fromAddressOverride and replyTo `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:123-132`
- vNext now: New recruiter digest validates approved reply-to domain `src/modules/placements/recruiter-message-email-provider.ts:21-31`
- Fix: Require approved domain and verified sender alias for all template paths

## G2-14-012-034  [P1] GAP  facet F12  effort M
- Legacy: Legacy default from-name may be overridden but not address validated `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:123-132`
- vNext now: New digest bounds sender key and reply domain `src/modules/placements/recruiter-message-email-provider.ts:24-31`
- Fix: Validate sender aliases and reply-to for equivalent calls

## G2-14-012-041  [P1] GAP  facet F15  effort L
- Legacy: Interface used for OTP and dispatcher event emails `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:5-9` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-155`
- vNext now: New OTP endpoint plus separate campaigns/recruiter digests `src/modules/notifications/zeptomail-email.ts:57-130` `src/modules/messaging/providers.ts:26-61` `src/modules/placements/recruiter-message-email-provider.ts:17-57`
- Fix: Inventory every legacy NotificationEvent template and recipient timing

## G2-14-012-055  [P1] GAP  facet F20  effort M
- Legacy: Legacy sender/reply address overrides only trim, not domain constrained `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:123-132`
- vNext now: New digest reply address checked against configured domain `src/modules/placements/recruiter-message-email-provider.ts:24-31`
- Fix: Implement approved sender/reply address domain policy across notification events

## G2-18-010-001  [P1] GAP  facet F01  effort L
- Legacy: Legacy TpoMailService is server-side service invoked by TpoEmailCampaign/Drive/Offer/RecruiterMessage, not browser route (`TpoMailService.java:20-29,73-109`; `TpoEmailCampaignService.java:29-40`).
- vNext now: New standalone outbound provider and placements services, no unified TPO mail service entry (`messaging/providers.ts:10-32`; `recruiter-message-email-provider.ts:9-21`).
- Fix: Create central placement-email facade mapping all triggers, or document intentional per-workflow replacements.

## G2-18-010-002  [P1] MISSING  facet F01  effort M
- Legacy: Legacy recruiter sendAsCollege automatically supplies workspaceLink to `/recruiter` on selected college domain (`TpoMailService.java:82-97,133-153`).
- vNext now: New recruiter digest template only name/college/company/message1-3, no workspaceLink (`recruiter-message-email-provider.ts:40-50`).
- Fix: Inject verified tenant-aware recruiter workspace deep link for each email, including fallback.

## G2-18-010-005  [P1] GAP  facet F02  effort M
- Legacy: Legacy recruitment emails branded `{college} Campus Recruitment` in inbox From name (`TpoMailService.java:77-81,155-162`).
- vNext now: New provider uses global `config.email.fromName` in from object (`recruiter-message-email-provider.ts:40-42`; `zeptomail-email.ts:30-32`).
- Fix: Override sender name per verified college and preserve safe header rules.

## G2-18-010-007  [P1] GAP  facet F02  effort M
- Legacy: Legacy college sender From address recruitment@42lms.com and Reply-To recruitment mailbox/tag (`TpoMailService.java:42-53,77-97`).
- vNext now: New digest From address configurable ZEPTOMAIL_FROM_ADDRESS default hello@42lms.com and Reply-To token address (`zeptomail-email.ts:27-32`; `recruiter-message-email-provider.ts:40-44`).
- Fix: Set verified recruiter From and safe Reply-To across environments; test inbox header.

## G2-18-010-012  [P1] GAP  facet F03  effort M
- Legacy: Legacy merge object has `collegeName` and `workspaceLink` variables (`TpoMailService.java:88-96`).
- vNext now: New recruiter digest has `college`, no `collegeName`/workspaceLink (`recruiter-message-email-provider.ts:44-50`).
- Fix: Publish compatibility merge-field matrix or migrate Zepto template with tests.

## G2-18-010-019  [P1] GAP  facet F05  effort M
- Legacy: Legacy domain lookup uses verified first then primary, but may choose unverified if no verified (`TpoMailService.java:133-153`).
- vNext now: New tenantDomains unique verified-primary constraint exists, digest supplies no URL (`tenant-domains.ts:15-41`; `recruiter-message-email-provider.ts:40-50`).
- Fix: Use verified college domain for outgoing links, then canonical public fallback; never send unverified host.

## G2-18-010-044  [P1] GAP  facet F12  effort M
- Legacy: Legacy `collegeLink()` picks unverified domain when none verified (`TpoMailService.java:133-149`).
- vNext now: New domain schema only enforces primary verified, no email URL fallback routine (`tenant-domains.ts:35-41`; `recruiter-message-email-provider.ts:40-50`).
- Fix: Only use verified domains and safe fallback public base; never trust attacker-controlled unverified DNS.

## G2-18-010-048  [P1] MISSING  facet F13  effort M
- Legacy: Legacy empty public base+domain returns empty string for workspaceLink (`TpoMailService.java:133-152`).
- vNext now: New recruiter digest has no workspaceLink field at all (`recruiter-message-email-provider.ts:44-50`).
- Fix: Provide validated absolute link or explicitly indicate unavailable, avoid blank CTA.

## G2-18-010-050  [P1] GAP  facet F15  effort M
- Legacy: Legacy TpoMailService itself dispatches actual email only when configured+allowed (`TpoMailService.java:172-190`).
- vNext now: New recruiter digest requires bridge ENABLED=true plus template+reply HMAC secrets (`recruiter-message-email-provider.ts:17-31`).
- Fix: Validate production bridge flags, template provisioning, sender DNS and worker secret; expose readiness.

## G2-18-010-056  [P1] MISSING  facet F17  effort M
- Legacy: Legacy college link anchors to `https://{host}/recruiter`, from verified domain preference (`TpoMailService.java:133-153`).
- vNext now: New digest has no link in merge and Reply-To token-based (`recruiter-message-email-provider.ts:40-50`).
- Fix: Ensure email CTA text explicit and verified HTTPS destination in template.

## G2-18-010-057  [P1] GAP  facet F18  effort M
- Legacy: Legacy exact template placeholders `name`, `collegeName`, `workspaceLink` (`TpoMailService.java:88-96,196-200`).
- vNext now: New digest `name`,`college`,`company`,`message1`,`message2`,`message3` (`recruiter-message-email-provider.ts:44-50`).
- Fix: Produce template-merge crosswalk and provision compatible Zepto templates.
