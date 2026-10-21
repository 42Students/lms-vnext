# Work packet (wave 2): edit src/components/placements/campaign-unsubscribe-confirm.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/campaign-unsubscribe-token.md, docs/audit/gap2/lane-10/public-campaign-unsubscribe-controller.md, docs/audit/gap2/lane-20/shared-public-pages.md

## G2-1-025-008  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:23-29: AntD primary 'Unsubscribe' loading, disabled if token missing or busy.
- vNext now: src/components/placements/campaign-unsubscribe-confirm.tsx:33-35: Button 'Unsubscribe' for cell, pending 'Saving…'; disabled pending not explicit prop.
- Fix: Disable button while pending to avoid repeated keyboard submit; ref lock already exists.

## G2-1-025-016  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:23: disabled when token null or busy; click triggers POST.
- vNext now: src/components/placements/campaign-unsubscribe-confirm.tsx:12-22: onSubmit guarded by pendingRef; submit button loads, not explicitly disabled.
- Fix: Add disabled={pending} to submit control and consistent aria-busy.

## G2-1-025-054  [P2] GAP  facet F23  effort S
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:17: same page renders AntD success Result.
- vNext now: src/components/placements/campaign-unsubscribe-confirm.tsx:23-27: standalone confirmation redirect.
- Fix: Match completed-state visual hierarchy and text on confirmed route.

## G2-10-026-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:20-29 — Title/body/error/CTA within one Card.
- vNext now: src/app/campaign-unsubscribe/[token]/page.tsx:24-43; src/components/placements/campaign-unsubscribe-confirm.tsx:31-35 — Heading outside Card; CTA nested in Card.
- Fix: Recreate original component nesting.

## G2-10-026-016  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:9-10,23-29 — Token read from route; button disabled when no token/busy.
- vNext now: src/components/placements/campaign-unsubscribe-confirm.tsx:19-22,31-35 — Hidden FormData token, disabled pending; invalid preview blocks form.
- Fix: Preserve missing-token disabled affordance.

## G2-10-026-017  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:23-29 — Request sends token in URL path, no form payload.
- vNext now: src/components/placements/campaign-unsubscribe-confirm.tsx:19-22 — POST multipart FormData token.
- Fix: Keep old client method via endpoint alias.

## G2-20-031-064  [P2] GAP  facet F13  effort M
- Legacy: Legacy unsubscribe post failure keeps button and error; success shows result immediately (`docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:17-29`)
- vNext now: New error remains form; success redirect depends on expected 303 URL check (`src/components/placements/campaign-unsubscribe-confirm.tsx:12-36`)
- Fix: Verify confirmed redirect URL across host prefixes and network proxies; no false success

## G2-1-025-032  [P3] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:11,23: busy loading on Button, no text change.
- vNext now: src/components/placements/campaign-unsubscribe-confirm.tsx:33-35: loading plus button label 'Saving…'.
- Fix: Match button wording while preserving accessible progress.

## G2-1-025-039  [P3] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:23: AntD primary button natural width.
- vNext now: src/components/placements/campaign-unsubscribe-confirm.tsx:33-35: full-width mobile button, inline desktop.
- Fix: If pixel target is literal, use natural-width at mobile too.

## G2-10-026-009  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:23-29 — Natural-width primary Unsubscribe Button.
- vNext now: src/components/placements/campaign-unsubscribe-confirm.tsx:33-35 — Full width on mobile, label Saving… while pending.
- Fix: Match widths and spinner behavior.

## G2-10-026-018  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:23-29 — Spinner while text remains Unsubscribe.
- vNext now: src/components/placements/campaign-unsubscribe-confirm.tsx:34-35 — Text changes to Saving….
- Fix: Keep action label visible with spinner.

## G2-10-026-049  [P3] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:23-29 — Natural-width CTA.
- vNext now: src/components/placements/campaign-unsubscribe-confirm.tsx:33-35 — Full-width CTA mobile.
- Fix: Match width/44px tap target.

## G2-10-026-055  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:28-29 — Button label Unsubscribe.
- vNext now: src/components/placements/campaign-unsubscribe-confirm.tsx:34-35 — Unsubscribe except pending Saving….
- Fix: Keep label while busy.
