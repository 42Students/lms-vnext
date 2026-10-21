# Work packet: edit src/modules/placements/recruiter-message-email-inbound-service.ts (part 2 of 2)

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u026-public-inbound-email-controller.md, docs/audit/gap2/lane-8/l13-u024-superadmin-inbound-mail-controller.md

## G2-5-026-051  [P1] GAP  facet F23  effort M
- Legacy: Legacy rejects with secret shared as constant-time bytes, can work cross-origin from Cloudflare. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:64-67`
- vNext now: vNext HMAC and same-origin requirement is stricter and incompatible with direct Cloudflare Worker call. `src/app/api/internal/placements/recruiter-message-inbound/route.ts:10-12`, `src/modules/placements/recruiter-message-email-inbound-service.ts:27-30`
- Fix: Create authenticated proxy/gateway and document origin headers.

## G2-13-024-041  [P1] GAP  facet F15  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicInboundEmailController.java:28-33 public signed worker receiver only accepts shared secret
- vNext now: src/modules/placements/recruiter-message-email-inbound-service.ts:1-55 alternate HMAC bridge; src/modules/inbound-mail/admin-service.ts:24-55 read-only inbox adapter
- Fix: Provide authenticated, deduplicated generic inbox ingest for all 42lms.com addresses, not recruiter replies alone

## G2-5-026-016  [P2] GAP  facet F07  effort M
- Legacy: Legacy text absent falls back from HTML via Jsoup. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:83-89,209-213`
- vNext now: vNext text is mandatory, no HTML conversion. `src/modules/placements/recruiter-message-email-inbound-service.ts:10-15,32-37`
- Fix: Accept verified HTML-only messages and convert safely to text.
