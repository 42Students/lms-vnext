# Work packet: edit src/components/academics/college-structure-directory.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u003-college-admin-classes.md, docs/audit/gap2/lane-5/u010-classes-shared-component.md, docs/audit/gap2/lane-9/college-admin-electives.md

## G2-5-003-012  [P1] GAP  facet F04 Data format  effort M
- Legacy: Missing program/batch name labels 'Name unavailable (ID X)'. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:391-395)
- vNext now: Inner join excludes orphaned program/batch links, so no fallback display. (src/modules/academics/college-structure-directory-service.ts:77-87; src/components/academics/college-structure-directory.tsx:390-392)
- Fix: Expose scoped broken-reference rows with explicit fallback rather than silently drop.

## G2-5-003-014  [P1] GAP  facet F04 Data format  effort M
- Legacy: Student count via per-class learner lookup; Unavailable tag on failure. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:399-402)
- vNext now: Active enrollments computed only for active memberships and enrollments; no Unavailable indicator. (src/modules/academics/college-structure-directory-service.ts:129-159; src/components/academics/college-structure-directory.tsx:394)
- Fix: Distinguish unknown count due to failed dependency read from verified zero.

## G2-5-003-019  [P1] GAP  facet F05 Tables/lists  effort M
- Legacy: Page size defaults25, persists preference; choices10/25/50/100, show range summary. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:149-163; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:499-505)
- vNext now: Zod default pageSize10 although UI prints '25 per page'; fixed Prev/Next links. (src/modules/academics/college-structure-directory-model.ts:3-18; src/components/academics/college-structure-directory.tsx:448-459)
- Fix: Fix mismatched page-size label and offer legacy size selector persisted between visits.

## G2-5-003-033  [P1] GAP  facet F07 Validation/errors  effort L
- Legacy: Option failures, row delete error and stale-fetch error have distinct retry banners. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:429-433; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:477-484)
- vNext now: Server loaders await; no comparable independent retry states. (src/app/(authenticated)/college/classes/page.tsx:31-34; src/components/academics/college-structure-directory.tsx:364-378)
- Fix: Add distinct Retry options/list/delete error states with old data retained.

## G2-5-003-054  [P1] GAP  facet F13 States  effort M
- Legacy: First load TableSkeleton 8x8, refreshing state retains rows and Retry on failed refresh. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:496-509)
- vNext now: SSR list no page-specific skeleton, empty state describes filters, no retry control. (src/app/(authenticated)/college/classes/page.tsx:31-35; src/components/academics/college-structure-directory.tsx:364-378)
- Fix: Restore skeleton/refresh/stale-data retry states.

## G2-5-010-055  [P1] GAP  facet F13 States  effort M
- Legacy: TableSkeleton8x8 initial loading, RefreshStatus on refetch (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:496-509)
- vNext now: SSR results, no 8x8 skeleton/refresh in workspace (src/app/(authenticated)/college/classes/page.tsx:31-34; src/components/academics/college-structure-directory.tsx:364-378)
- Fix: Implement loading skeleton + refresh with stale data.

## G2-9-007-004  [P1] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:193-200` — Slot opens a drawer preserving list page
- vNext now: `src/components/academics/college-structure-directory.tsx:430-438` — Open links /college/electives/{slotId}, but target page.tsx absent on main
- Fix: Implement correct slot detail destination or integrated drawer

## G2-9-007-018  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:202-210` — Search name/program/description; select Semester 1-12 and includeArchived
- vNext now: `src/components/academics/college-structure-directory.tsx:51-80` — URL query name/program only, semester within advanced exact number, status selector
- Fix: Search description and add exact quick filters

## G2-9-007-056  [P1] MISSING  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:197-200` — Slot drawer Could not refresh this elective slot and Retry
- vNext now: `src/components/academics/college-structure-directory.tsx:430-438` — Open points to missing detail page and has no retry state
- Fix: Implement detail-load error and retry
