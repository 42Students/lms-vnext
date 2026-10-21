# Work packet: edit src/modules/messaging/tpo-campaign-recipient-token.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/public-campaign-unsubscribe-controller.md

## G2-10-026-035  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:123-137 — Used/unknown token does nothing and caller reports success.
- vNext now: src/modules/messaging/tpo-campaign-recipient-token.ts:69-75; src/modules/messaging/tpo-campaign-unsubscribe-service.ts:90-93 — ALREADY succeeds; DENY throws invalid.
- Fix: Align intentional idempotent privacy contract.

## G2-10-026-045  [P1] GAP  facet F15  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:70-110 — Sender embeds unique token in email.
- vNext now: src/modules/messaging/tpo-campaign-recipient-token.ts:29-55 — Purpose-signed token identifies recipient.
- Fix: Confirm new dispatcher issues signed tokens to old-compatible page.
