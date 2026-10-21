# Work packet: edit src/app/api/public/campaign-unsubscribe/route.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u014-email-suppression-repository.md, docs/audit/gap2/lane-10/public-campaign-unsubscribe-controller.md, docs/audit/gap2/lane-17/email-suppression-entity.md

## G2-18-014-024  [P1] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V161__tpo_v1_drives.sql:345-349 — repository SQL row can be queried once migration ran.
- vNext now: src/app/api/public/campaign-unsubscribe/route.ts:39-40 — returns SUPPRESSIONS_NOT_READY 503 if global table absent.
- Fix: Provide safe unavailable-state UI, do not accept but forget unsubscribe.

## G2-10-026-001  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicCampaignUnsubscribeController.java:12-26 — POST /api/v1/public/campaign-unsubscribe/{token}, path-bound token.
- vNext now: src/app/api/public/campaign-unsubscribe/route.ts:10-25 — POST /api/public/campaign-unsubscribe, token in FormData.
- Fix: Add compatibility adapter and migrate all emailed URLs.

## G2-10-026-010  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicCampaignUnsubscribeController.java:23-27 — JSON {status:UNSUBSCRIBED}, HTTP200 even unknown/used.
- vNext now: src/app/api/public/campaign-unsubscribe/route.ts:25-47 — 303 on valid; 400 on invalid.
- Fix: Align legacy client contract or negotiate response.

## G2-10-026-019  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:125-131 — Unknown/used token treated as no-op success.
- vNext now: src/app/api/public/campaign-unsubscribe/route.ts:30-37; src/modules/messaging/tpo-campaign-unsubscribe-service.ts:90-93 — Unknown signed token returns400.
- Fix: Evaluate privacy-safe idempotence for bogus links.

## G2-10-026-028  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/api/Services/TpoService.js:132-133; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicCampaignUnsubscribeController.java:23-26 — Axios POST path token and JSON200.
- vNext now: src/app/api/public/campaign-unsubscribe/route.ts:10-49 — FormData POST and303.
- Fix: Audit callers and provide backwards-compatible route.

## G2-10-026-072  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicCampaignUnsubscribeController.java:12-27 — Legacy always says unsubscribed.
- vNext now: src/app/campaign-unsubscribe/[token]/page.tsx:30-33; src/app/api/public/campaign-unsubscribe/route.ts:30-37 — New invalid/expired response.
- Fix: Reconcile privacy guarantee.

## G2-17-015-022  [P1] GAP  facet F10  effort L
- Legacy: src/modules/messaging/tpo-campaign-unsubscribe-service.ts:29-55 — TPO recipient unsubscribe persists lead and recipient flags.
- vNext now: src/app/api/public/campaign-unsubscribe/route.ts:25-35 — Placement-cell token takes separate path before global HMAC.
- Fix: Clarify recipient-scoped unsubscribe vs global email suppression; ensure no bypass across colleges.

## G2-10-026-024  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicCampaignUnsubscribeController.java:26-26 — JSON success even used token.
- vNext now: src/app/api/public/campaign-unsubscribe/route.ts:28-29,47-47 — Redirect rather than JSON.
- Fix: Preserve success response for API callers.

## G2-17-015-013  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:22-22 — On POST error shows `That didn't work. Please try again.`
- vNext now: src/app/api/public/campaign-unsubscribe/route.ts:15-18 — Invalid body returns INVALID_OR_EXPIRED_LINK JSON status400/413.
- Fix: Render safe error copy and Retry on public screen.
