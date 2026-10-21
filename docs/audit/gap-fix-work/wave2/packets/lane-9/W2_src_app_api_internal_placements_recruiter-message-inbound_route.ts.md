# Work packet (wave 2): edit src/app/api/internal/placements/recruiter-message-inbound/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u026-public-inbound-email-controller.md

## G2-5-026-036  [P2] GAP  facet F15  effort M
- Legacy: Legacy failures retained for manual follow-up rather than replying automatically. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:95-123`
- vNext now: vNext inbox UI says no automatic replies, but failed recruiter reply unretained. `src/app/(authenticated)/admin/inbound-mail/page.tsx:16-19`, `src/app/api/internal/placements/recruiter-message-inbound/route.ts:19-25`
- Fix: Preserve no-auto-reply and manual failure triage.

## G2-5-026-041  [P2] GAP  facet F18  effort M
- Legacy: Legacy outcome enum includes POSTED/STORED/NOT_OURS/DUPLICATE for logs. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:69-73`
- vNext now: vNext uses accepted/replayed and generic FORBIDDEN/SERVICE_UNAVAILABLE. `src/app/api/internal/placements/recruiter-message-inbound/route.ts:19-25`
- Fix: Keep operator-readable outcome names and guidance.

## G2-5-026-044  [P2] GAP  facet F19  effort M
- Legacy: Legacy stores unposted body up to 200k chars; long messages truncated. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:215-218`
- vNext now: vNext 20k-byte hard body limit and 20k-char text max. `src/modules/placements/recruiter-message-email-inbound-service.ts:24-26`, `src/app/api/internal/placements/recruiter-message-inbound/route.ts:14-18`
- Fix: Set explicit worker dead-letter for too-large emails and notify ops.
