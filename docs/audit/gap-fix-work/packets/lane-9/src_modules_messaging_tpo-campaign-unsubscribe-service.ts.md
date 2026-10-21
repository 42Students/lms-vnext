# Work packet: edit src/modules/messaging/tpo-campaign-unsubscribe-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u014-email-suppression-repository.md, docs/audit/gap2/lane-10/public-campaign-unsubscribe-controller.md

## G2-18-014-017  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:123-136 — campaign opt-out updates lead, logs activity and rings TPO bell.
- vNext now: src/modules/messaging/tpo-campaign-unsubscribe-service.ts:39-95 — adds recipient/lead changes and TPO activity/notification; source global suppression repository not used here.
- Fix: Make global and lead-local opt-out policies explicit and checked for all delivery routes.

## G2-10-026-012  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:127-133 — SHA256 token hash resolves first lead.
- vNext now: src/modules/messaging/tpo-campaign-unsubscribe-service.ts:29-55 — Signed UUID recipient+college+campaign, updates two entities.
- Fix: Migrate legacy hash records or support links until retired.

## G2-10-026-019  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:125-131 — Unknown/used token treated as no-op success.
- vNext now: src/app/api/public/campaign-unsubscribe/route.ts:30-37; src/modules/messaging/tpo-campaign-unsubscribe-service.ts:90-93 — Unknown signed token returns400.
- Fix: Evaluate privacy-safe idempotence for bogus links.

## G2-10-026-029  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:127-135 — SHA256 lookup, lead save, bell activity.
- vNext now: src/modules/messaging/tpo-campaign-unsubscribe-service.ts:29-93 — Signed recipient+transaction+event, different data contract.
- Fix: Translate legacy campaign recipient storage.

## G2-10-026-035  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:123-137 — Used/unknown token does nothing and caller reports success.
- vNext now: src/modules/messaging/tpo-campaign-recipient-token.ts:69-75; src/modules/messaging/tpo-campaign-unsubscribe-service.ts:90-93 — ALREADY succeeds; DENY throws invalid.
- Fix: Align intentional idempotent privacy contract.

## G2-10-026-068  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:108-110,127-129 — Recipient rows have SHA256 unsubscribe token hash, lead ID.
- vNext now: src/modules/messaging/tpo-campaign-unsubscribe-service.ts:30-55; src/db/schema/tpo-crm.ts:61-61 — Recipient UUID and lead unsubscribedAt, signed proof.
- Fix: Support legacy hash-token migration.
