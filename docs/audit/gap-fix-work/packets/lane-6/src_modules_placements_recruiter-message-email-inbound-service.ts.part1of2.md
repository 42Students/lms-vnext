# Work packet: edit src/modules/placements/recruiter-message-email-inbound-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u026-public-inbound-email-controller.md, docs/audit/gap2/lane-10/superadmin-inbound-mail.md, docs/audit/gap2/lane-18/tpo-mail-service.md

## G2-5-026-052  [P0] MISSING  facet F23  effort M
- Legacy: Legacy stores non-conversation and invalid replies for Super Admin. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:84-88,95-123`
- vNext now: vNext handles only accepted recruiter replies; table is not a writer. `src/modules/placements/recruiter-message-email-inbound-service.ts:27-51`, `src/db/schema/inbound-mail.ts:15-17`
- Fix: Build all-mail intake and failed-message recovery before declaring feature parity.

## G2-10-009-067  [P1] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicInboundEmailController.java:28-33` inbound public webhook requires X-Inbound-Secret constant-time verified in `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:64-67`
- vNext now: `src/modules/placements/recruiter-message-email-inbound-service.ts:21-34` separate HMAC inbound bridge with env gate
- Fix: Document secure worker/provider migration and uphold sender verification

## G2-10-009-074  [P1] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:101-122` only verified authorized recruiter thread reply becomes POSTED
- vNext now: `src/modules/placements/recruiter-message-email-inbound-service.ts:52-103` performs grant and sender checks for separate recruiter thread bridge, no inbox audit status result
- Fix: Persist reasons for rejected replies in inbox without exposing internal identifiers

## G2-10-009-085  [P1] GAP  facet F15  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:23-32` worker posts verified replies to recruiter conversations, logging routing outcome
- vNext now: `src/modules/placements/recruiter-message-email-inbound-service.ts:87-103` inserts EMAIL thread message and notifies TPO, but no inbox row
- Fix: Connect delivery outcome to Inbox while preserving TPO notification semantics

## G2-10-009-108  [P1] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:189-206` strips quoted text; stores whole failed reply and processed body separately
- vNext now: `src/modules/placements/recruiter-message-email-inbound-service.ts:36-37` extracts recruiter reply before acceptance; `src/db/schema/inbound-mail.ts:25` one bodyPlain only
- Fix: Persist original body separately from stripped text and routing outcome

## G2-10-009-113  [P1] GAP  facet F21  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicInboundEmailController.java:28-33` public webhook accepts inbound signed secret, calls service.receive
- vNext now: `src/modules/placements/recruiter-message-email-inbound-service.ts:21-35` separate HMAC-signed bridge accepts only recruiter thread replies
- Fix: Preserve catch-all inbound messages (non-recruiter/failed replies) and provider validation

## G2-10-009-114  [P1] GAP  facet F21  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:109-121` posts authorized replies into TpoMessagesService; unknown thread/sender recorded
- vNext now: `src/modules/placements/recruiter-message-email-inbound-service.ts:60-103` appends authenticated email to placement_tpo_messages, not inbound_mail_messages
- Fix: Link recruiter posting outcome to inbox read model without duplicate notifications

## G2-18-010-066  [P1] GAP  facet F21  effort L
- Legacy: Legacy integrates ZeptoMail, tenant-domain DB, Cloudflare replies via Worker (`TpoMailService.java:43-46,133-153,183-185`).
- vNext now: New ZeptoMail+OutboundFetch, HMAC authenticated inbound, tenant-domain schema but no recruiter URL helper (`recruiter-message-email-provider.ts:34-53`; `recruiter-message-email-inbound-service.ts:21-40`; `tenant-domains.ts:15-41`).
- Fix: Verify provider token/From DNS, Cloudflare HMAC webhook and tenant URL mapping.

## G2-5-026-005  [P1] GAP  facet F03  effort M
- Legacy: Legacy inbound DTO fields id,from,headerFrom,to,subject,auth,text,html. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:52-62`
- vNext now: vNext strict DTO from,to,text,providerMessageId; no headerFrom,subject,auth,html. `src/modules/placements/recruiter-message-email-inbound-service.ts:10-15`
- Fix: Preserve verified auth evidence and subject/HTML fallback through trusted gateway.

## G2-5-026-006  [P1] GAP  facet F03  effort M
- Legacy: Legacy exposes status outcomes POSTED/NO_THREAD/WRONG_SENDER/NOT_VERIFIED/EMPTY/ACCESS_ENDED/FAILED/STORED/NOT_OURS/DUPLICATE. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:69-73`
- vNext now: vNext returns accepted/replayed booleans, no reason classification. `src/app/api/internal/placements/recruiter-message-inbound/route.ts:19-23`, `src/modules/placements/recruiter-message-email-inbound-service.ts:16-39`
- Fix: Retain privacy-safe internal reason codes and operator dashboard without leaking to callers.

## G2-5-026-007  [P1] GAP  facet F04  effort M
- Legacy: Legacy distinguishes REPLY to conversation vs OTHER inbox mail, stores both. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:22-33,69-88`
- vNext now: vNext schema status NEW/TRIAGED/RESOLVED, separate recruiter message event table; no reply kind on inbox row. `src/db/schema/inbound-mail.ts:15-35`, `src/modules/placements/recruiter-message-email-inbound-service.ts:38-40`
- Fix: Map REPLY/OTHER and delivery outcome to durable result attributes.

## G2-5-026-009  [P1] GAP  facet F05  effort M
- Legacy: Legacy idempotency keyed external Message-ID across all inbound emails; missing ID gets synthetic no-id timestamp. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:74-81`
- vNext now: vNext hashes threadId+providerMessageId, no dedup for general incoming mail. `src/modules/placements/recruiter-message-email-inbound-service.ts:81-86`
- Fix: Define source-message idempotency for all mail and thread-scoped recruiter replies.

## G2-5-026-010  [P1] GAP  facet F05  effort M
- Legacy: Legacy finds thread by 20hex reply token and can report NO_THREAD. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:91-99`
- vNext now: vNext requires r-32hex recipient token and tokenHash with 90-day expiry. `src/modules/placements/recruiter-message-email-inbound-service.ts:38-40,55-59`
- Fix: Preserve legacy reply aliases or provide explicit migration/expiry policy.

## G2-5-026-012  [P1] GAP  facet F06  effort M
- Legacy: Legacy default replyTag r or dev rdev; route by tagged 20hex address. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:49-50,158-165`
- vNext now: vNext target uses r-32hex and configured reply domain. `src/modules/placements/recruiter-message-email-inbound-service.ts:35-40`
- Fix: Configure prod/dev mailbox aliases and stop silent lost legacy replies.

## G2-5-026-015  [P1] GAP  facet F07  effort M
- Legacy: Legacy wrong From vs recruiter address or DMARC fail/unchecked SPF/DKIM yields WRONG_SENDER/NOT_VERIFIED. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:102-107,176-186`
- vNext now: vNext checks exact user email and signed gateway; assumes gateway authenticated provider. `src/modules/placements/recruiter-message-email-inbound-service.ts:60-80`
- Fix: Gateway MUST verify source delivery/authentication-results before HMAC signing.

## G2-5-026-017  [P1] GAP  facet F07  effort M
- Legacy: Legacy postEmailReply reports ACCESS_ENDED vs FAILED and stores rejected raw email. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:108-118`
- vNext now: vNext rejected grant/thread returns accepted:false, no stored failed-inbox record. `src/modules/placements/recruiter-message-email-inbound-service.ts:58-80`, `src/app/api/internal/placements/recruiter-message-inbound/route.ts:19-25`
- Fix: Record restricted failure reason/message for recovery and triage.

## G2-5-026-022  [P1] GAP  facet F10  effort M
- Legacy: Legacy INSERT IGNORE inbound_email with FAILED placeholder before checking token/sender. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:74-88`
- vNext now: vNext writes only accepted recruiter reply event and message in transaction. `src/modules/placements/recruiter-message-email-inbound-service.ts:44-59,81-103`
- Fix: Write every received mail to quarantined event before dispatch, with retention policy.

## G2-5-026-031  [P1] GAP  facet F13  effort M
- Legacy: Legacy every email status recorded, enabling retry/triage for error cases. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:74-88,95-123`
- vNext now: vNext malformed/denied payload returns 403/503 and is not in inbox. `src/app/api/internal/placements/recruiter-message-inbound/route.ts:19-25`, `src/modules/placements/recruiter-message-email-inbound-service.ts:27-51`
- Fix: Add privacy-safe rejected-event diagnostics and manual recovery path.

## G2-5-026-035  [P1] GAP  facet F15  effort M
- Legacy: Legacy successful recruiter replies posted to recruiter thread; nonreply surfaced to Super Admin. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:23-32`
- vNext now: vNext accepted replies notify TPO; inbox list unconnected to webhook. `src/modules/placements/recruiter-message-email-inbound-service.ts:87-103`, `src/modules/inbound-mail/admin-service.ts:57-69`
- Fix: Add operator inbox event and meaningful reply notifications together.

## G2-5-026-047  [P1] GAP  facet F21  effort M
- Legacy: Legacy Cloudflare Email Routing Worker stores mail 30 days in Cloudflare D1 and sends provider-signed payload. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:22-27`
- vNext now: vNext route requires a separate upstream gateway to verify provider then HMAC-sign. `src/app/api/internal/placements/recruiter-message-inbound/route.ts:6-8`, `src/modules/placements/recruiter-message-email-inbound-service.ts:17-19`
- Fix: Implement/configure gateway, rotation and webhook observability.
