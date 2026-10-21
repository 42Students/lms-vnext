# Work packet: edit src/app/(authenticated)/learn/my-placements/placement/page.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-cell.md, docs/audit/gap2/lane-16/u023-learner-placement-controller.md, docs/audit/gap2/lane-8/learner-placement-rules-moved.md

## G2-12-005-004  [P1] GAP  facet F02  effort S
- Legacy: Page order: debarments/absence warnings, registration, your requests, full inline placement rules `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:160-237`
- vNext now: Registration first, help/resources, alerts, official offers, two request sections, rules link `src/app/(authenticated)/learn/my-placements/placement/page.tsx:33-92`
- Fix: Recreate legacy section and alert order; classify intentional extra offers

## G2-12-005-006  [P1] MISSING  facet F02  effort S
- Legacy: Placement rules rendered inline with PlacementRules component `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:234-237`
- vNext now: Rules only a link to `/learn/my-placements/rules?from=cell` `src/app/(authenticated)/learn/my-placements/placement/page.tsx:89-92`
- Fix: Embed rules summary/content or explicitly approve standalone navigation

## G2-12-005-007  [P1] GAP  facet F03  effort S
- Legacy: Debarment alerts red with reason and expiry, attendance absence warnings with quick dispute `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:162-173`
- vNext now: Shows generic persisted personal alerts component instead of debarment+absence source cards `src/app/(authenticated)/learn/my-placements/placement/page.tsx:49-56`
- Fix: Restore event-specific debarment and absence action cards

## G2-12-005-086  [P1] GAP  facet F23  effort S
- Legacy: Legacy rules shown inline `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:234-237`
- vNext now: Rules moved to separate linked page `src/app/(authenticated)/learn/my-placements/placement/page.tsx:89-92`
- Fix: Restore inline preview/full text per owner requirement

## G2-16-023-009  [P1] GAP  facet F04  effort M
- Legacy: LearnerPlacementService.java:38-44 offers include roleOption, ctcLpa, joiningDate, respondBy, letterUrl, release, channel/dispute.
- vNext now: placement/page.tsx:67-75 maps annualCtcInr, expiresAt, status, joining, channels but letterUrl not forwarded.
- Fix: Restore offer letter download in placement card or linked offers detail.

## G2-16-023-011  [P1] GAP  facet F04  effort M
- Legacy: LearnerPlacementService.java:47-48 debarment id,reason,untilDate,untilDrives.
- vNext now: placement/page.tsx:25-31 no debarment read in Promise.all.
- Fix: Load active debarments as distinct authoritative data source.

## G2-16-023-040  [P1] GAP  facet F14  effort M
- Legacy: LearnerPlacementService.java:38-44 letterUrl included in offers.
- vNext now: placement/page.tsx:73-75 mapper omits letterUrl.
- Fix: Surface secure offer letter download with signed URL expiry/permissions.

## G2-16-023-056  [P1] GAP  facet F23  effort M
- Legacy: LearnerPlacementService.java:47-48 debarments and notices in overview.
- vNext now: placement/page.tsx:25-31 no distinct debarment/list read, uses alerts.
- Fix: Expose explicit debarment status with dispute navigation.

## G2-8-5-001  [P1] GAP  facet F01  effort M
- Legacy: Old bookmark automatically routes to /learn/my-placements/placement#rules (`docs/legacy-source/frontend/src/pages/learn/my-placements/rules.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: Same bookmark path now renders its own complete rules page (`src/app/(authenticated)/learn/my-placements/rules/page.tsx:8-136; src/modules/placements/learner-placement-rules-service.ts:24-70; src/app/(authenticated)/learn/my-placements/placement/page.tsx:89-92`)
- Fix: Provide legacy redirect compatibility or record intentional canonical-route break

## G2-8-5-037  [P1] MISSING  facet F23  effort M
- Legacy: Old route auto-redirected with three-row transition placeholder (`docs/legacy-source/frontend/src/pages/learn/my-placements/rules.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: Redirect behavior absent on replacement route (`src/app/(authenticated)/learn/my-placements/rules/page.tsx:8-136; src/modules/placements/learner-placement-rules-service.ts:24-70; src/app/(authenticated)/learn/my-placements/placement/page.tsx:89-92`)
- Fix: Resolve explicit compatibility policy before UI fixes; preserve old bookmarks

## G2-12-005-034  [P2] GAP  facet F07  effort S
- Legacy: Malformed overview response fails with warning not silent empty data `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:23-25,44-58`
- vNext now: Per-source optional fallback for alerts and requests; registration error propagates `src/app/(authenticated)/learn/my-placements/placement/page.tsx:25-32`
- Fix: Expose malformed source warnings per facet, avoid misleading empties
