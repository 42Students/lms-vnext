# Work packet: edit src/app/api/internal/placements/recruiter-message-inbound/route.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u026-public-inbound-email-controller.md

## G2-5-026-001  [P1] GAP  facet F01  effort M
- Legacy: Legacy hidden public URL POST `/api/v1/public/inbound-email`, called by Cloudflare Email Worker. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicInboundEmailController.java:14-20,28-33`
- vNext now: vNext internal POST `/api/internal/placements/recruiter-message-inbound` and requires same origin plus HMAC. `src/app/api/internal/placements/recruiter-message-inbound/route.ts:5-23`
- Fix: Document and deploy authenticated Cloudflare gateway adapter and worker target rewrite.

## G2-5-026-006  [P1] GAP  facet F03  effort M
- Legacy: Legacy exposes status outcomes POSTED/NO_THREAD/WRONG_SENDER/NOT_VERIFIED/EMPTY/ACCESS_ENDED/FAILED/STORED/NOT_OURS/DUPLICATE. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:69-73`
- vNext now: vNext returns accepted/replayed booleans, no reason classification. `src/app/api/internal/placements/recruiter-message-inbound/route.ts:19-23`, `src/modules/placements/recruiter-message-email-inbound-service.ts:16-39`
- Fix: Retain privacy-safe internal reason codes and operator dashboard without leaking to callers.

## G2-5-026-017  [P1] GAP  facet F07  effort M
- Legacy: Legacy postEmailReply reports ACCESS_ENDED vs FAILED and stores rejected raw email. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:108-118`
- vNext now: vNext rejected grant/thread returns accepted:false, no stored failed-inbox record. `src/modules/placements/recruiter-message-email-inbound-service.ts:58-80`, `src/app/api/internal/placements/recruiter-message-inbound/route.ts:19-25`
- Fix: Record restricted failure reason/message for recovery and triage.

## G2-5-026-019  [P1] MISSING  facet F08  effort M
- Legacy: Legacy OTHER mail always status STORED when inserted. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:69-88`
- vNext now: vNext has no STORED signal or other-mail intake path. `src/app/api/internal/placements/recruiter-message-inbound/route.ts:19-25`
- Fix: Return successful general-mail persistence receipt.

## G2-5-026-031  [P1] GAP  facet F13  effort M
- Legacy: Legacy every email status recorded, enabling retry/triage for error cases. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:74-88,95-123`
- vNext now: vNext malformed/denied payload returns 403/503 and is not in inbox. `src/app/api/internal/placements/recruiter-message-inbound/route.ts:19-25`, `src/modules/placements/recruiter-message-email-inbound-service.ts:27-51`
- Fix: Add privacy-safe rejected-event diagnostics and manual recovery path.

## G2-5-026-047  [P1] GAP  facet F21  effort M
- Legacy: Legacy Cloudflare Email Routing Worker stores mail 30 days in Cloudflare D1 and sends provider-signed payload. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:22-27`
- vNext now: vNext route requires a separate upstream gateway to verify provider then HMAC-sign. `src/app/api/internal/placements/recruiter-message-inbound/route.ts:6-8`, `src/modules/placements/recruiter-message-email-inbound-service.ts:17-19`
- Fix: Implement/configure gateway, rotation and webhook observability.

## G2-5-026-051  [P1] GAP  facet F23  effort M
- Legacy: Legacy rejects with secret shared as constant-time bytes, can work cross-origin from Cloudflare. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:64-67`
- vNext now: vNext HMAC and same-origin requirement is stricter and incompatible with direct Cloudflare Worker call. `src/app/api/internal/placements/recruiter-message-inbound/route.ts:10-12`, `src/modules/placements/recruiter-message-email-inbound-service.ts:27-30`
- Fix: Create authenticated proxy/gateway and document origin headers.

## G2-5-026-014  [P2] GAP  facet F07  effort M
- Legacy: Legacy missing/invalid X-Inbound-Secret returns 404 indistinguishable from missing path. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicInboundEmailController.java:29-32`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:64-67`
- vNext now: vNext 403 FORBIDDEN for missing origin/HMAC and 503 for exceptions. `src/app/api/internal/placements/recruiter-message-inbound/route.ts:10-12,19-25`
- Fix: Decide 404 concealment compatibility and avoid identifying hidden webhook.

## G2-5-026-018  [P2] GAP  facet F08  effort M
- Legacy: Legacy response HTTP200 `{status: POSTED
- vNext now: vNext accepted true/replayed bool HTTP200, rejected HTTP403, service fail HTTP503. `src/app/api/internal/placements/recruiter-message-inbound/route.ts:19-25`
- Fix: Update worker ACK/retry policy for statuses and 4xx/5xx distinction.
