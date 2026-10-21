# Work packet (wave 2): edit src/modules/placements/recruiter-message-email-provider.ts

26 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/zeptomail-service.md, docs/audit/gap2/lane-14/u012-zeptomail-service.md, docs/audit/gap2/lane-18/tpo-mail-service.md, docs/audit/gap2/lane-20/recruiter-message-email-service.md

## G2-13-011-003  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:121-146` JSON payload arranged as template/from/reply_to/to/merge_info
- vNext now: `src/modules/messaging/providers.ts:50-55` emits template/from/to/merge_info (no reply_to); `src/modules/placements/recruiter-message-email-provider.ts:40-50` includes reply_to
- Fix: Support optional reply_to consistently in shared outbound adapter; preserve sender header fields

## G2-13-011-018  [P2] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:127-132` optional reply_to has address AND senderName
- vNext now: `src/modules/placements/recruiter-message-email-provider.ts:43` sends reply_to address only; `src/modules/messaging/providers.ts:50-55` none
- Fix: Allow optional Reply-To display name when the sending flow requires it

## G2-14-012-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy interface has one base method and 3 successive sender/reply/from overloads `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:14-37`
- vNext now: New separate OTP/provider/recruiter digest APIs expose different option shapes `src/modules/notifications/zeptomail-email.ts:11-17` `src/modules/placements/recruiter-message-email-provider.ts:9-20`
- Fix: Preserve equivalent from/name/reply override support via dedicated safe API

## G2-18-010-008  [P2] GAP  facet F03  effort S
- Legacy: Legacy inbox prefix `Campus Recruitment` exact suffix plus capital letters (`TpoMailService.java:155-162`).
- vNext now: New digest fromName globally `42Learn` by default (`zeptomail-email.ts:30-32`; `recruiter-message-email-provider.ts:40-42`).
- Fix: Restore per-college suffix/capitalization with test snapshots.

## G2-18-010-010  [P2] GAP  facet F03  effort S
- Legacy: Legacy name safe limits 80 chars and replaces CR/LF/quote/angle/comma/semicolon/colon/backslash (`TpoMailService.java:164-170`).
- vNext now: New recruiter digest sanitizes recipient name (160), but collegeName is merged as content, not From name (`recruiter-message-email-model.ts:20-40`; `recruiter-message-email-provider.ts:40-47`).
- Fix: Port 80-char safe From name sanitizer and test header injection.

## G2-18-010-011  [P2] GAP  facet F03  effort S
- Legacy: Legacy greeting `name` blank becomes `there` (`TpoMailService.java:192-200`).
- vNext now: New digest `name` uses safeRecruiterEmailMergeText but no blank fallback (`recruiter-message-email-provider.ts:43-48`; `recruiter-message-email-model.ts:20-30`).
- Fix: Use `there` when recipientName trims empty.

## G2-18-010-013  [P2] GAP  facet F04  effort M
- Legacy: Legacy template name `zepto.template.tpo.{name}` dynamic, PLACEHOLDER rejected (`TpoMailService.java:20-24,63-71`).
- vNext now: New config.templates maps app template keys and dedicated recruiter digest env key (`messaging/providers.ts:10-25,39-47`; `recruiter-message-email-provider.ts:25-30`).
- Fix: Catalog old→new template names/keys, reject placeholders and verify deployments.

## G2-18-010-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy recruiter sendAsCollege caller merge keys override default `collegeName`/`workspaceLink`, null values ignored (`TpoMailService.java:88-96`).
- vNext now: New digest uses fixed merge fields from data and no caller override (`recruiter-message-email-provider.ts:40-50`).
- Fix: Define authoritative college/domain fields vs caller-supplied overrides with injection control.

## G2-18-010-020  [P2] GAP  facet F05  effort S
- Legacy: Legacy tenant domains sorted verified then primary (`TpoMailService.java:137-144`).
- vNext now: New DB stores isPrimary/isVerified, no email-specific precedence (`tenant-domains.ts:22-41`; `recruiter-message-email-provider.ts:40-50`).
- Fix: Specify primary verified preference and deterministic host normalization.

## G2-18-010-023  [P2] GAP  facet F06  effort M
- Legacy: Legacy sendAsCollege collegeId nullable, default recruiter From with replyOr(replyTo) (`TpoMailService.java:87-97`).
- vNext now: New recruiter digest requires supplied collegeName and replyTo, sends only if reply domain valid (`recruiter-message-email-provider.ts:9-31`).
- Fix: Validate missing-college behavior, fallback mailbox and safe reply domain for all recruiter triggers.

## G2-18-010-034  [P2] GAP  facet F09  effort M
- Legacy: Legacy recruiter digest includes Reply-To that resolves inbound conversation per thread (`TpoMailService.java:86-97`; `RecruiterMessageEmailService.java:110-116`).
- vNext now: New digest validates r-token Reply-To and vNext inbound HMAC+grant checks (`recruiter-message-email-provider.ts:29-44`; `recruiter-message-email-inbound-service.ts:21-40`).
- Fix: Test reply routing, old forwarded message alias compatibility and expired token UX.

## G2-18-010-041  [P2] GAP  facet F11  effort M
- Legacy: Legacy null collegeId sends recruiter mail with generic reply mailbox (`TpoMailService.java:87-89,118-121`).
- vNext now: New digest requires valid replyToken+domain and live college context (`recruiter-message-email-provider.ts:21-31`; `recruiter-message-email-dispatch-service.ts:45-65`).
- Fix: Decide fallback for college-null system invitations; do not silently drop legitimate mail.

## G2-18-010-047  [P2] GAP  facet F13  effort S
- Legacy: Legacy failure at collegeName lookup falls back generic sender rather than crash (`TpoMailService.java:123-130,155-162`).
- vNext now: New provider receives caller collegeName, default generic `42Learn` (`recruiter-message-email-provider.ts:9-21`; `zeptomail-email.ts:30-32`).
- Fix: Keep no-college brand fallback and report missing tenant metadata.

## G2-18-010-062  [P2] GAP  facet F19  effort M
- Legacy: Legacy collegeLink queries JDBC+domainRepo per mail (`TpoMailService.java:123-153`).
- vNext now: New generic provider no DB lookup, caller passes collegeName and no host (`recruiter-message-email-provider.ts:9-21,40-50`).
- Fix: Resolve and cache verified tenant details at enqueue without cross-tenant leak.

## G2-18-010-064  [P2] GAP  facet F20  effort M
- Legacy: Legacy college domain lookup catches runtime exception and falls back app.public.base.url (`TpoMailService.java:133-153`).
- vNext now: New mail payload has no deep link, so no fallback on DNS/DB error (`recruiter-message-email-provider.ts:40-50`).
- Fix: Use stable safe public URL fallback with tenant-identifying route rather than missing action.

## G2-18-010-067  [P2] GAP  facet F21  effort M
- Legacy: Legacy external template registry in application.properties has `zepto.template.tpo.<name>` (`TpoMailService.java:20-24,63-71`).
- vNext now: New template registry passed as app config map plus RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY env (`messaging/providers.ts:18-25`; `recruiter-message-email-provider.ts:25-29`).
- Fix: Build namespaced registry and provision all required IDs in deployment.

## G2-18-010-072  [P2] GAP  facet F23  effort M
- Legacy: Legacy recruiter sender company/college header always visible with external template (`TpoMailService.java:77-97`).
- vNext now: New digest has campaign-style provider-specified global From and optional reply token (`recruiter-message-email-provider.ts:40-50`).
- Fix: Restore college-specific inbox identity consistently across all recruiter email triggers.

## G2-20-010-006  [P2] MISSING  facet F03  effort S
- Legacy: Each message has sender and India-local formatted timestamp `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:125-143`
- vNext now: Only message body sent to template `src/modules/placements/recruiter-message-email-provider.ts:44-50`
- Fix: Include sender fallback and time formatted Asia/Kolkata in merge fields

## G2-20-010-007  [P2] MISSING  facet F03  effort S
- Legacy: Legacy fallback sender Campus Recruitment Team `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:129-135`
- vNext now: No sender label in message payload `src/modules/placements/recruiter-message-email-provider.ts:44-50`
- Fix: Supply exact fallback label for blank sender

## G2-20-010-009  [P2] GAP  facet F03  effort M
- Legacy: Branded college sender name ending Campus Recruitment `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:155-169`
- vNext now: Provider uses global config.fromName, not derived college name `src/modules/placements/recruiter-message-email-provider.ts:40-42`
- Fix: Supply verified college-specific sender name and safe header sanitation

## G2-20-010-010  [P2] MISSING  facet F04  effort S
- Legacy: Exact subject job company · job title, fallback your recruitment with us `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:110-112`
- vNext now: No jobTitle or subject merge field `src/modules/placements/recruiter-message-email-provider.ts:44-50`
- Fix: Restore subject variable and subject display in template

## G2-20-010-012  [P2] MISSING  facet F04  effort S
- Legacy: Earlier-message line reports how many unread messages are omitted `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:111-114`
- vNext now: Three excerpts but no earlier count or summary `src/modules/placements/recruiter-message-email-provider.ts:46-50`
- Fix: Add N earlier messages line with plural handling

## G2-20-010-035  [P2] MISSING  facet F12  effort S
- Legacy: Each email message timestamp rendered in Asia/Kolkata d MMM, h:mm a `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:39-40,138-143`
- vNext now: No timestamp merge field for messages `src/modules/placements/recruiter-message-email-provider.ts:44-50`
- Fix: Format IST timestamps explicitly in outbound merge text

## G2-20-010-041  [P2] GAP  facet F15  effort S
- Legacy: Nonprod recipient whitelist DEV_MAIL_ALLOW when stage!=prod `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:203-219`
- vNext now: Runtime recipient allowlist from messaging safety module `src/modules/placements/recruiter-message-email-provider.ts:21-23`
- Fix: Compare dev/staging safeguards; block real recipients when credentials point to dev

## G2-20-010-044  [P2] MISSING  facet F18  effort S
- Legacy: Exact subject and fallback sender/count/more strings present `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:106-136`
- vNext now: New strings not sent to template `src/modules/placements/recruiter-message-email-provider.ts:44-50`
- Fix: Restore exact strings, pluralization and readable timestamps

## G2-18-010-065  [P3] GAP  facet F20  effort S
- Legacy: Legacy `merge` iteration preserves insertion order and drops null when caller override (`TpoMailService.java:88-96,196-200`).
- vNext now: New digest fixed JSON merge object and safe escaped strings (`recruiter-message-email-provider.ts:44-50`).
- Fix: Prove Zepto merge order irrelevant and null keys have template-safe default.
