# Work packet: edit src/app/(authenticated)/learn/my-placements/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u005-learner-placements-home.md

## G2-18-005-022  [P1] GAP  facet F04  effort M
- Legacy: Legacy placed message `You're placed with COMPANY` and eligible to still apply. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:59-61`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:90-91`
- vNext now: vNext HeroPriority relies accepted offer flag and expired offer priority. `src/app/(authenticated)/learn/my-placements/page.tsx:267-268`, `src/components/placements/learner-placements-dashboard.tsx:57-60`
- Fix: Ensure accepted-offer or hired status produces placed state after higher urgency, with exact CTA.

## G2-18-005-052  [P1] GAP  facet F11  effort M
- Legacy: Legacy acceptance may mark placed only if countsAsPlaced not false/0. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:58-61`
- vNext now: vNext `acceptedOffer` true for any ACCEPTED offer. `src/app/(authenticated)/learn/my-placements/page.tsx:267-268`
- Fix: Apply countsAsPlaced rule before placed-state banner, avoid false placed label.

## G2-18-005-082  [P1] GAP  facet F20  effort S
- Legacy: Legacy offered `countsAsPlaced=false` excluded from placed state. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:58-61`
- vNext now: vNext any ACCEPTED offer boolean used. `src/app/(authenticated)/learn/my-placements/page.tsx:267-268`
- Fix: Gate by `countsAsPlaced`, eliminate false placed state.

## G2-18-005-087  [P1] GAP  facet F22  effort M
- Legacy: Legacy offers RELEASED/ACCEPTED and countsAsPlaced flags. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:58-60`
- vNext now: vNext offer statuses ISSUED/ACCEPTED and acceptedOffer boolean. `src/modules/placements/learner-dashboard-model.ts:110-158`, `src/app/(authenticated)/learn/my-placements/page.tsx:267-268`
- Fix: Maintain status transition and placement eligibility equivalence.

## G2-18-005-034  [P2] GAP  facet F07  effort M
- Legacy: Legacy journey/overview failure full error `We could not load your placements` + safe-data reassurance + Retry. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:107-112`, `docs/legacy-source/frontend/src/components/Placements/student/useJourney.js:18-41`
- vNext now: vNext Promise.allSettled partial alert and 8 source availability map; individual sections partial. `src/app/(authenticated)/learn/my-placements/page.tsx:69-92`, `src/app/(authenticated)/learn/my-placements/page.tsx:266-268`
- Fix: Use full error only if essential source combination unavailable; match reassurance/retry.

## G2-18-005-038  [P2] GAP  facet F07  effort S
- Legacy: Legacy schedule unavailable only as part of whole journey failure. `docs/legacy-source/frontend/src/components/Placements/student/useJourney.js:18-35`
- vNext now: vNext dashboard events depend journeyRead, firstWeek null, warnings. `src/app/(authenticated)/learn/my-placements/page.tsx:69-91`, `src/components/placements/learner-placements-dashboard.tsx:57-73`
- Fix: Show schedule-specific unknown without `No events` if journey fails.

## G2-18-005-039  [P2] GAP  facet F08  effort S
- Legacy: Legacy retry button text `Retry` on error. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:107-111`
- vNext now: vNext placement PartialAlert gives source statuses but not same full-page Retry. `src/app/(authenticated)/learn/my-placements/page.tsx:266-267`
- Fix: Expose Retry on overall fallback via router.refresh and keep other loaded sections.

## G2-18-005-036  [P3] GAP  facet F07  effort S
- Legacy: Legacy no learner role redirects `/`. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:36-36`
- vNext now: vNext non-LEARNER redirects `/dashboard`. `src/app/(authenticated)/learn/my-placements/page.tsx:60-62`
- Fix: Make unauthorized route outcome intentional and consistent with other learner pages.
