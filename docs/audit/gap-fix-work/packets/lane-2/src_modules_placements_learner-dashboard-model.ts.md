# Work packet: edit src/modules/placements/learner-dashboard-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u005-learner-placements-home.md

## G2-18-005-004  [P1] GAP  facet F01  effort M
- Legacy: Legacy CTA links `/learn/my-placements/placement`, `/offers`, `/schedule`, `/jobs`, `/applications`. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:73-97`
- vNext now: vNext uses `/offers`, `/interviews`, `/assessments`, applications and registration anchors. `src/components/placements/learner-placements-dashboard.tsx:74-130`, `src/modules/placements/learner-dashboard-model.ts:75-90`
- Fix: Preserve compatibility aliases from legacy `schedule`, `placement` and job slug links.

## G2-18-005-023  [P1] GAP  facet F05  effort M
- Legacy: Legacy prioritizes open released offers first, then registration, then earliest future event, then placed, open drives, opted-out, caught-up. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:80-98`
- vNext now: vNext HeroPriority model plus dashboard nextAction computes urgent expiring offer <=24h and week events. `src/modules/placements/learner-dashboard-model.ts:104-132`, `src/components/placements/learner-placements-dashboard.tsx:57-60`
- Fix: Match precedence for *all* released offers and registration, not only expiring <=24h.

## G2-18-005-024  [P1] GAP  facet F05  effort M
- Legacy: Legacy open offers status `RELEASED` in journey. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:58-60`
- vNext now: vNext pending offer checks `ISSUED` and expiry, different status vocabulary. `src/modules/placements/learner-dashboard-model.ts:110-118`, `src/modules/placements/learner-dashboard-model.ts:152-158`
- Fix: Map status RELEASED→ISSUED and ensure issued but not expiring still gets hero.

## G2-18-005-053  [P1] GAP  facet F12  effort L
- Legacy: Legacy offer released > registration > nearest event > placed > eligible drives > opted-out > all-caught-up. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:80-98`
- vNext now: vNext priority model focuses expiring offers, next scheduled event then initial state. `src/modules/placements/learner-dashboard-model.ts:104-132`
- Fix: Align full priority state machine and presence of nonurgent offers.

## G2-18-005-054  [P1] GAP  facet F12  effort M
- Legacy: Legacy pending move request suppresses confirm todo. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:65-76`
- vNext now: vNext attention event list doesn't encode move-request pending in dashboard model. `src/modules/placements/learner-dashboard-model.ts:66-106`, `src/modules/placements/learner-waiting-on-you-model.ts:1-100`
- Fix: Feed pending move requests to waiting model to avoid invalid Confirm action.

## G2-18-005-087  [P1] GAP  facet F22  effort M
- Legacy: Legacy offers RELEASED/ACCEPTED and countsAsPlaced flags. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:58-60`
- vNext now: vNext offer statuses ISSUED/ACCEPTED and acceptedOffer boolean. `src/modules/placements/learner-dashboard-model.ts:110-158`, `src/app/(authenticated)/learn/my-placements/page.tsx:267-268`
- Fix: Maintain status transition and placement eligibility equivalence.
