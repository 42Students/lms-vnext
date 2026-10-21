# Work packet (wave 2): edit src/modules/placements/recruiter-message-email-inbound-service.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/tpo-mail-service.md, docs/audit/gap2/lane-20/recruiter-message-email-service.md, docs/audit/gap2/lane-5/u026-public-inbound-email-controller.md

## G2-18-010-034  [P2] GAP  facet F09  effort M
- Legacy: Legacy recruiter digest includes Reply-To that resolves inbound conversation per thread (`TpoMailService.java:86-97`; `RecruiterMessageEmailService.java:110-116`).
- vNext now: New digest validates r-token Reply-To and vNext inbound HMAC+grant checks (`recruiter-message-email-provider.ts:29-44`; `recruiter-message-email-inbound-service.ts:21-40`).
- Fix: Test reply routing, old forwarded message alias compatibility and expired token UX.

## G2-20-010-028  [P2] GAP  facet F10  effort L
- Legacy: Inbound Cloudflare worker authenticates replies and writes conversation via service `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:22-33,74-124`
- vNext now: New inbound HMAC gateway route and scoped service writes messages `src/modules/placements/recruiter-message-email-inbound-service.ts:21-40,52-104`
- Fix: Wire real authenticated gateway, validate Cloudflare provider and DNS end to end

## G2-20-010-037  [P2] GAP  facet F13  effort M
- Legacy: Inbound failures recorded as status and preserved for operator follow-up `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:69-124`
- vNext now: Inbound unauthorized failures return generic forbidden with no stored failed-event row `src/modules/placements/recruiter-message-email-inbound-service.ts:27-40`
- Fix: Preserve privacy-safe failure audit and non-conversation mailbox workflow

## G2-20-010-049  [P2] GAP  facet F20  effort S
- Legacy: Legacy inbound statuses POSTED/NO_THREAD/WRONG_SENDER/NOT_VERIFIED/EMPTY/FAILED stored `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:69-124`
- vNext now: New inbound rejects with generic false and stores only accepted/replayed event `src/modules/placements/recruiter-message-email-inbound-service.ts:28-40,81-104`
- Fix: Add privacy-preserving operations counters/classified rejection audit

## G2-5-026-011  [P2] GAP  facet F06  effort M
- Legacy: Legacy Worker may submit envelope plus header sender, plain or HTML, authentication-results string. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:52-62`
- vNext now: vNext requires nonempty text and email values, no HTML body or auth data. `src/modules/placements/recruiter-message-email-inbound-service.ts:10-15`, `src/modules/placements/recruiter-mail-body-model.ts:1-3`
- Fix: Normalize provider webhook input server-side with original/header provenance.

## G2-5-026-013  [P2] GAP  facet F06  effort M
- Legacy: Legacy replied text truncated 4000 Unicode code units, stored unposted body up to 200000. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:90-91,215-218`
- vNext now: vNext raw text max20000, total HTTP bytes max20000; extracted reply helper trims message. `src/modules/placements/recruiter-message-email-inbound-service.ts:13-15,35-37`
- Fix: Test long/UTF-8/HTML-only submissions; preserve unposted full text in restricted inbox.

## G2-5-026-028  [P2] GAP  facet F12  effort M
- Legacy: Legacy other env replyTag is NOT_OURS, not stored, duplicate returns DUPLICATE. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:75-81`
- vNext now: vNext strict reply-domain and token shape, replay accepted:true,replayed:true. `src/modules/placements/recruiter-message-email-inbound-service.ts:35-40,81-86`
- Fix: Define environment routing and replay idempotence for worker retries.

## G2-5-026-033  [P2] GAP  facet F14  effort M
- Legacy: Legacy HTML accepted but only as fallback text; attachments not processed in service. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:52-62,209-213`
- vNext now: vNext text-only payload, no attachments. `src/modules/placements/recruiter-message-email-inbound-service.ts:10-15`, `src/modules/placements/recruiter-mail-body-model.ts:1-3`
- Fix: Provide HTML text extraction and document unsupported attachments.

## G2-5-026-044  [P2] GAP  facet F19  effort M
- Legacy: Legacy stores unposted body up to 200k chars; long messages truncated. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:215-218`
- vNext now: vNext 20k-byte hard body limit and 20k-char text max. `src/modules/placements/recruiter-message-email-inbound-service.ts:24-26`, `src/app/api/internal/placements/recruiter-message-inbound/route.ts:14-18`
- Fix: Set explicit worker dead-letter for too-large emails and notify ops.

## G2-5-026-045  [P2] GAP  facet F20  effort M
- Legacy: Legacy unique external_id makes duplicate Message-ID no-op. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:78-81`, `docs/legacy-source/backend/src/main/resources/db/migration/V224__inbound_email_from_cloudflare.sql:3-6`
- vNext now: vNext per-thread hash idempotency, unique event enforced per thread token. `src/modules/placements/recruiter-message-email-inbound-service.ts:81-86`
- Fix: Dedup general mail separately and prevent cross-tenant replay collisions.

## G2-5-026-050  [P2] GAP  facet F22  effort M
- Legacy: Legacy tpo_message_thread + recruiter mapped by token and messages.postEmailReply. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:91-123`
- vNext now: vNext thread state hash + mail-state expiry and placement_tpo_messages deliveryChannel=EMAIL. `src/modules/placements/recruiter-message-email-inbound-service.ts:55-103`
- Fix: Map existing 20hex reply tokens to 32hex without losing historical replies.
