# Work packet (wave 2): edit src/app/(authenticated)/tpo/placements/lifecycle/page.tsx (part 2 of 2)

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l16-u031-placements-end-to-end.md, docs/audit/gap2/lane-16/u031-placements-end-to-end.md, docs/audit/gap2/lane-11/tpo-drives-index.md

## G2-16-031-012  [P2] GAP  facet F05  effort M
- Legacy: tpo/drives/index.js:22-43 Requests/Drafts/Live/Closed tab-filter lifecycle statuses
- vNext now: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:24-48 fetches view query and counts
- Fix: Compare request SENT_BACK grouping, active tab URL/default, counts, and page reset on view switch

## G2-16-031-013  [P2] GAP  facet F05  effort M
- Legacy: tpo/drives/index.js:83-113 supports date windows TODAY/WEEK/LATER/PASSED/NONE/OUTSIDE and applied/offers numeric ranges
- vNext now: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:22-47 has deadline/minApplied/maxApplied/minOffers/maxOffers filters
- Fix: Use same inclusive threshold and server-time classification; retain explicit outside/no deadline options

## G2-16-031-052  [P2] GAP  facet F19  effort M
- Legacy: tpo/drives/index.js:93-113 computes filters client-side over loaded drives
- vNext now: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:24-48 queries filtered server list and 50-70 creates scoped export
- Fix: Ensure server counts reflect entire selection, not just current page; preserve sort/filter consistency under high volume

## G2-16-031-070  [P2] GAP  facet F16  effort M
- Legacy: tpo/drives/index.js:295-359 TpoDataTable has mobile responsive columns `responsive:['sm']`, hidden uniform fields.
- vNext now: tpo/placements/lifecycle/page.tsx:320-376 stacks compact cards and exposes dropdown actions; no horizontal table.
- Fix: Match old table column density at desktop and compact mobile two-line drive card behavior.

## G2-16-031-075  [P2] GAP  facet F17  effort S
- Legacy: tpo/drives/index.js:405-408 Needs doing group has role=group aria-label `Needs doing` and chip aria-pressed.
- vNext now: tpo/placements/lifecycle/page.tsx:102-119 nav aria-label `Needs doing` uses links not pressed buttons.
- Fix: Apply aria-current=page (or aria-pressed on toggles) for active Needs doing filter.

## G2-16-031-082  [P2] GAP  facet F19  effort M
- Legacy: tpo/drives/index.js:142-157 loads all scoped drives once, DataTable paginates client with sorting.
- vNext now: tpo-drive-lifecycle-list-model.ts:40-46 fixed 25 per page, lifecycle/page.tsx:387-389 Prev/Next navigation.
- Fix: Restore 10/25/50/100 size chooser, visible row range and same sort controls.

## G2-11-012-020  [P3] GAP  facet F03  effort S
- Legacy: More for {company} aria-label on small ellipsis icon. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:373`
- vNext now: Dropdown trigger More ··· and label More actions for company/title. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:354`
- Fix: Match icon-only trigger and accessible name.

## G2-11-012-021  [P3] GAP  facet F03  effort S
- Legacy: Title Drives has Create drive Plus icon. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:385`
- vNext now: Primary link no Plus icon. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:100`
- Fix: Restore plus icon.

## G2-11-012-079  [P3] GAP  facet F16  effort S
- Legacy: Mode column defaultHidden always. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:321`
- vNext now: Work mode always shown in status line. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:326`
- Fix: Match default columns and visibility.
