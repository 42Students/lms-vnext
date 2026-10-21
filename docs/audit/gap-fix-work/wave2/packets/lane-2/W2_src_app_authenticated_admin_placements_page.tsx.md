# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/page.tsx

23 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-all.md, docs/audit/gap2/lane-10/superadmin-jobs-index.md, docs/audit/gap2/lane-11/l17-u030-drives-landing.md, docs/audit/gap2/lane-6/l17-u030-superadmin-drives-landing.md, docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md

## G2-10-016-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/all.js:10-14,32-39 — Secondary flat list accessed from primary Drives card-grid landing, within SuperAdminGroupShell placements.
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:50-76; src/app/(authenticated)/admin/placements/drives/page.tsx:68-80 — vNext has full directory secondary to placement overview, but heading/tab shell different.
- Fix: Restore group shell and quiet 'All drives' return.

## G2-10-016-084  [P2] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/all.js:10-14; docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:669-757 — All drives is secondary flat table, selected college, old Jobs look.
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:50-76; src/app/(authenticated)/admin/placements/drives/page.tsx:68-105 — Secondary flat list exists, but table appearance and toolbar differ.
- Fix: Clone list shell/controls rather than invent new module.

## G2-10-017-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/index.js:10-14,27-34 — SuperAdminGroupShell `placements` wraps DrivesLanding under SuperAdminLayout.
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:50-76 — PageHeader plus PlacementOversightNav and PlacementOperationsWorkspace, no matching group shell.
- Fix: Recreate old grouped module shell/nav.

## G2-10-017-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/index.js:12-25 — Missing college shows Ant warning 'Select a college to continue', exact instruction.
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:40-53 — EmptyState with same title/description, but no warning icon/background.
- Fix: Use legacy yellow warning block.

## G2-10-017-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:248-265 — Primary title 'Placement Drives', CTAs New drive and All drives.
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:56-75 — Title Drives, New drive only, All drives appears as main nav tab.
- Fix: Restore heading/adjacent All drives action.

## G2-10-017-007  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:267-385 — Policy Card full 2-column grid before attention, visible by default.
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:73-85; src/components/placements/super-admin-platform-placement-policy.tsx:62-81 — Policy Disclosure collapsed below operations, platform-wide fields.
- Fix: Place visible legacy policy block with correct scope.

## G2-10-017-010  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:599-654 — Read-only retention report inline collapsed, then inline StudentPlacementLookup.
- vNext now: src/app/(authenticated)/admin/placements/retention/page.tsx:14-42; src/app/(authenticated)/admin/placements/page.tsx:73-85 — Retention separate route/tab; student lookup link under Related directories.
- Fix: Restore collapsed report and lookup on landing.

## G2-10-017-030  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:656-672 — New/Duplicate modal width800, JobForm prefilled for duplicate.
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:64-75 — New drive opens route; duplicate accessible elsewhere.
- Fix: Match modal and return-on-success refresh.

## G2-10-017-041  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:656-672 — New/Duplicate create a width800 Modal, focus and cancel handling.
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:64-75 — New drive navigates full page, duplicate elsewhere.
- Fix: Match overlay hierarchy and focus restore.

## G2-10-017-071  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:248-261 — Exact heading 'Placement Drives'; buttons 'New drive', 'All drives'.
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:58-75 — Title 'Drives', New drive only; oversight tabs.
- Fix: Restore copy and hierarchy.

## G2-10-017-083  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:599-654 — Read-only retention sample and StudentPlacementLookup embedded under drives.
- vNext now: src/app/(authenticated)/admin/placements/retention/page.tsx:14-42; src/app/(authenticated)/admin/placements/page.tsx:21-55 — Dedicated retention route and linked lookup.
- Fix: Restore inline composition or document navigation decision.

## G2-17-030-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy shared component under `/superadmin/jobs` and `/college-admin/jobs`, basePath preserved for all internal links; DrivesLanding.js:47-51,227-232
- vNext now: vNext `/admin/placements` overview and `/admin/placements/drives` directory, college equivalent `/college/placements`; admin/placements/page.tsx:22-86; admin/placements/drives/page.tsx:16-115
- Fix: Preserve legacy job landing deep links and contextual returnTo across selected admin/college roles.

## G2-17-030-002  [P2] GAP  facet F01  effort M
- Legacy: Page head Placement Drives, four KPIs, New drive, All drives; DrivesLanding.js:248-263
- vNext now: Admin placements has Drives header/New drive only, 4 metrics nested in operations overview; admin/placements/page.tsx:61-84; placement-operations-overview.tsx:31-44
- Fix: Consolidate old header, four KPI layout and both actions above attention rather than split main and directory.

## G2-17-030-004  [P2] GAP  facet F02  effort L
- Legacy: Section order: header metrics, global Placements policy, Needs attention, Active drives grid, All drives link, retention disclosure, student lookup; DrivesLanding.js:246-263,264-388,390-655
- vNext now: vNext head, oversight nav, Related directories, operations metrics, attention, funnel, upcoming rounds, search, job portfolio, policy; admin/placements/page.tsx:61-86; placement-operations-overview.tsx:31-109
- Fix: Restore old order/spacing; move extra funnel/upcoming/season into separate secondary sections after active drive cards.

## G2-17-030-005  [P2] GAP  facet F02  effort M
- Legacy: Policy Ant Card size small, 2 cols, help text, needs-attention rules inline; DrivesLanding.js:266-386
- vNext now: Admin policy Disclosure separate below overview and custom editor grid; admin/placements/page.tsx:80-85; super-admin-platform-placement-policy.tsx:49-81
- Fix: Match Ant compact card margins/gutters and global policy placement before attention.

## G2-17-030-008  [P2] GAP  facet F03  effort S
- Legacy: Old title Placement Drives and description from PlacementsPageOverview; DrivesLanding.js:248-255
- vNext now: New page title Drives, same description; admin/placements/page.tsx:60-69
- Fix: Change landing heading to `Placement Drives` and keep description exact.

## G2-17-030-050  [P2] GAP  facet F18  effort S
- Legacy: Legacy labels `Placement Drives`, `New Drive`, `All drives`, `Active drives (N)`; DrivesLanding.js:248-263,461-495
- vNext now: vNext `Drives`, `New drive`, `Job portfolio` and `Open drive`; admin/placements/page.tsx:60-75; placement-operations-overview.tsx:100-106
- Fix: Restore exact capitalization and headings for cloned landing.

## G2-17-030-069  [P2] GAP  facet F18  effort S
- Legacy: Legacy title Placement Drives and New drive header vs New Drive toolbar capitalization. `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:248`
- vNext now: vNext title Drives and only New drive link. `src/app/(authenticated)/admin/placements/page.tsx:61`
- Fix: Match exact casing of both CTA locations and page title.

## G2-15-026-003  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:139-198 jobs list and per-job detail precede applicant dashboard
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:59-83 PageHeader, oversight nav, directories, operations workspace, policy
- Fix: Reorder main admin placements sections per legacy page shell if strict UI parity

## G2-15-026-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:845-930 metrics, funnel and company report independently available
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:72-83 operations workspace then policy; src/modules/placements/report-service.ts:63-144 report workspace separate
- Fix: Recreate hiring metrics/funnel/company report sections or direct labelled links

## G2-15-026-042  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:146-162 missing org context 403 and catches generic 500
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:34-48 explicit 'Select a college to continue' state
- Fix: Keep actionable scope reset without hiding org/global records

## G2-15-026-052  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:41-48 'Placement Job Management APIs' and legacy Jobs vocabulary
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:37-39,61-69 'Drives'/'New drive'
- Fix: Use exact old Jobs heading/menu where page is a clone or document intentional name change

## G2-17-030-047  [P3] GAP  facet F16  effort S
- Legacy: Search 240px on desktop; wrap New Drive, title row flex-wrap gap12; DrivesLanding.js:461-495
- vNext now: vNext quick search separated and page header one CTA; placement-operations-overview.tsx:95-105; admin/placements/page.tsx:61-75
- Fix: Restore desktop 240px search and action wrap at 320px; compare screenshots.
