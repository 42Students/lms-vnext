# Work packet (wave 2): edit src/app/(authenticated)/admin/assignments/page.tsx

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md

## G2-4-007-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy `/superadmin/assignments` uses SuperAdminLayout and content group tabs. (`docs/legacy-source/frontend/src/pages/superadmin/assignments.js:2-5;docs/legacy-source/frontend/src/pages/superadmin/assignments.js:23-32`)
- vNext now: New `/admin/assignments` mounted under admin layout SuperAdminLegacyGroupTabs. (`src/app/(authenticated)/admin/assignments/page.tsx:15-35;src/app/(authenticated)/admin/layout.tsx:1-15`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-004  [P2] GAP  facet F02  effort M
- Legacy: PageShell content group tabs, heading Assignments, filters/actions, AntD Table, modal builder. (`docs/legacy-source/frontend/src/pages/superadmin/assignments.js:23-27;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:384-435`)
- vNext now: PageHeader, inline create, directory FilterBar, record cards, export bottom. (`src/app/(authenticated)/admin/assignments/page.tsx:50-62;src/components/courses/admin-assessment-read-directory.tsx:26-116`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy table action bar sits top right of filter row. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:401-421`)
- vNext now: Export below record list; create above filters. (`src/app/(authenticated)/admin/assignments/page.tsx:50-62;src/components/courses/admin-assessment-read-directory.tsx:34-61`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy edit/creation in centered width720 Modal. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:275-289`)
- vNext now: CollegeAssignmentCreate inline rendered above directory. (`src/app/(authenticated)/admin/assignments/page.tsx:52-56;src/components/courses/college-assignment-create.tsx:91-163`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-007  [P2] GAP  facet F03  effort M
- Legacy: Button Create Assignment with plus icon, disabled if course options inaccessible. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:415-419`)
- vNext now: Inline Create New Assignment input form, warning if options unavailable. (`src/app/(authenticated)/admin/assignments/page.tsx:52-56;src/components/courses/college-assignment-create.tsx:91-99`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-008  [P2] GAP  facet F03  effort M
- Legacy: Export CSV (page) toolbar button disabled when page empty. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:415-419`)
- vNext now: Bottom `Export` link available regardless row count. (`src/app/(authenticated)/admin/assignments/page.tsx:58-61`)
- Fix: Offer page-only CSV export and disable when no rows.

## G2-4-007-043  [P2] GAP  facet F13  effort M
- Legacy: Course vs section lookups have their own warnings/retry. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:391-400`)
- vNext now: New option error one combined banner. (`src/app/(authenticated)/admin/assignments/page.tsx:52-56`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-051  [P2] GAP  facet F18  effort M
- Legacy: Toolbar Create Assignment, Export CSV (page). (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:415-419`)
- vNext now: New Export, inline Create New Assignment. (`src/app/(authenticated)/admin/assignments/page.tsx:58-61;src/components/courses/college-assignment-create.tsx:91-99`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-010-104  [P2] GAP  facet F02  effort M
- Legacy: Shared list Ant Design table is within same card with right aligned Create/Export toolbar. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:384-435`)
- vNext now: SA AdminAssessmentDirectory renders header, filter, stacked assessment cards and bottom Export link. (`src/app/(authenticated)/admin/assignments/page.tsx:50-62;src/components/courses/admin-assessment-read-directory.tsx:26-116`)
- Fix: Move Create/Export into same top-right toolbar, restore table card and controls.

## G2-4-010-105  [P2] GAP  facet F03  effort M
- Legacy: Table `Export CSV (page)` disabled when 0 displayed, icon DownloadOutlined. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:415-419`)
- vNext now: New SA bottom Export hyperlink has no disabled rule. (`src/app/(authenticated)/admin/assignments/page.tsx:58-61`)
- Fix: Provide exact page export button with disabled zero-record state, download icon and filename.

## G2-4-010-106  [P2] GAP  facet F03  effort M
- Legacy: Create Assignment button (+ icon) in top toolbar, disabled if no authorized course options. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:415-419`)
- vNext now: New inline creation form occupies page intro, creation options absent shows generic banner. (`src/app/(authenticated)/admin/assignments/page.tsx:52-56;src/components/courses/college-assignment-create.tsx:91-99`)
- Fix: Show modal-opening Create Assignment button at original toolbar position; disable when no course.

## G2-4-010-128  [P2] GAP  facet F18  effort M
- Legacy: Shared section heading `Assignments` and `Create Assignment`, `Export CSV (page)`, `Publish grades`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:384-435`)
- vNext now: SA PageHeader `Assignments`, action `Export`, inline `Create New Assignment`. (`src/app/(authenticated)/admin/assignments/page.tsx:50-62;src/components/courses/college-assignment-create.tsx:91-99`)
- Fix: Copy legacy action labels exactly.

## G2-4-007-002  [P3] GAP  facet F01  effort S
- Legacy: If no selected college, displays Select a college to continue and Choose a college in header above. (`docs/legacy-source/frontend/src/pages/superadmin/assignments.js:8-22`)
- vNext now: Same title/description text in EmptyState with PageHeader. (`src/app/(authenticated)/admin/assignments/page.tsx:32-35`)
- Fix: Match legacy warning Alert icon, border, spacing.

## G2-4-010-103  [P3] GAP  facet F01  effort S
- Legacy: Super Admin has missing scope warning Select a college to continue, not this component's own action. (`docs/legacy-source/frontend/src/pages/superadmin/assignments.js:10-22`)
- vNext now: New same heading/content in EmptyState, lacks warning icon and info box. (`src/app/(authenticated)/admin/assignments/page.tsx:32-35`)
- Fix: Render legacy AntD warning geometry and icon, retain exact copy.
