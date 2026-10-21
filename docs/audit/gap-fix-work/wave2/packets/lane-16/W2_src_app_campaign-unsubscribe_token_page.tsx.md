# Work packet (wave 2): edit src/app/campaign-unsubscribe/[token]/page.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/campaign-unsubscribe-token.md, docs/audit/gap2/lane-10/public-campaign-unsubscribe-controller.md, docs/audit/gap2/lane-17/email-suppression-entity.md, docs/audit/gap2/lane-20/shared-public-pages.md

## G2-1-025-003  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:13-15: center in 100vh on #f5f7f9, padding16px; 440px max white AntD Card.
- vNext now: src/app/campaign-unsubscribe/[token]/page.tsx:23: max-w-xl, top padding24/96px, branded auth background, separate PageHeader.
- Fix: Match centered 440px legacy card, background and spacing for placement-cell tokens.

## G2-1-025-004  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:20-29: title, secondary description, optional error, primary action in one Card.
- vNext now: src/app/campaign-unsubscribe/[token]/page.tsx:24,35-43: PageHeader outside Card, second heading only for global token, description then form.
- Fix: Move placement-cell title inside card or document approved page-head variance.

## G2-1-025-006  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:20: AntD H4 'Stop these emails?' top margin 0.
- vNext now: src/app/campaign-unsubscribe/[token]/page.tsx:24: PageHeader title for placement-cell token.
- Fix: Align actual heading level and typography.

## G2-1-025-038  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:13-14: flex-centered 440px Card with padding16, viewport min-height100vh.
- vNext now: src/app/campaign-unsubscribe/[token]/page.tsx:23: full viewport, max-w-xl, px-4, pt-24; md gap/py changes.
- Fix: Match legacy center/width at mobile and desktop.

## G2-10-026-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:12-15 — Viewport-centered #f5f7f9 Card, max440px, padding16.
- vNext now: src/app/campaign-unsubscribe/[token]/page.tsx:23-24 — max-w-xl flex layout with top24 and heading outside Card.
- Fix: Clone original centered 440px Card.

## G2-10-026-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:20-29 — Title/body/error/CTA within one Card.
- vNext now: src/app/campaign-unsubscribe/[token]/page.tsx:24-43; src/components/placements/campaign-unsubscribe-confirm.tsx:31-35 — Heading outside Card; CTA nested in Card.
- Fix: Recreate original component nesting.

## G2-10-026-041  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:18-31 — Page always asks even for stale token.
- vNext now: src/app/campaign-unsubscribe/[token]/page.tsx:30-34 — Invalid/expired state before submit.
- Fix: Avoid misleading claims while preserving privacy.

## G2-10-026-048  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:12-15 — Centered 440px Card viewport with padding16.
- vNext now: src/app/campaign-unsubscribe/[token]/page.tsx:23-23 — Max-w-xl and top padding24.
- Fix: Match 440px centered layout.

## G2-17-015-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:6-10 — Unsubscribe page GET has ask/done/error state; token in URL.
- vNext now: src/app/campaign-unsubscribe/[token]/page.tsx:8-21 — Server checks token purpose, renders different global/college copy.
- Fix: Preserve legacy placement-cell page while safely supporting global policy.

## G2-17-015-004  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:12-16 — Centered 440px AntD card light-grey background.
- vNext now: src/app/campaign-unsubscribe/[token]/page.tsx:23-24 — max-w-xl and PageHeader/public auth styling.
- Fix: Match legacy centered width, padding and card hierarchy.

## G2-20-031-074  [P2] GAP  facet F16  effort S
- Legacy: Legacy unsubscribe/recruiter background #f5f7f9 and centered card max440 (`docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:12-16`, `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:119-123`)
- vNext now: New public auth skin with max-w-xl or max-w-md and pt24 for unsubscribe (`src/app/campaign-unsubscribe/[token]/page.tsx:23-45`, `src/components/tpo/recruiter-invite-landing.tsx:126-132`)
- Fix: Match card positioning and canvas background

## G2-10-026-007  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:3-3,20-21 — Typography.Title level4 and secondary description.
- vNext now: src/app/campaign-unsubscribe/[token]/page.tsx:24-40 — PageHeader eyebrow and small prose.
- Fix: Match legacy heading font and secondary text.

## G2-17-015-006  [P3] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:20-29 — Unsubscribe button and text `Stop these emails?`.
- vNext now: src/app/campaign-unsubscribe/[token]/page.tsx:24-42 — Placement-cell variant keeps title; global variant `Campaign email preferences`.
- Fix: Keep context-specific title and CTA copy.
