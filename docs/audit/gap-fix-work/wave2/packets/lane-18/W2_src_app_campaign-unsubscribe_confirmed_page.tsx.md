# Work packet (wave 2): edit src/app/campaign-unsubscribe/confirmed/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/public-campaign-unsubscribe-controller.md

## G2-10-026-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:17-17 — Success on original page without URL change.
- vNext now: src/app/campaign-unsubscribe/confirmed/page.tsx:6-20; src/app/api/public/campaign-unsubscribe/route.ts:28-29 — 303 redirects to /campaign-unsubscribe/confirmed.
- Fix: Preserve same-page success state where legacy links expect it.

## G2-10-026-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:17-17 — Success Ant Result inside Card.
- vNext now: src/app/campaign-unsubscribe/confirmed/page.tsx:11-22 — Text-only success Card plus Return home.
- Fix: Restore Result icon/layout.

## G2-10-026-008  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:17-17 — Green success Result icon.
- vNext now: src/app/campaign-unsubscribe/confirmed/page.tsx:14-20 — No success icon.
- Fix: Show success icon and accessible status.

## G2-10-026-050  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:17-17 — Success icon/text centered.
- vNext now: src/app/campaign-unsubscribe/confirmed/page.tsx:11-22 — Text-only layout.
- Fix: Restore icon/success spacing.

## G2-10-026-053  [P3] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:17-17 — Result icon conveys success.
- vNext now: src/app/campaign-unsubscribe/confirmed/page.tsx:14-18 — Role status text without icon.
- Fix: Restore icon with text.
