# Work packet (wave 2): edit src/app/(authenticated)/college/placements/page.tsx

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-index.md

## G2-9-016-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/index.js:10-18` — /college-admin/jobs is primary drives landing and Redux activeMenuItem jobs.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:12-23` — /college/placements PageHeader Placement Drives; no explicit active menu state.
- Fix: Recreate jobs/placements navigation highlight and entry address.

## G2-9-016-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/index.js:33-39` — AdminLayout JobsErrorBoundary and AdminGroupShell placements wrap DrivesLanding.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:20-45` — App Router layout with standalone PageHeader, nav and PlacementOperationsWorkspace.
- Fix: Match old college admin grouped placement shell and error boundaries.

## G2-9-016-003  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/index.js:19-29` — Absent college shows warning Admin not assigned to a college, detailed contact guidance.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:14-17` — EmptyState with same heading but different Contact your college administrator copy.
- Fix: Use exact legacy warning and description/icon.

## G2-9-016-005  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:259-260` — All drives navigates /college-admin/jobs/all and below cards includes closed/draft count.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:34-37` — All drives nav to /college/placements/drives, no inactive count by link.
- Fix: Show All drives (including N closed/draft) and link full list.

## G2-9-016-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:248-262` — PlacementsPageOverview: title, description, four metric tiles, New drive and All drives actions.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:22-37` — Header title/desc, New drive, separate nav Interviews/All drives, metrics absent from head.
- Fix: Restore four headline metric cards immediately under heading.

## G2-9-016-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:389-454` — Needs attention yellow Card comes before active drives search/cards.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:34-45` — Attention within Disclosure hidden by default when zero, then OperationsWorkspace.
- Fix: Display attention status by default above active cards.

## G2-9-016-013  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:656-702` — Create/Duplicate modal then Extend deadline modal at end.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:26-31` — New drive links to full page, no landing modal.
- Fix: Recreate modal behavior and initial field defaults.

## G2-9-016-015  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:259-260` — Primary New drive plus icon and secondary All drives.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:25-36` — New drive link without PlusOutlined, All drives within separate nav.
- Fix: Match icon/button styles/order.

## G2-9-016-022  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:490-493` — New Drive in active drives toolbar duplicates top New drive action.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:22-36` — Only one New drive action in PageHeader.
- Fix: Provide secondary New Drive next to search as legacy.

## G2-9-016-023  [P2] MISSING  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:602-607` — Data retention report toggle with DatabaseOutlined and chevron up/down.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:20-45` — No retention toggle.
- Fix: Restore collapsible housekeeping action with icon.

## G2-9-016-041  [P2] MISSING  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:486-491` — Search Input.Search allowClear, width240, placeholder Search by drive or company.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:34-39` — No input at landing view.
- Fix: Add 240px search input with placeholder and clear.

## G2-9-016-042  [P2] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:603-605` — Retention report disclosure toggles lazy GET 180 days, no mutation.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:38-45` — No retention controls.
- Fix: Add read-only expandable report, no delete.

## G2-9-016-070  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:389-407` — Attention section has independent skeleton, retry/failure/success.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:19-20` — Whole page awaits attention, no skeleton/retry local.
- Fix: Add independently suspense-driven attention fetch boundary.

## G2-9-016-080  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:498-506` — Responsive toolbar search width240 and New Drive button.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:22-36` — Header one New drive link; mobile nav stacks.
- Fix: Match inline toolbar and fallbacks at sm breakpoints.

## G2-9-016-084  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:248-260` — Title Placement Drives, description Run active hiring drives from one operational view. Attention items surface decisions...
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:22-24` — Title same, description Placement operations inside your active college membership.
- Fix: Match legacy descriptive copy exactly.

## G2-9-016-086  [P2] MISSING  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:486-489` — Search placeholder Search by drive or company.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:20-45` — No search input.
- Fix: Use exact placeholder in active list.

## G2-9-016-094  [P2] MISSING  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:215-226` — Search query shallow replace preserves other route params.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:34-45` — No active search/form, no q preservation.
- Fix: Implement scoped q URL query without dropping returnTo.
