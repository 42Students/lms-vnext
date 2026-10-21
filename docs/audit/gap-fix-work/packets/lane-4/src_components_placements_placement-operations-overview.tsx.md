# Work packet: edit src/components/placements/placement-operations-overview.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-index.md, docs/audit/gap2/lane-11/l17-u030-drives-landing.md

## G2-10-017-006  [P1] GAP  facet F02  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:41-45,246-265 — Legacy overview metrics, policy, short attention queue, then active drive cards, retention and inline student lookup.
- vNext now: src/components/placements/placement-operations-overview.tsx:37-110 — New 2 metric strips, attention, season funnel, rounds, quick search, job portfolio and optional disclosures; no card grid.
- Fix: Restore legacy section order and four-column active card grid.

## G2-10-017-026  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:251-257 — Top counts activeTotal/allTotal and needs attention from dedicated endpoints.
- vNext now: src/components/placements/placement-operations-overview.tsx:37-48 — Top new metrics from normalized jobs and queue, different definitions.
- Fix: Create accurate mapping; do not claim same 'needs attention' from distinct aggregation.

## G2-10-017-028  [P1] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:74-88 — Extend deadline modal updates same Important Dates application deadline, default +7 days end of day.
- vNext now: src/components/placements/placement-operations-overview.tsx:85-110 — No card-level shortcut; requires opening drive then settings.
- Fix: Add Extend deadline menu using existing validated service.

## G2-10-017-054  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:251-257,211-214 — Needs attention count is sum of affected category records.
- vNext now: src/components/placements/super-admin-needs-attention.tsx:15-24; src/components/placements/placement-operations-overview.tsx:37-48 — VNext total number of queue entries/drive rows not affected record count.
- Fix: Align precise count definition.

## G2-10-017-087  [P1] GAP  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:41-45,523-597 — Active 60 card grid, attention badge, duplicate/extend actions is principal operator view.
- vNext now: src/components/placements/placement-operations-overview.tsx:37-110; src/components/placements/super-admin-drive-quick-search.tsx:36-46 — New reports/funnel and flat quicksearch rows take precedence; primary card screen gone.
- Fix: Rebuild card-first landing with attention above it.

## G2-17-030-007  [P1] GAP  facet F02  effort L
- Legacy: Active drives 24/12/8/6 responsive card grid, 16px gutters; DrivesLanding.js:522-528
- vNext now: vNext Job portfolio linear divide-y rows; placement-operations-overview.tsx:100-107
- Fix: Render active drives as 1/2/3/4 column compact cards with avatar/tags/menu; retain archive table separately.

## G2-17-030-012  [P1] MISSING  facet F03  effort M
- Legacy: Each active card has More actions dropdown with Duplicate as new drive and Extend deadline; DrivesLanding.js:565-584
- vNext now: vNext portfolio row Open drive only, separate deadline page and clone flow; placement-operations-overview.tsx:100-106; super-admin-drive-deadline.tsx:9-58
- Fix: Restore visible per-card More actions menu with exact labels and linked modal flows.

## G2-17-030-013  [P1] GAP  facet F04  effort M
- Legacy: ActiveTotal from filtered `status=active` size60 and allTotal from size1 count; DrivesLanding.js:98-125
- vNext now: vNext operations jobs all non-archived and metric active count PUBLISHED; placement-operations-overview.tsx:33-37; tpo-operations-service.ts:185-236
- Fix: Document metric status filters, archive inclusion and equality of active/closed/all totals before cloning KPIs.

## G2-17-030-040  [P1] GAP  facet F12  effort M
- Legacy: Live status derives active only with no draft/closed and search recent 60; DrivesLanding.js:105-124,197-208
- vNext now: vNext job portfolio includes all non-archived including DRAFT/CLOSED; placement-operations-overview.tsx:100-107
- Fix: Filter landing cards PUBLISHED/current active only, link archive for drafts/closed.

## G2-17-030-029  [P2] MISSING  facet F08  effort S
- Legacy: Active zero `No active drives yet` with `Create your first drive`; search zero `No active drives match your search` + Clear; DrivesLanding.js:511-521
- vNext now: vNext portfolio no dedicated zero action; placement-operations-overview.tsx:100-107
- Fix: Implement exact two empty-state branches and CTAs in active grid.
