# Work packet: edit src/modules/messaging/model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/sms-service.md, docs/audit/gap2/lane-18/tpo-mail-service.md

## G2-15-012-012  [P1] GAP  facet F04  effort S
- Legacy: Name trim, strip {#...#}, default User, clamp 30 chars. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:103-107`)
- vNext now: New schema bounds whole variables, no 30-character name/sanitizer. (`src/modules/messaging/model.ts:9-27`)
- Fix: Reuse exact job name sanitizer before rendering approved DLT body.

## G2-18-010-052  [P1] GAP  facet F15  effort M
- Legacy: Legacy recruiters campaign unsubscribe and sender header per college via TpoEmailCampaignService (`TpoEmailCampaignService.java:50-110`).
- vNext now: New messaging batch supports SUPPRESSED for unsubscribed, requires policyFor set (`messaging/model.ts:59-80`; `messaging/service.ts:27-35`).
- Fix: Wire suppression repository to campaign sender, verify per-college unsubscribed and send preview.

## G2-18-010-029  [P2] GAP  facet F07  effort S
- Legacy: Legacy dev blocked address is FAILED (logged) (`TpoMailService.java:178-182`).
- vNext now: New delivery policy returns SUPPRESSED reason nonprod-not-allowlisted (`messaging/model.ts:59-68`; `messaging/service.ts:67-74`).
- Fix: Map statuses to operator wording without misreporting attempted send.
