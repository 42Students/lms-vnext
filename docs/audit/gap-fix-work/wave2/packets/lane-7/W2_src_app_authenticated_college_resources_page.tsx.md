# Work packet (wave 2): edit src/app/(authenticated)/college/resources/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/college-admin-lesson-content.md

## G2-18-007-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy route sets active menu item `lesson-content` (`college-admin/lesson-content.js:18-20`).
- vNext now: New content pages show own PageHeader and navigation (`college/videos/page.tsx:33-35`; `college/resources/page.tsx:34-36`).
- Fix: Keep Courses & Content nav active and tab state matching requested type.

## G2-18-007-003  [P2] GAP  facet F01  effort S
- Legacy: Old no-college warning `Admin not assigned to a college`, contact administrator instruction (`college-admin/lesson-content.js:22-31`).
- vNext now: New returns CollegeCourseMissingScope for missing membership (`college/videos/page.tsx:18-19`; `college/resources/page.tsx:19-20`).
- Fix: Use same warning/copy under secure current college-membership gate.

## G2-18-007-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy uses AdminGroupShell > PageShell with content-tab strip in one module card (`AdminGroupShell.jsx:14-29`; `PageShell.jsx:50-89`).
- vNext now: New uses PageHeader with space-y-4/6, no local tab wrapper (`college/videos/page.tsx:33-44`; `college/resources/page.tsx:34-43`).
- Fix: Restore old grouped tab canvas, radius and padding, keep guarded access.

## G2-18-007-006  [P2] GAP  facet F02  effort M
- Legacy: Resources old H2, help, 3-select toolbar, Ant table (`AdminResources.js:324-362,374-378`).
- vNext now: New header plus authoring section and filterable aggregate (`college/resources/page.tsx:34-42`).
- Fix: Match old resource header/toolbar/table layout and spacing.

## G2-18-007-061  [P2] GAP  facet F13  effort M
- Legacy: Old Resources 6×5 skeleton and `Refreshing resources…` partial spinner (`AdminResources.js:363-378`).
- vNext now: New SSR aggregate no equivalent inline Resource skeleton (`college/resources/page.tsx:33-42`; `college-content-aggregate.tsx:180-192`).
- Fix: Restore table-skeleton and refresh-in-progress visual states.

## G2-18-007-010  [P3] GAP  facet F03  effort S
- Legacy: Old Resources H2 subtitle describes files, links, notes (`AdminResources.js:325-328`).
- vNext now: New Resources PageHeader no help description (`college/resources/page.tsx:34-37`).
- Fix: Restore literal `Give a lesson reading material: files, links and notes, together in one resource.`
