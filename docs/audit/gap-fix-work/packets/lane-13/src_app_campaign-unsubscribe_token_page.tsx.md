# Work packet: edit src/app/campaign-unsubscribe/[token]/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/public-campaign-unsubscribe-controller.md, docs/audit/gap2/lane-17/email-suppression-entity.md

## G2-10-026-022  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:18-31 — GET never indicates token invalid before POST.
- vNext now: src/app/campaign-unsubscribe/[token]/page.tsx:30-33 — GET reveals invalid/expired token.
- Fix: Review validity-oracle privacy and messaging.

## G2-10-026-072  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicCampaignUnsubscribeController.java:12-27 — Legacy always says unsubscribed.
- vNext now: src/app/campaign-unsubscribe/[token]/page.tsx:30-33; src/app/api/public/campaign-unsubscribe/route.ts:30-37 — New invalid/expired response.
- Fix: Reconcile privacy guarantee.

## G2-17-015-016  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:17-17 — Success `You're unsubscribed`, `This placement cell will not email you again.`
- vNext now: src/app/campaign-unsubscribe/[token]/page.tsx:23-42 — POST redirects to confirmed page; initial page has differing global text.
- Fix: Verify confirmed page mirrors exact placement-cell success copy.
